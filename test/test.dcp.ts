import * as assert from 'assert';

import * as _ from 'lodash';

import dcp from '..';

beforeEach(() => dcp.clean());

describe('#define', () => {
  it('should define new clone function', () => {
    const obj = {
      a: 1,
    };
    const clone = dcp.define('test', obj);
    assert.strictEqual(typeof clone, 'function');
    const newObj = clone(obj);
    assert.deepEqual(newObj, obj);
    assert.notStrictEqual(newObj, obj);
  });
});

describe('#clone', () => {
  it('should return string', () => {
    const str = 'test';
    const newStr = dcp.clone('test', str);
    assert.strictEqual(str, newStr);
  });

  it('should copy deeply', () => {
    const structure = {
      a: 1,
      b: [1, 2],
      c: { c1: 1, c2: '2' },
      d: { d1: { d11: 'test', d12: { d123: true } } },
    };
    const obj: any = {
      a: 2,
      b: [3, 4],
      c: { c1: 2, c2: '2' },
      d: { d1: { d11: 'tes', d12: { d123: false } } },
    };
    const clone = dcp.define('test', structure);
    const newObj = clone(obj);
    assert.deepEqual(newObj, obj);
    assert.notStrictEqual(newObj, obj);
    obj.d.d11 = 'test2';
    assert.notDeepEqual(newObj, obj);
  });

  it('should copy deep array', () => {
    const obj = [
      1,
      [[1, '2', true, false, () => {}]],
      [4, { d: { d1: () => {} } }, [5, { e: [false] }]],
    ];
    const clone = dcp.define('test', obj);
    const newObj = clone(obj);
    assert.deepEqual(newObj, obj);
    assert.notStrictEqual(newObj, obj);
  });

  it('should copy deep object', () => {
    const count = 10;
    const obj = _.mapValues(_.times(count), num =>
      _.mapValues(_.times(num), num => _.mapValues(_.times(num))),
    );
    const clone = dcp.define('test', obj);
    const newObj = clone(obj);
    assert.deepEqual(newObj, obj);
    assert.notStrictEqual(newObj, obj);
  });

  it('should get clone function', () => {
    const obj = {
      a: {},
      b: [],
      c: [{}, { c1: { c2: {} } }],
      d: false,
    };
    const func = dcp.define('test', obj);
    assert.strictEqual(typeof func, 'function');
    const newObj = func(obj);
    assert.deepEqual(newObj, obj);
    assert.notStrictEqual(newObj, obj);
  });

  it('should get default value', () => {
    const structure = {
      a: 1,
      b: 2,
      c: 3,
    };
    const obj = {
      a: 5,
      c: 5,
    };
    const clone = dcp.define('test', structure);
    const newObj = clone(obj);
    assert.deepEqual(newObj, {
      a: 5,
      b: 0,
      c: 5,
    });
    assert.notStrictEqual(newObj, obj);
  });

  it('should make default values', () => {
    const structure = {
      a: 1,
      b: 'default',
      c: [undefined, { c1: [{}, { c12: false }] }],
      d: { d1: true },
    };
    const obj = {
      a: 10,
      c: [1],
      d: {},
    };
    dcp.define('test', structure);
    const newObj = dcp.clone('test', obj);
    assert.deepEqual(newObj, {
      a: 10,
      b: '',
      c: [1, { c1: [{}, { c12: false }] }],
      d: { d1: false },
    });
    assert.notStrictEqual(structure.d, obj.d);
    assert.notStrictEqual(structure.d, newObj.d);
    assert.notStrictEqual(obj.d, newObj.d);
  });

  it('should make clone', () => {
    const structure = {
      a: 1,
      b: 'default',
      c: [undefined, { c1: [{}, { c12: false }] }],
      d: { d1: true },
    };
    const clone = dcp.define('test', structure);
    const newObj = clone();
    assert.deepEqual(newObj, {
      a: 0,
      b: '',
      c: [undefined, { c1: [{}, { c12: false }] }],
      d: { d1: false },
    });
    assert.notStrictEqual(newObj, structure);
  });

  it('should not cause an error even if an object has circular structure', () => {
    const obj: any = {
      a: 1,
    };
    const obj2 = {
      a: 2,
      b: obj,
    };
    obj.b = obj2;
    const clone = dcp.define('test', obj);
    const newObj = clone(obj);
    assert.deepEqual(newObj, obj);
    assert.notStrictEqual(newObj.b, obj.b);
    assert.notStrictEqual(newObj.b.b, obj.b.b);
  });

  it('should copy multi circular structure', () => {
    const obj1: any = {
      a: 1,
    };
    const obj2: any = {
      a: 2,
      b: obj1,
    };
    const obj3: any = {
      a: 3,
      b: obj2,
    };
    obj1.b = obj2;
    obj1.c = obj3;
    obj2.c = obj3;
    obj3.c = obj1;
    const clone = dcp.define('test', obj1);
    const newObj = clone(obj1);
    assert.deepEqual(newObj, obj1);
    assert.notStrictEqual(newObj.b, obj1.b);
    assert.notStrictEqual(newObj.b.b, obj1.b.b);
  });

  it('should copy an instance', () => {
    const Test = function(str) {
      this._str = str;
    };
    Test.prototype.get = function() {
      return this._str;
    };
    Test.prototype.set = function(str) {
      this._str = str;
      return this;
    };
    const test = new Test('test');
    const newObj = dcp.clone('test', test);
    assert.deepEqual(newObj, test);
    assert.strictEqual(newObj.__proto__, test.__proto__);
    assert.notStrictEqual(newObj, test);
    assert.notStrictEqual(newObj, test);
    assert.strictEqual(newObj.get(), test.get());
    assert.strictEqual(newObj.set('test2').get(), test.set('test2').get());
  });

  it('should copy a deep instance', () => {
    const Test = function(str) {
      this._str = str;
    };
    Test.prototype.get = function() {
      return this._str;
    };
    const Test2 = function(str) {
      this._test = new Test(str);
    };
    Test2.prototype.get = function() {
      return this._test;
    };
    const test = new Test2('test');
    const newObj = dcp.clone(test);
    assert.strictEqual(newObj._test.__proto__, test._test.__proto__);
  });

  it('should copy using reference type', () => {
    const a = { b: 1 };
    const obj = { a };
    const obj1 = dcp.clone(obj);
    const obj2 = dcp.clone(obj);
    assert.notStrictEqual(obj1, obj);
    assert.notStrictEqual(obj1.a, obj);
    assert.deepStrictEqual(obj1, obj);
    assert.deepStrictEqual(obj2, obj);
  });
});
