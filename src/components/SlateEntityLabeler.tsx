import * as React from 'react'
import * as models from './models'
import { Editor } from 'slate-react'
import { convertEntitiesAndTextToTokenizedEditorValue } from './utilities'
import EntityNode from './EntityNode'
import TokenNode from './TokenNode'
import EntityPickerContainer from './EntityPickerContainer'
import Plain from 'slate-plain-serializer'
import * as utilities from './utilities'
import './SlateEntityLabeler.css'

interface Props {
    entities: models.IOption[]
    isValid: boolean
    text: string
    labeledEntities: models.ILabel<any>[]
    onChange: (labeledEntities: models.ILabel<any>[]) => void
    readOnly: boolean
    onClickNewEntity: () => void
    renderPicker?: (
        isOverlappingOtherEntities: boolean,
        isVisible: boolean,
        options: models.IOption[],
        menuRef: React.Ref<HTMLElement>,
        position: models.IPosition,
        value: models.SlateValue,
    
        onClickNewEntity: () => void,
        onSelectOption: (o: models.IOption) => void
    ) => React.ReactNode
}

interface State {
    isSelectionOverlappingOtherEntities: boolean
    isMenuVisible: boolean
    menuPosition: models.IPosition | null
    value: models.SlateValue
}

const disallowedOperations = ['insert_text', 'remove_text']
const externalChangeOperations = ['insert_node', 'remove_node']

export class SlateEntityLabeler extends React.Component<Props, State> {
    menuRef = React.createRef<HTMLDivElement>()

