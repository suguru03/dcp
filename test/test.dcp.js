/* global beforeEach, describe, it */

'use strict';

var assert = require('assert');

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
    var obj = {
      a: 1,
      b: [1, 2],
      c: { c1: 1, c2: '2'},
      d: { d1: { d11: 'test', d12: { d123: true } } }
    };
    var clone = dcp.define('test', obj);
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

});
