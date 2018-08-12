import * as models from './models'
import { Value } from 'slate'

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