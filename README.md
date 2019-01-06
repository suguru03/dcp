# dcp

[![npm](https://img.shields.io/npm/v/dcp.svg)](https://www.npmjs.com/package/dcp)

This module supports making copy / clone deeply and faster.

## Usage

### Runtime parsing

If the base object refernce is NOT changed, you can use it without defining a key.

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

If the object reference is changed but the format is the same, you need to use it with a key.

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

## Benchmark

- Node.js: v6.2.0
- benchmark.js: v2.1.0

```js
var obj = {
  a: 1,
  b: 'test',
  c: [true, false, { c1: 'a' }],
  d: { d1: { d11: { d111: { d1111: 0 }, d112: 1 } } }
};
dcp.define('test', obj);

dcp.clone('test', obj);
JSON.parse(JSON.stringify(obj));
_.cloneDeep(obj);
/*
 * **** benchmark.js ****
 * [1] "dcp" 0.00052ms [1.00]
 * [2] "JSON.parse" 0.020ms [37.6]
 * [3] "cloneDeep" 0.041ms [78.5]
 */

var obj = _.mapValues(_.times(10), function(num) {
  return _.mapValues(_.times(num), function(num) {
    return _.mapValues(_.times(num));
  });
});
/*
 * **** benchmark.js ****
 * [1] "dcp" 0.15ms [1.00]
 * [2] "JSON.parse" 0.47ms [3.11]
 * [3] "cloneDeep" 1.1ms [7.55]
 */
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

