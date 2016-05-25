/* global beforeEach, describe, it */

'use strict';

var assert = require('assert');

var _ = require('lodash');

var dcp = require('../');

beforeEach(function() {
  dcp.clean();
});

describe('#define', function() {

  it('should define new clone function', function() {
    var obj = {
      a: 1
    };
    var clone = dcp.define('test', obj);
    assert.strictEqual(typeof clone, 'function');
    var newObj = clone(obj);
    assert.deepEqual(newObj, obj);
    assert.notStrictEqual(newObj, obj);
  });
});

describe('#clone', function() {

  it('should copy deeply', function() {
    var structure = {
      a: 1,
      b: [1, 2],
      c: { c1: 1, c2: '2'},
      d: { d1: { d11: 'test', d12: { d123: true } } }
    };
    var obj = {
      a: 2,
      b: [3, 4],
      c: { c1: 2, c2: '2'},
      d: { d1: { d11: 'tes', d12: { d123: false } } }
    };
    var clone = dcp.define('test', structure);
    var newObj = clone(obj);
    assert.deepEqual(newObj, obj);
    assert.notStrictEqual(newObj, obj);
    obj.d.d11 = 'test2';
    assert.notDeepEqual(newObj, obj);
  });

  it('should copy deep array', function() {
    var obj = [
      1,
       [
         [1, '2', true, false, function() {}]
       ],
      [4, { d: { d1: function() {}}}, [5, { e: [false] } ] ]
    ];
    var clone = dcp.define('test', obj);
    var newObj = clone(obj);
    assert.deepEqual(newObj, obj);
    assert.notStrictEqual(newObj, obj);
  });

  it('should copy deep object', function() {
    var count = 10;
    var obj = _.mapValues(_.times(count), function(num) {
      return _.mapValues(_.times(num), function(num) {
        return _.mapValues(_.times(num));
      });
    });
    var clone = dcp.define('test', obj);
    var newObj = clone(obj);
    assert.deepEqual(newObj, obj);
    assert.notStrictEqual(newObj, obj);
  });

  it('should get clone function', function() {
    var obj = {
      a: {},
      b: [],
      c: [{}, { c1: { c2: {} } }],
      d: false
    };
    dcp.define('test', obj);
    var func = dcp.clone('test');
    assert.strictEqual(typeof func, 'function');
    var newObj = func(obj);
    assert.deepEqual(newObj, obj);
    assert.notStrictEqual(newObj, obj);
  });

  it('should get default value', function() {
    var structure = {
      a: 1,
      b: 2,
      c: 3
    };
    var obj = {
      a: 5,
      c: 5
    };
    var clone = dcp.define('test', structure);
    var newObj = clone(obj);
    assert.deepEqual(newObj, {
      a: 5,
      b: 2,
      c: 5
    });
    assert.notStrictEqual(newObj, obj);
  });

  it('should make default values', function() {
    var structure = {
      a: 1,
      b: 'default',
      c: [undefined, { c1: [{}, { c12: false }] }],
      d: { d1: true }
    };
    var obj = {
      a: 10,
      c: [1],
      d: {}
    };
    dcp.define('test', structure);
    var newObj = dcp.clone('test', obj);
    assert.deepEqual(newObj, {
      a: 10,
      b: 'default',
      c: [1, { c1: [{}, { c12: false }] }],
      d: { d1: true }
    });
    assert.notStrictEqual(structure.d, obj.d);
    assert.notStrictEqual(structure.d, newObj.d);
    assert.notStrictEqual(obj.d, newObj.d);
  });

  it('should make clone', function() {
    var structure = {
      a: 1,
      b: 'default',
      c: [undefined, { c1: [{}, { c12: false }] }],
      d: { d1: true }
    };
    var clone = dcp.define('test', structure);
    var newObj = clone();
    assert.deepEqual(newObj, structure);
    assert.notStrictEqual(newObj, structure);
  });

});
