import * as React from 'react'
import Entity from './Entity'
import { IEntityData } from './models'

// Simulate entity component props which have children
interface EntityComponentProps {
    editor: any
    node: any
    attributes: any
    children: any
    readOnly: boolean
}

interface Props extends EntityComponentProps {
}

interface State {
    isEditing: boolean
}

export class CustomEntityContainer extends React.Component<Props, State> {
    state: State = {
        isEditing: false
    }

    onClickName = () => {
        if (this.props.readOnly) {
            return
        }

        this.setState(prevState => ({
            isEditing: !prevState.isEditing
        }))
    }

    onClickDelete = () => {
        if (this.props.readOnly) {
            return
        }
        
        this.setState({
            isEditing: false
        })

        this.props.editor.change((change: any) => {
            change.unwrapInlineByKey(this.props.node.key, this.props.node.type)
        })
    }

    render() {
        const nodeData: IEntityData<any> = this.props.node.data.toJS()
        const { displayName } = nodeData

        return (
            <Entity
                isEditing={this.state.isEditing}
                name={displayName}
                onClickName={this.onClickName}
                onClickDelete={this.onClickDelete}
                readOnly={this.props.readOnly}
                {...this.props.attributes}
            >
                {...this.props.children}
            </Entity>
        )
    }
}

export default CustomEntityContainer