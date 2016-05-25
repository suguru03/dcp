'use strict';

function DeepCopy() {
  this._defined = {};
}

DeepCopy.prototype.clean = function(key) {
  if (key) {
    delete this._defined[key];
  } else {
    this._defined = {};
  }
  return this;
};

/**
 * Define structure automatically
 */
DeepCopy.prototype.define = function(key, obj) {
  if (this._defined[key]) {
    throw new Error(key + ' is already defined.');
  }
  var func = this._defined[key] = createFunc(analyze(obj));
  return func;
};

DeepCopy.prototype.clone = function(key, obj) {
  var func = this._defined[key] || this.define(key, obj);
  return arguments.length === 1 ? func : func(obj);
};

DeepCopy.prototype.copy = DeepCopy.prototype.clone;

function map(obj, iter) {
  var index = -1;
  var key, keys, size, result;
  if (Array.isArray(obj)) {
    size = obj.length;
    result = Array(size);
    while (++index < size) {
      result[index] = iter(obj[index], index);
    }
  } else {
    keys = Object.keys(obj);
    size = keys.length;
    result = {};
    while (++index < size) {
      key = keys[index];
      result[key] = iter(obj[key], key);
    }
  }
  return result;
}

function replace(str, value, exp) {
  return str && str.replace(exp || /%s/, value);
}

function resolveKey(keys) {
  var str = '%s';
  var key = '%s';
  var k = keys.shift();
  var l = keys.length;
  if (!l) {
    return replace(str, k);
  }
  str = replace(str, '%s&&%s');
  str = replace(str, k);
  key = replace(key, '%s["%s"]%s');
  key = replace(key, k);
  while (l--) {
    k = keys.shift();
    key = replace(key, k);
    str = replace(str, l ? '%s&&%s' : '%s');
    str = replace(str, replace(key, ''));
    key = replace(key, l ? '["%s"]%s' : '');
  }
  return str;
}

function resolveValue(keys, value) {
  var str = '%k!==undefined?%k:%s';
  str = replace(str, resolveKey(keys), /%k/g);
  switch (typeof value) {
    case 'string':
      return replace(str, replace('"%s"', value));
    case 'object':
      return replace(str, null);
    default:
      return replace(str, value);
  }
}

function analyze(obj) {
  if (obj === null) {
    return null;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  return map(obj, analyze);
}

function createFuncStr(obj, keys, parentStr) {
  var type = typeof obj;
  if (type !== 'object') {
    if (!parentStr) {
      return resolveValue(keys, obj);
    }
    return replace(parentStr, resolveValue(keys, obj));
  }
  var isArray = Array.isArray(obj);
  var str = isArray ? '[%s],%s' : '{%s},%s';
  map(obj, function(cObj, cKey) {
    str = isArray ? replace(str, '%s,%s') : replace(str, cKey + ':%s,%s');
    str = createFuncStr(cObj, keys.concat(cKey), str);
  });
  str = replace(str, '', /(%s|,%s)/g);
  return replace(parentStr, str) || str;
}

function createFunc(structure) {
  var base = '{return %s;}';
  var str = createFuncStr(structure, ['o']);
  var result = replace(base, str);
  return new Function('o', result);
}

module.exports = new DeepCopy();
