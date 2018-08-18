# Slate Entity Labeler

## What is it?

React component to help labeling entities within a given string of text. Built on: [https://www.slatejs.org](slate.js)

## Getting Started

Install

```
npm i slate-entity-labeler
```

Import

```typescript
import { SlateEntityLabeler } from 'slate-entity-labeler'
```

Declare

```typescript
<SateEntityLabeler
  text={this.state.text}
  entities={this.state.entities}
  labeledEntities={this.state.labeledEntities}
  onChange={this.onChangeLabeledEntities}
/>
```

## Demo

[https://mattmazzola.github.io/slate-entity-labeler/](https://mattmazzola.github.io/slate-entity-labeler/)

## Source

[https://github.com/mattmazzola/slate-entity-labeler](https://github.com/mattmazzola/slate-entity-labeler)