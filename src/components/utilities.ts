import * as models from './models'
import { Value } from 'slate'

/**
 * Recursively walk up DOM tree until root or parent with non-static position is found.
 * (relative, fixed, or absolute) which will be used as reference for absolutely positioned elements within it
 */
export const getRelativeParent = (element: HTMLElement | null): HTMLElement => {
    if (!element) {
        return document.body
    }

    const position = window.getComputedStyle(element).getPropertyValue('position')
    if (position !== 'static') {
        return element
    }

    return getRelativeParent(element.parentElement)
};

export const convertEntitiesAndTextToTokenizedEditorValue = (text: string, labeledEntities: models.ILabel<any>[]): models.SlateValue => {
    const labeledTokens = labelTokens(tokenizeText(text, tokenizeRegex), labeledEntities)
    return convertToSlateValue(labeledTokens)
}

/**
 * Note: this is more like a negative match used to determine characters that split the string instead of 
 * positive match would specify characters which are tokens. Only chose this because it seems like a much
 * simpler regex / smaller set of characters, but I imagine alternative approach would work
 */
export const tokenizeRegex = /\s+|[.?,!]/g

export const tokenizeText = (text: string, tokenRegex: RegExp = tokenizeRegex): models.IToken[] => {
    const tokens: models.IToken[] = []
    if (text.length === 0) {
        return tokens
    }

    let result: RegExpExecArray | null = null 
    let lastIndex = tokenRegex.lastIndex
    // tslint:disable-next-line:no-conditional-assignment
    while ((result = tokenRegex.exec(text)) !== null) {
        const matchedText = text.substring(lastIndex, result.index)
        tokens.push(...[
            {
                text: matchedText,
                isSelectable: true,
                startIndex: lastIndex,
                endIndex: result.index
            },
            {
                text: result[0],
                isSelectable: false,
                startIndex: result.index,
                endIndex: result.index + result[0].length
            }
        ])

        lastIndex = tokenRegex.lastIndex
    }

    const endIndex = text.length
    tokens.push({
        text: text.substring(lastIndex, endIndex),
        isSelectable: true,
        startIndex: lastIndex,
        endIndex
    })

    return tokens
}

interface ICustomEntityWithTokenIndices extends models.ILabel<any> {
    startTokenIndex: number
    endTokenIndex: number
}

/**
 * Similar to findIndex, but finds last index by iterating array items from end/right instead of start/left
 * @param xs Array
 * @param f Predicate function
 */
export const findLastIndex = <T>(xs: T[], f: (x: T) => boolean): number => {
    // tslint:disable-next-line:no-increment-decrement
    for (let i = xs.length - 1; i >= 0; i--) {
        if (f(xs[i])) {
            return i
        }
    }

    return -1
}

export const addTokenIndicesToCustomEntities = (tokens: models.IToken[], labeledEntities: models.ILabel<any>[]): ICustomEntityWithTokenIndices[] => {
    return labeledEntities.map<ICustomEntityWithTokenIndices>(ce => {
        const startTokenIndex = tokens.findIndex(t => t.isSelectable === true && ce.startIndex < t.endIndex && t.endIndex <= ce.endIndex)
        const endTokenIndex = findLastIndex(tokens, t => t.isSelectable === true && ce.startIndex <= t.startIndex && t.startIndex < ce.endIndex)
        if (startTokenIndex === -1 || endTokenIndex === -1) {
            console.warn(`Could not find valid token for custom entity: `, ce)
        }

//         if (startTokenIndex !== -1 && endTokenIndex !== -1) {
//             const startToken = tokens[startTokenIndex]
//             const endToken = tokens[endTokenIndex]

//             console.log(`
// token indices found:
// ce.startIndex: ${ce.startIndex}
// ce.endIndex: ${ce.endIndex}

// startTokenIndex: ${startTokenIndex}
// startToken.isSelectable: ${startToken.isSelectable}
// startToken.startIndex: ${startToken.startIndex}
// startToken.endIndex: ${startToken.endIndex}

// endTokenIndex: ${endTokenIndex}
// endToken.isSelectable: ${endToken.isSelectable}
// endToken.startIndex: ${endToken.startIndex}
// endToken.endIndex: ${endToken.endIndex}
// `)
//         }

        return {
            ...ce,
            startTokenIndex,
            endTokenIndex: endTokenIndex + 1
        }
    })
}

