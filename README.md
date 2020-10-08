# dcp

[![npm](https://img.shields.io/npm/v/dcp.svg)](https://www.npmjs.com/package/dcp)

This module supports making shallow copy / deep copy and faster IF an object structure is consistent.

## Benchmark

- Node.js: v14.13.1
- benchmark.js: v2.1.0

```js
yarn benchmark

[1] "dcp" 0.0636μs[1.00][1.00]
[2] "rfdc" 0.825μs[0.0771][13.0]
[3] "lodash" 3.81μs[0.0167][59.9]
[4] "JSON" 3.85μs[0.0165][60.6]
```


## Usage

```
npm install dcp
// or
yarn add dcp
```

```js
const { dcp } = require('dcp');
// or 
import dcp from 'dcp';
import { dcp } from 'dcp';
```

### Runtime parsing

It creates a snapshot when the object is copied the first time, the snapshot will be stored in WeakMap.

```js
const obj = {
  a: 10,
  c: [1, 2],
  d: {}
};

const newObj = dcp.clone(obj);
/*
 * { a: 10,
 *   b: '',
 *   c: [1, 2],
 *   d: { d1: false } }
 */
```

### Runtime parsing with a key

If the object reference is changed every time, you can assign a specific key for the snapshot.

Then you will be able to resuse the snapshot for other objects.

```js
const newObj = dcp.clone('key1', obj);
/*
 * { a: 10,
 *   b: '',
 *   c: [1, 2],
 *   d: { d1: false } }
 */

// get the default values
const newObj2 = dcp.clone('key1');
/*
 * { a: 0,
 *   b: '',
 *   c: [0, 0],
 *   d: { d1: false } }
 */
```

### Pre-defined

You can also define a snapshot structure before using copy.

```js
const structure = {
  a: 1,
  b: 'default',
  c: [undefined, undefined],
  d: { d1: true }
};
const key = 'test';
dcp.define(key, structure);
const newObj = dcp.clone(key, obj);
```

## APIs

### define

arguments: (key: any, structure: any)
arguments: (structure: any)

Pre define a snapshot structure

### clone

arguments: (key: any, structure: any)
arguments: (structure: any)

Create a copy based on a snapshot
