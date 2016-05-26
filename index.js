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
DeepCopy.prototype.define = function(key, structure) {
  if (this._defined[key]) {
    throw new Error(key + ' is already defined.');
  }
  var def = this._defined[key] = {
    deep: createFunc(analyze(structure)),
    shallow: createFunc(analyze(structure, 1))
  };
  return def.deep;
};

DeepCopy.prototype._get = function(type, key, obj) {
  if (!this._defined[key]) {
    this.define(key, obj);
  }
  return this._defined[key][type];
};


DeepCopy.prototype.shallow = function(key, obj) {
  var func = this._get('shallow', key, obj);
  return arguments.length === 1 ? func : func(obj);
};

DeepCopy.prototype.clone = function(key, obj) {
  var func = this._get('deep', key, obj);
  return arguments.length === 1 ? func : func(obj);
};

DeepCopy.prototype.copy = DeepCopy.prototype.clone;
DeepCopy.prototype.deep = DeepCopy.prototype.clone;

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

function analyze(structure, depth, current) {
  if (structure === null) {
    return 'null';
  }
  var type = typeof structure;
  if (type === 'function') {
    return structure;
  }
  current = current || 0;
  if (current === depth || type !== 'object') {
    return type;
  }
  current++;
  return map(structure, function(value) {
    return analyze(value, depth, current);
  });
}

function replace(str, value, exp) {
  exp = exp || /%s/;
  if (!str) {
    return str;
  }
  if (!value || typeof value !== 'object') {
    return str.replace(exp, value);
  }
  map(value, function(value) {
    str = str.replace(exp, value);
  });
  return str;
}

function resolveKey(keys) {
  var str = '%s';
  var key = '%s';
  var k = keys.shift();
  var l = keys.length;
  if (!l) {
    return replace(str, k);
  }
  str = replace(str, ['%s&&%s', k]);
  key = replace(key, ['%s["%s"]%s', k]);
  while (l--) {
    key = replace(key, keys.shift());
    str = replace(str, l ? '%s&&%s' : '%s');
    str = replace(str, replace(key, ''));
    key = replace(key, l ? '["%s"]%s' : '');
  }
  return {
    str: str,
    key: key
  };
}

function resolveValue(keys, value) {
  var str = '%k!==u?%k:%s';
  str = replace(str, resolveKey(keys), /%k/);
  switch (value) {
    case 'string':
      return replace(str, replace('"%s"', ''));
    case 'number':
      return replace(str, 0);
    case 'boolean':
      return replace(str, false);
    case 'null':
      return replace(str, null);
    case 'object':
      return replace(str, '{}');
    default:
      return replace(str, value);
  }
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
  var base = '{var u=undefined;return %s;}';
  var str = createFuncStr(structure, ['o'], '');
  var result = replace(base, str);
  return new Function('o', result);
}

module.exports = new DeepCopy();