export const wrapTokensWithEntities = (tokens: models.IToken[], customEntitiesWithTokens: ICustomEntityWithTokenIndices[]): models.TokenArray => {
    // If there are no entities than no work to do, return tokens
    if (customEntitiesWithTokens.length === 0) {
        return tokens
    }
    
    const sortedCustomEntities = [...customEntitiesWithTokens].sort((a, b) => a.startIndex - b.startIndex)
    // Include all non labeled tokens before first entity
    const firstCet = sortedCustomEntities[0]
    const tokenArray: models.TokenArray = [...tokens.slice(0, firstCet.startTokenIndex)]

    for (let [i, cet] of Array.from(sortedCustomEntities.entries())) {
        // push labeled tokens
        tokenArray.push({
            entity: cet,
            tokens: tokens.slice(cet.startTokenIndex, cet.endTokenIndex)
        })

        // push non labeled tokens in between this and next entity
        if (i !== sortedCustomEntities.length - 1) {
            const nextCet = sortedCustomEntities[i + 1]
            tokenArray.push(...tokens.slice(cet.endTokenIndex, nextCet.startTokenIndex))
        }
    }

    // Include all non labeled tokens after last entity
    const lastCet = sortedCustomEntities[sortedCustomEntities.length - 1]
    tokenArray.push(...tokens.slice(lastCet.endTokenIndex))

    return tokenArray
}

export const labelTokens = (tokens: models.IToken[], customEntities: models.ILabel<any>[]): models.TokenArray => {
    return wrapTokensWithEntities(tokens, addTokenIndicesToCustomEntities(tokens, customEntities))
}


export const convertToSlateNodes = (tokensWithEntities: models.TokenArray): any[] => {
    const nodes: any[] = []

    // If there are no tokens, just return empty text node to ensure valid SlateValue object
    // In other words non-void parent nodes must have a child.
    if (tokensWithEntities.length === 0) {
        nodes.push({
            "kind": "text",
            "leaves": [
                {
                    "kind": "leaf",
                    "text": '',
                    "marks": []
                }
            ]
        })

        return nodes
    }

    // TODO: Find better way to iterate over the nested array and determine based on flow-control / property types without casting
    for (let tokenOrEntity of tokensWithEntities) {
        if ((tokenOrEntity as models.IEntityPlaceholder).entity) {
            const entityPlaceholder: models.IEntityPlaceholder = tokenOrEntity as any
            const nestedNodes = convertToSlateNodes(entityPlaceholder.tokens)
            nodes.push({
                "kind": "inline",
                "type": models.NodeType.EntityNodeType,
                "isVoid": false,
                "data": entityPlaceholder.entity.data,
                "nodes": nestedNodes
            })
        }
        else {
            const token: models.IToken = tokenOrEntity as any
            if (token.isSelectable) {
                nodes.push({
                    "kind": "inline",
                    "type": models.NodeType.TokenNodeType,
                    "isVoid": false,
                    "data": token,
                    "nodes": [
                        {
                            "kind": "text",
                            "leaves": [
                                {
                                    "kind": "leaf",
                                    "text": token.text,
                                    "marks": []
                                }
                            ]
                        }
                    ]
                })
            }
            else {
                nodes.push({
                    "kind": "text",
                    "leaves": [
                        {
                            "kind": "leaf",
                            "text": token.text,
                            "marks": []
                        }
                    ]
                })
            }
        }
    }

    return nodes
}

export const convertToSlateValue = (tokensWithEntities: models.TokenArray): any => {
    const nodes = convertToSlateNodes(tokensWithEntities)
    const document = {
        "document": {
            "nodes": [
                {
                    "kind": "block",
                    "type": "paragraph",
                    "isVoid": false,
                    "data": {},
                    "nodes": nodes
                }
            ]
        }
    }

    return Value.fromJSON(document)
}

