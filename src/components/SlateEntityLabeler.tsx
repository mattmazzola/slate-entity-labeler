import * as React from 'react'
import * as models from './models'
import { Editor } from 'slate-react'
import { convertEntitiesAndTextToTokenizedEditorValue } from './utilities'
import Plain from 'slate-plain-serializer'

interface Props {
    entities: models.IOption[]
    text: string
    labeledEntities: models.ILabel<any>[]
    onChange: (labeledEntities: models.ILabel<any>[]) => void
    readOnly: boolean
}

interface State {
    value: models.SlateValue
}

// const disallowedOperations = ['insert_text', 'remove_text']
// const externalChangeOperations = ['insert_node', 'remove_node']

export class SlateEntityLabeler extends React.Component<Props, State> {
    state: State = {
        value: Plain.deserialize('')
    }

    constructor(props: Props) {
        super(props)
        this.state.value = convertEntitiesAndTextToTokenizedEditorValue(props.text, props.labeledEntities)
    }

    componentWillReceiveProps(nextProps: Props) {
        this.setState({
            value: convertEntitiesAndTextToTokenizedEditorValue(nextProps.text, nextProps.labeledEntities),
        })
    }

    onClickAddEntity = () => {
        const newLabeledEntities: models.ILabel<any>[] = [...this.props.labeledEntities, {
            endIndex: 0,
            startIndex: 0,
            data: {}
        }]

        this.props.onChange(newLabeledEntities)
    }

    onChange = (change: any) => {
        this.setState({ value: change.value })
    }

    /**
     * Note: This is only here to prevent an edge case bug but doesn't affect normal behavior.
     * Bug: The user has labeled the last word in the phrase as an entity, has the cursor at the
     * right most position of the input and presses the left arrow.
     */
    onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, change: any) => {
        if (['Enter', 'Backspace'].includes(event.key)) {
            event.preventDefault()
            return true
        }

        const blockNode = change.value.document.getBlocks().last()
        const lastTextNode = blockNode.getLastText()
        const isAtEnd = change.value.selection.isAtEndOf(lastTextNode)

        if (isAtEnd) {
            event.preventDefault()
            change.collapseToEndOfPreviousText()
            return true
        }

        return undefined
    }

    renderNode = (props: any): React.ReactNode | void => {
        switch (props.node.type) {
            // case NodeType.TokenNodeType: return <TokenNode {...props} />
            // case NodeType.CustomEntityNodeType: return <CustomEntityNode {...props} />
            // case NodeType.PreBuiltEntityNodeType: return <PreBuiltEntityNode {...props} />
            default: return
        }
    }

    render() {
        return <div>
            <Editor
                className="slate-editor"
                placeholder="Enter some text..."
                value={this.state.value}
                onChange={this.onChange}
                onKeyDown={this.onKeyDown}
                renderNode={this.renderNode}
                readOnly={this.props.readOnly}
            />
        </div>
    }
}