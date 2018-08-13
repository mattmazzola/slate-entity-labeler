
export interface IEditorProps {
    options: IOption[]
    text: string
    labeledEntities: ILabel<IEntityData<any>>[]
}

export interface IOption {
    id: string
    name: string
    type: string
}

export interface ILabel<T> {
    startIndex: number
    endIndex: number
    data: T
}

export interface IEntityData<T> {
    option: IOption
    text: string
    displayName: string
    original: T
}

export interface IToken {
    text: string
    isSelectable: boolean
    startIndex: number
    endIndex: number
}

export interface IEntityPlaceholder {
    entity: ILabel<IEntityData<any>>
    tokens: IToken[]
}

export type TokenArray = (IToken | IEntityPlaceholder)[]

export enum NodeType {
    TokenNodeType = 'token-node',
    EntityNodeType = "entity-inline-node"
}

export type SlateValue = any

export enum SegementType {
    Normal = "normal",
    Inline = "inline"
}

export interface ISegement {
    text: string
    startIndex: number
    endIndex: number
    type: SegementType
    data: any
}

export interface FuseResult<T> {
    item: T
    matches: FuseMatch[]
}

export interface FuseMatch {
    indices: [number, number][]
    key: string
}

export interface MatchedOption<T> {
    highlighted: boolean
    matchedStrings: MatchedString[]
    original: T
}

export interface MatchedString {
    text: string
    matched: boolean
}

export interface IEntityPickerProps {
    isOverlappingOtherEntities: boolean
    isVisible: boolean
    position: IPosition | null
}

export interface IPosition {
    top: number
    left: number
    bottom: number
}

export interface IOption {
    id: string
    name: string
    type: string
}