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
    name: 'number',
    type: 'number'
  },
  {
    id: '2',
    name: 'sourceCity',
    type: 'string'
  },
  {
    id: '3',
    name: 'destinationCity',
    type: 'string'
  }
]

const labeledEntities: models.ILabel<models.IEntityData<IEntity>>[] = [
  {
    startIndex: 5,
    endIndex: 6,
    data: {
      option: { ...entities[0] },
      text: "2",
      displayName: entities[0].name,
      original: entities[0]
    }
  },
  {
    startIndex: 20,
    endIndex: 27,
    data: {
      option: { ...entities[1] },
      text: "Seattle",
      displayName: entities[1].name,
      original: entities[1]
    }
  },
  {
    startIndex: 31,
    endIndex: 36,
    data: {
      option: { ...entities[2] },
      text: "Cairo",
      displayName: entities[2].name,
      original: entities[2]
    }
  }
]

interface State {
  readonly text: string
  readonly entities: IEntity[]
  readonly labeledEntities: models.ILabel<models.IEntityData<IEntity>>[]
  readonly readOnly: boolean
}

class App extends React.Component<{}, State> {
  state: State = {
    text: "Book 2 tickets from Seattle to Cairo",
    entities: [...entities],
    labeledEntities: [...labeledEntities],
    readOnly: false
  }

  onChangeLabeledEntities = (labeledEntities: models.ILabel<any>[]) => {
    this.setState({
      labeledEntities
    })
  }

  onClickReset = () => {
    this.setState({
      entities,
      labeledEntities,
      readOnly: false
    })
  }

  onChangeReadOnly = () => {
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
          <h1 className="title">&lt;SlateEntityLabeler /&gt;</h1>
          <div className="main-demo">
            <div className="editor">
              <SlateEntityLabeler
                isValid={true}
                text={this.state.text}
                entities={this.state.entities}
                labeledEntities={this.state.labeledEntities}
                onChange={this.onChangeLabeledEntities}
                onClickNewEntity={this.onClickNewEntity}
                readOnly={this.state.readOnly}
              />
            </div>

            <div className="commands">
              <button type="button" className="primary" onClick={this.onClickReset}>Reset</button>
              <label htmlFor="readOnlyCheckbox">
                <input id="readOnlyCheckbox" type="checkbox" onChange={this.onChangeReadOnly} />Read-Only
              </label>
            </div>

            <div className="state">
              <div>
                <div className="header">Entities:</div>
                <ul>
                  {this.state.entities.map(e => 
                    <li>{e.name}</li>
                  )}
                </ul>
              </div>

              <div>
                <div className="header">Labels:</div>
                <ul>
                  {this.state.labeledEntities.map(le => 
                    <li>{le.data.option.name} [{le.startIndex},{le.endIndex}] {le.data.text}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </header>
        <main>
          <section>
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
              <pre>
{`<SateEntityLabeler
  text={this.state.text}
  entities={this.state.entities}
  labeledEntities={this.state.labeledEntities}
  onChange={this.onChangeLabeledEntities}
/>`}
              </pre>
            </div>
          </section>

          <h2>📃 Requirements:</h2>
          <p>
            Given a string of text and list of possible entities, allow user to select the tokens within the text and label them as an entity.
          </p>
          <h3>Must Haves</h3>
          <ul className="list">
            <li>✅ Selected text must align to token boundaires</li>
            <li>✅ User must not be able to modify the given text.</li>
            <li>✅ User must be able to select from given list of entity types</li>
            <li>✅ User must be able to select label and remove it</li>
          </ul>
          <h3>Nice to haves</h3>
          <ul className="list">
            <li>🎉  User must be able to search within the list of entities</li>
            <li>🚀  User may be able to add entity if no suitable match is found</li>
          </ul>

          <h2>🤔 Design Philosophy:</h2>
          <p>This usage of component is modeled after normal React controlled inputs. Example: <code>&lt;input value={'{'}text{'}'} onChange={'{'}this.onChange{'}'} /&gt;</code>.
          The user can interact with the input by changing selection and use arrow keys all which do change it's state; however, only the operations which change the value are observed through the <code>onChange</code> callback.</p>
          <p>Similarly with <code>&lt;SlateEntityLabeler /&gt;</code>. The internal <a href="https://www.slatejs.org" target="_blank">Slate.js</a> editor has many internal operations that occur but only the those operations which would affect entities invoke the <code>onChange</code> callback</p>

          <h3>Diagram</h3>
          <p>Notice the internal update cycle and the external update cycle</p>

          <h2>🔧 Internals:</h2>
          <p>If you're interested in how two inputs: string of text, and list of labeled entities converted into slate value for render</p>
          <pre>{`convertEntitiesAndTextToTokenizedEditorValue(text, labeledEntities)`}</pre>
          <div className="steps">
              <div>{`1. tokenizeText(text)`}</div>
              <div>{`2. labeledTokens(tokenzedText, labeledEntities)`}</div>
              <div>{`3. convertToSlateValue(labeledTokens)`}</div>
              <pre className="code-block">{JSON.stringify(tokenizedText, null, '  ')}</pre>
              <pre className="code-block">{JSON.stringify(labeledTokens, null, '  ')}</pre>
              <pre className="code-block">{JSON.stringify(value.toJSON(), null, '  ')}</pre>
          </div>
        </main>
      </div>
    );
  }
}

export default App;
