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
  return func(obj);
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

function resolveDefault(type) {
  var str = ' || %s';
  switch (type) {
    case 'string':
      return replace(str, '""');
    case 'number':
      return replace(str, 0);
    case 'boolean':
      return replace(str, false);
    case 'null':
      return replace(str, null);
    default:
      return '';
  }
}

function analyze(obj) {
  if (obj === null) {
    return 'null';
  }
  if (typeof obj !== 'object') {
    return typeof obj;
  }
  return map(obj, analyze);
}

function createFuncStr(obj, key, parentStr) {
  var type = typeof obj;
  if (type !== 'object') {
    if (!parentStr) {
      return key + resolveDefault(obj);
    }

    return replace(parentStr, key + resolveDefault(obj));
  }
  var isArray = Array.isArray(obj);
  var str = isArray ? '[%s],%s' : '{%s},%s';
  map(obj, function(cObj, cKey) {
    str = isArray ? replace(str, '%s,%s') : replace(str, cKey + ': %s,%s');
    // TODO check null
    var pKey = key + '["' + cKey + '"]';
    str = createFuncStr(cObj, pKey, str);
  });
  str = replace(str, '', /(%s|,%s)/g);
  return replace(parentStr, str) || str;
}

function createFunc(structure) {
  var base = '{ var newObj = %s; return newObj; }';
  var str = createFuncStr(structure, 'obj');
  var result = replace(base, str);
  return new Function('obj', result);
}

module.exports = new DeepCopy();
