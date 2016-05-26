# Deep CoPy

[![npm](https://img.shields.io/npm/v/dcp.svg)](https://www.npmjs.com/package/dcp)

This module supports making copy / clone deeply and faster.

It needs to be defined an object structure and the module will analyse the structure.
If it isn't defined, it will be defined when it is called first time.

## Feature

### define(key, structure)

If it is called, functions which have the structure will be made.

### clone(key, [object])

alias: deep, copy

The deep clone will be made by defined structure.
If the key isn't defined, `define` will be called and then the deep clone function will be called.

### shallow(key, [object])

The shallow clone will be made.

## Example

```js
var structure = {
  a: 1,
  b: 'default',
  c: [undefined, undefined],
  d: { d1: true }
};
var obj = {
  a: 10,
  c: [1, 2],
  d: {}
};
dcp.define('test', structure);
var newObj = dcp.clone('test', obj);
/*
 * { a: 10,
 *   b: 'default',
 *   c: [1, 2],
 *   d: { d1: true } }
 */

// or
var clone = dcp.clone('test', structure);
var newObj = clone(obj);

// or
dcp.define('test', structure);
var clone = dcp.clone('test');
var newObj = clone(obj);

// or
var newObj = dcp.clone('test', obj);
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
