import * as React from 'react'
import { SlateEntityLabeler, models } from './components'
import * as utilities from './components/utilities'
import './App.css'

interface IEntity {
  id: string
  name: string
  type: string
}

const entities: IEntity[] = [
  {
    id: '1',
    name: 'Entity 1',
    type: 'Type 1'
  },
  {
    id: '2',
    name: 'Entity 2',
    type: 'Type 2'
  },
  {
    id: '3',
    name: 'Entity 3',
    type: 'Type 3'
  }
]

interface State {
  readonly text: string
  readonly entities: IEntity[]
  readonly labeledEntities: models.ILabel<any>[]
  readonly readOnly: boolean
}

class App extends React.Component<{}, State> {
  state: State = {
    text: "Book 2 tickets from Seattle to Cairo",
    entities,
    labeledEntities: [],
    readOnly: false
  }

  onChangeLabeledEntities = (labeledEntities: models.ILabel<any>[]) => {
    this.setState({
      labeledEntities
    })
  }

  onClickToggleReadOnly = () => {
    this.setState(prevState => ({
      readOnly: !prevState.readOnly
    }))
  }

  onClickNewEntity = () => {
    console.log(`onClickNewEntity`)
  }

  public render() {
    const tokenizedText = utilities.tokenizeText(this.state.text)
    const labeledTokens = utilities.labelTokens(tokenizedText, this.state.labeledEntities)
    const value = utilities.convertToSlateValue(labeledTokens)
    
    return (
      <div className="App">
        <header>
          <h1>Slate-Entity-Labeler</h1>
        </header>
        <h2>Getting Started</h2>
        <div>
          <b>1. Install</b>
          <pre>
            npm i slate-entity-labeler
          </pre>
          <b>2. Import</b>
          <pre>
            import {'{'} SlateEntityLabeler {'}'} from 'slate-entity-labeler'
          </pre>
          <b>3. Declare</b>
          <pre>{`<SateEntityLabeler
  text={this.state.text}
  entities={this.state.entities}
  labeledEntities={this.state.labeledEntities}
  onChange={this.onChangeLabeledEntities}
/>
`}
          </pre>
        </div>
        <h2>Requirements:</h2>
        <p>
          Given a string of text and list of possible entities, allow user to select the tokens within the text and label them as an entity.
        </p>
        <p>Must Haves</p>
        <ul>
          <li>Selected text must align to token boundaires</li>
          <li>User must not be able to modify the given text.</li>
          <li>User must be able to select from given list of entity types</li>
          <li>User must be able to select label and remove it</li>
        </ul>
        <p>Nice to haves</p>
        <ul>
          <li>User must be able to search within the list of entities</li>
          <li>User may be able to add entity if no suitable match is found</li>
        </ul>

        <h3>Example:</h3>
        <blockquote><i>"Book 2 tickets from Seattle to Cairo"</i></blockquote>
        <dl className="entities">
          <dt>number</dt>
          <dd>2</dd>
          <dt>sourceCity</dt>
          <dd>Seattle</dd>
          <dt>destinationCity</dt>
          <dd>Cairo</dd>
        </dl>

        <h2>Design Philosophy:</h2>
        <p>This usage of component is modeled after normal React controlled inputs. Example: <code>&lt;input value={'{'}text{'}'} onChange={'{'}this.onChange{'}'} /&gt;</code>.
        The user can interact with the input by changing selection and use arrow keys all which do change it's state; however, only the operations which change the value are observed through the <code>onChange</code> callback.</p>
        <p>Similarly with <code>&lt;SlateEntityLabeler /&gt;</code>. The internal <a href="https://www.slatejs.org" target="_blank">Slate.js</a> editor has many internal operations that occur but only the those operations which would affect entities invoke the <code>onChange</code> callback</p>
        
        <h3>Demo</h3>

        <div className="demo">
          <SlateEntityLabeler
            isValid={true}
            text={this.state.text}
            entities={this.state.entities}
            labeledEntities={this.state.labeledEntities}
            onChange={this.onChangeLabeledEntities}
            onClickNewEntity={this.onClickNewEntity}
            readOnly={this.state.readOnly}
          />

          <div className="commands">
            <button type="button" onClick={this.onClickToggleReadOnly}>Toggle Read-Only</button>
          </div>
        </div>

        <h3>State:</h3>
        <pre>
{`text: {${this.state.text}}
entities: {${JSON.stringify(this.state.entities)}}
labeledEntities: {${JSON.stringify(this.state.labeledEntities)}}
readOnly: ${this.state.readOnly ? 'true' : 'false'}
`}
        </pre>

        <h2>Internals:</h2>
        <p>If you're interested in how two inputs: string of text, and list of labeled entities converted into slate value for render</p>
        <pre>{`convertEntitiesAndTextToTokenizedEditorValue(text, labeledEntities)`}</pre>
        <div className="steps">
          <div>
            <h4>{`1. tokenizeText(text)`}</h4>
            <pre className="code-block">{JSON.stringify(tokenizedText, null, '  ')}</pre>
          </div>
          <div>
            <h4>{`2. labeledTokens(tokenzedText, labeledEntities)`}</h4>
            <pre className="code-block">{JSON.stringify(labeledTokens, null, '  ')}</pre>
          </div>
          <div>
            <h4>{`3. convertToSlateValue(labeledTokens)`}</h4>
            <pre className="code-block">{JSON.stringify(value.toJSON(), null, '  ')}</pre>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