export const convertMatchedTextIntoMatchedOption = <T>(inputText: string, matches: [number, number][], original: T): models.MatchedOption<T> => {
    const matchedStrings = matches.reduce<models.ISegement[]>((segements, [startIndex, originalEndIndex]) => {
        // TODO: For some reason the Fuse.io library returns the end index before the last character instead of after
        // I opened issue here for explanation: https://github.com/krisk/Fuse/issues/212
        let endIndex = originalEndIndex + 1
        const segementIndexWhereEntityBelongs = segements.findIndex(seg => seg.startIndex <= startIndex && endIndex <= seg.endIndex)
        const prevSegements = segements.slice(0, segementIndexWhereEntityBelongs)
        const nextSegements = segements.slice(segementIndexWhereEntityBelongs + 1, segements.length)
        const segementWhereEntityBelongs = segements[segementIndexWhereEntityBelongs]

        const prevSegementEndIndex = startIndex - segementWhereEntityBelongs.startIndex
        const prevSegementText = segementWhereEntityBelongs.text.substring(0, prevSegementEndIndex)
        const prevSegement: models.ISegement = {
            ...segementWhereEntityBelongs,
            text: prevSegementText,
            endIndex: startIndex,
        }

        const nextSegementStartIndex = endIndex - segementWhereEntityBelongs.startIndex
        const nextSegementText = segementWhereEntityBelongs.text.substring(nextSegementStartIndex, segementWhereEntityBelongs.text.length)
        const nextSegement: models.ISegement = {
            ...segementWhereEntityBelongs,
            text: nextSegementText,
            startIndex: endIndex,
        }

        const newSegement: models.ISegement = {
            text: segementWhereEntityBelongs.text.substring(prevSegementEndIndex, nextSegementStartIndex),
            startIndex: startIndex,
            endIndex: endIndex,
            type: models.SegementType.Inline,
            data: {
                matched: true
            }
        }

        const newSegements = []
        if (prevSegement.startIndex !== prevSegement.endIndex) {
            newSegements.push(prevSegement)
        }

        if (newSegement.startIndex !== newSegement.endIndex) {
            newSegements.push(newSegement)
        }

        if (nextSegement.startIndex !== nextSegement.endIndex) {
            newSegements.push(nextSegement)
        }

        return [...prevSegements, ...newSegements, ...nextSegements]
    }, [
            {
                text: inputText,
                startIndex: 0,
                endIndex: inputText.length,
                type: models.SegementType.Normal,
                data: {
                    matched: false
                }
            }
        ]).map(({ text, data }) => ({
            text,
            matched: data.matched
        }))

    return {
        highlighted: false,
        original,
        matchedStrings
    }
}

export const getEntitiesFromValueUsingTokenData = (change: any): models.ILabel<models.IEntityData<any>>[] => {
    const entityInlineNodes = change.value.document.filterDescendants((node: any) => node.type === models.NodeType.EntityNodeType)
    return (entityInlineNodes.map((entityNode: any) => {
        const tokenInlineNodes: any[] = entityNode.filterDescendants((node: any) => node.type === models.NodeType.TokenNodeType).toJS()
        if (tokenInlineNodes.length === 0) {
            console.warn(`Error 'getEntitiesFromValue': found entity node which did not contain any token nodes `)
            return null
        }

        const firstToken: models.IToken = tokenInlineNodes[0].data
        const lastToken: models.IToken = tokenInlineNodes[tokenInlineNodes.length - 1].data
        const data: models.IEntityData<any> = entityNode.data.toJS()

        return {
            startIndex: firstToken.startIndex,
            endIndex: lastToken.endIndex,
            data
        }
    })
        .toJS() as any[])
        .filter(x => x)
}

export const getSelectedText = (value: models.SlateValue) => {
    const characters = value.characters ? value.characters.toJSON() : []
    return characters.reduce((s: string, node: any) => s + node.text, '')
}