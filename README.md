# dcp

[![npm](https://img.shields.io/npm/v/dcp.svg)](https://www.npmjs.com/package/dcp)

This module supports making copy / clone deeply and faster.

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

### Runtime parsing

If the reference of the base object is NOT changed, you can use it without defining a key.

```js
const obj = {
  a: 10,
  c: [1, 2],
  d: {}
};

// only first time, it will be parsed
const newObj = dcp.clone(obj);
/*
 * { a: 10,
 *   b: '',
 *   c: [1, 2],
 *   d: { d1: false } }
 */
```

### Runtime parsing with a key

If the reference is changed but the format is the same, you need to use it with a key.

```js
// only first time, it will be parsed
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

It is the fastest way, but the difference is only the first clone.

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

If it is called, functions which have the structure will be made.

### clone

arguments: (key: any, structure: any)
arguments: (structure: any)

The deep clone will be made by defined structure.
If the key isn't defined, `define` will be called and then the deep clone function will be called.

