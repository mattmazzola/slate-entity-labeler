
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