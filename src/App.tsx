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

  public render() {
    const tokenizedText = utilities.tokenizeText(this.state.text)
    const labeledTokens = utilities.labelTokens(tokenizedText, this.state.labeledEntities)
    const value = utilities.convertToSlateValue(labeledTokens)
    
    return (
      <div className="App">
        <header>
          <h1>Slate-Entity-Labeler</h1>
        </header>
        <h2>Requirements:</h2>
        <p>
          Given a string of text, allow user to select the tokens within the text and label them as entities.
        </p>
        <ul>
          <li>Selected text must align to token</li>
          <li>User must be able to select from given list of entity types</li>
        </ul>
        <h3>Demo</h3>
        <button type="button" onClick={this.onClickToggleReadOnly}>Toggle Read-Only</button> {this.state.readOnly ? 'True' : 'False'}

        <div className="demo">
          <SlateEntityLabeler
            text={this.state.text}
            entities={this.state.entities}
            labeledEntities={this.state.labeledEntities}
            onChange={this.onChangeLabeledEntities}
            readOnly={this.state.readOnly}
          />
        </div>

        <h3>State:</h3>
        <pre>
{`text: {${this.state.text}}
entities: {${JSON.stringify(this.state.entities)}}
labeledEntities: {${JSON.stringify(this.state.labeledEntities)}}
`}
        </pre>

        <h3>Declaration:</h3>
        <pre>{`<SateEntityLabeler
  text={this.state.text}
  entities={this.state.entities}
  labeledEntities={this.state.labeledEntities}
  onChange={this.onChangeLabeledEntities}a
/>
`}
        </pre>
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