    state: State = {
        isSelectionOverlappingOtherEntities: false,
        isMenuVisible: false,
        menuPosition: {
            top: 0,
            left: 0,
            bottom: 0
        },
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

    getNextPickerProps = (value: models.SlateValue, menu: HTMLElement): models.IEntityPickerProps | void => {
        const hideMenu: models.IEntityPickerProps = {
            isOverlappingOtherEntities: false,
            isVisible: false,
            position: null
        }

        const selectionDoesNotContainTokens = value.isEmpty || value.selection.isCollapsed || (value.inlines.size === 0)
        if (!menu || selectionDoesNotContainTokens) {
            return hideMenu
        }

        const relativeParent = utilities.getRelativeParent(menu.parentElement)
        const relativeRect = relativeParent.getBoundingClientRect()
        const selection = window.getSelection()

        // Note: Slate value.selection can be different than the document window.getSelection()
        // From what I can tell slate's is always accurate to display.  If the selection was updated programmatically via slate API it will be reflected within Slates selection
        // and as soon as user interacts to change DOM selection, it will update both
        // Note: Cannot test for selection.isCollapsed here, because we need the menu to open when the user clicks a word
        if (!selection || selection.rangeCount === 0) {
            return hideMenu
        }

        const range = selection.getRangeAt(0)
        const selectionBoundingRect = range.getBoundingClientRect()

        const left = (selectionBoundingRect.left - relativeRect.left) + window.scrollX - menu.offsetWidth / 2 + selectionBoundingRect.width / 2
        const menuPosition: models.IPosition = {
            top: ((selectionBoundingRect.top - relativeRect.top) - menu.offsetHeight) + window.scrollY - 20,
            left: Math.max(0, left),
            bottom: relativeRect.height - (selectionBoundingRect.top - relativeRect.top) + 10
        }

        /**
         * If selection overlaps with existing custom entity nodes, or if it's has parent of custom entity node
         * then set special flag isOverlappingOtherEntities which prevents adding entities
         */
        let isOverlappingOtherEntities = false
        if (value.inlines.size > 0) {
            const customEntityNodesInSelection = value.inlines.filter((n: any) => n.type === models.NodeType.EntityNodeType)
            if (customEntityNodesInSelection.size > 0) {
                isOverlappingOtherEntities = true
            }
            else {
                const parentOfFirstInline = value.document.getParent(value.inlines.first().key)
                if (parentOfFirstInline.type === models.NodeType.EntityNodeType) {
                    isOverlappingOtherEntities = true
                }
            }
        }

        return {
            isOverlappingOtherEntities,
            isVisible: true,
            position: menuPosition
        }
    }

    onChange = (change: any) => {
        const { value, operations } = change
        const operationsJs = operations.toJS()
        // console.log(`operationsJs: `, operationsJs)
        // console.log(`disallowedOperations: `, disallowedOperations)
        const containsDisallowedOperations = operationsJs.some((o: any) => disallowedOperations.includes(o.type))

        if (containsDisallowedOperations) {
            return
        }
        
        const tokenNodes = value.inlines.filter((n: any) => n.type === models.NodeType.TokenNodeType)
        if (tokenNodes.size > 0) {
            let shouldExpandSelection = true
            const parentNodes = tokenNodes.map((n: any) => value.document.getParent(n.key))
            const firstParent = parentNodes.first()

            // If all parents nodes are the same node and the type of that node is CustomEntity then it means selection is all within a custom entity
            // In this case we assume the user wants to delete the entity and do not expand the selection to prevent the picker menu from showing
            if (firstParent.type === models.NodeType.EntityNodeType && parentNodes.every((x: any) => x === firstParent)) {
                shouldExpandSelection = false
            }

            // Note: This is kind of hack to prevent selection from expanding when the cursor/selection is within
            // the button text of the custom entity node. This makes the Slate selection expanded and prevents
            // the entity picker from closing after user removes the node.
            const selection = window.getSelection()
            const selectionParentElement = selection && selection.anchorNode && selection.anchorNode.parentElement
            if (selectionParentElement == null) {
                console.warn(`selectionParentElement is null or undefined. Value: ${value.document.text}`)
            }
            else if (["BUTTON", "I"].includes(selectionParentElement.tagName)) {
                shouldExpandSelection = false
            }

            if (shouldExpandSelection) {
                const firstInline = value.inlines.first()
                const lastInline = value.inlines.last()
                change
                    .collapseToStartOf(firstInline)
                    .extendToEndOf(lastInline)
            }
        }

        this.setState({ value: change.value })
        
        const containsExternalChangeOperation = operationsJs.some((o: any) => externalChangeOperations.includes(o.type))
        if (containsExternalChangeOperation) {
            const labeledEntities = utilities.getEntitiesFromValueUsingTokenData(change)
            this.props.onChange(labeledEntities)
        }

        const pickerProps = this.getNextPickerProps(change.value, this.menuRef.current!)
        if (pickerProps) {
            this.setState({
                isSelectionOverlappingOtherEntities: pickerProps.isOverlappingOtherEntities,
                isMenuVisible: pickerProps.isVisible,
                menuPosition: pickerProps.position
            })
        }
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

    onSelectOption = (option: models.IOption, value: models.SlateValue, onChange: (x: any) => void) => {
        const selectedText = utilities.getSelectedText(value)

        if (selectedText.length === 0) {
            console.warn(`onSelectOption was called but the value has an empty selection`)
            return
        }

        const data: models.IEntityData<any> = {
            option,
            text: selectedText,
            displayName: option.name,
            original: null
        }

        const change = value.change()
            .wrapInline({
                type: models.NodeType.EntityNodeType,
                data
            })
            .collapseToEnd()

        onChange(change)
    }

    renderNode = (props: any): React.ReactNode | void => {
        switch (props.node.type) {
            case models.NodeType.TokenNodeType: return <TokenNode {...props} />
            case models.NodeType.EntityNodeType: return <EntityNode {...props} />
            default: return
        }
    }

    render() {
        return <div className="entity-labeler">
            <div className={`entity-labeler__custom-editor ${this.props.readOnly ? 'entity-labeler__custom-editor--read-only' : ''} ${this.props.isValid ? '' : 'entity-labeler__custom-editor--error'}`}>
                <div className="entity-labeler__editor">
                    <Editor
                        className="slate-editor"
                        placeholder="Enter some text..."
                        value={this.state.value}
                        onChange={this.onChange}
                        onKeyDown={this.onKeyDown}
                        renderNode={this.renderNode}
                        readOnly={this.props.readOnly}
                    />
                        {this.props.renderPicker
                            ? this.props.renderPicker(
                                this.state.isSelectionOverlappingOtherEntities,
                                this.state.isMenuVisible,
                                this.props.entities,
                                this.menuRef,
                                this.state.menuPosition!,
                                this.state.value,
                                this.props.onClickNewEntity,
                                o => this.onSelectOption(o, this.state.value, this.onChange)
                            )
                            : <EntityPickerContainer
                                isOverlappingOtherEntities={this.state.isSelectionOverlappingOtherEntities}
                                isVisible={this.state.isMenuVisible}
                                options={this.props.entities}
                                maxDisplayedOptions={4}
                                menuRef={this.menuRef}
                                position={this.state.menuPosition!}
                                value={this.state.value}

                                onClickNewEntity={this.props.onClickNewEntity}
                                onSelectOption={o => this.onSelectOption(o, this.state.value, this.onChange)}
                            />
                        }
                </div>
            </div>
        </div>
    }
}