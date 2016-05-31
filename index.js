(function() {

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
    var analyze = new Analyze(structure);
    var def = this._defined[key] = {
      deep: createFunc(analyze.deep()),
      shallow: createFunc(analyze.shallow())
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

  function Analyze(structure) {
    this._structure = structure;
    this._object = [];
    this._keys = [];
  }

  Analyze.prototype._analyze = function(structure, keys, depth, current) {
    if (structure === null) {
      return 'null';
    }
    var type = typeof structure;
    if (type === 'function') {
      return structure;
    }
    var index = this._object.indexOf(structure);
    if (index >= 0) {
      return resolveKey(clone(this._keys[index])).key;
    }
    current = current || 0;
    if (current === depth || type !== 'object') {
      return type;
    }
    current++;
    var self = this;
    self._object.push(structure);
    self._keys.push(keys);
    structure = map(structure, function(value, key) {
      return self._analyze(value, keys.concat(key), depth, current);
    });
    if (current === 1) {
      this._object = [];
      this._keys = [];
    }
    return structure;
  };

  Analyze.prototype.deep = function() {
    return this._analyze(this._structure, ['c']);
  };

  Analyze.prototype.shallow = function() {
    return this._analyze(this._structure, ['c'], 1);
  };

  function clone(obj) {
    return map(obj, function(value) {
      return value;
    });
  }

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
      return {
        str: replace(str, k),
        key: k
      };
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
    var str = '%s!==u?%s:%s';
    var info = resolveKey(keys);
    str = replace(str, info);
    switch (value) {
      case 'string':
        return replace(str, replace('"%s"', ''));
      case 'number':
        return replace(str, 0);
      case 'undefined':
        return replace(str, undefined);
      case 'boolean':
        return replace(str, false);
      case 'null':
        return replace(str, null);
      case 'object':
        return replace(str, '{}');
      default:
        if (typeof value === 'function') {
          return replace(str, value.toString());
        }
        // circular structure
        return replace(replace('%c<%s|%s>', info.key), value);
    }
  }

  function createFuncStr(obj, keys, str) {
    var type = typeof obj;
    if (type !== 'object') {
      if (!str) {
        return resolveValue(keys, obj);
      }
      return replace(str, resolveValue(keys, obj));
    }
    var isArray = Array.isArray(obj);
    var s = isArray ? '[%s],%s' : '{%s},%s';
    map(obj, function(o, k) {
      s = isArray ? replace(s, '%s,%s') : replace(s, k + ':%s,%s');
      s = createFuncStr(o, keys.concat(k), s);
    });
    s = replace(s, '', /(%s|,%s)/g);
    return replace(str, s) || s;
  }

  // TODO resolve deep prototype
  function resolveProto(str, structure) {
    if (typeof structure === 'object') {
      str = replace(str, ['p="__proto__",', "c[p]=o&&o[p];"], /%p/);
    } else {
      str = replace(str, '', /%p/g);
    }
    return str;
  }

  function resolveCircular(str) {
    var exp = /%c<(.*?)>/;
    var bar = str.match(exp);
    if (!bar) {
      return str;
    }
    str = replace(str, 'u', exp);
    var param = bar[1].split(/\|/);
    var key = replace(param[0], 'c', /o/);
    var val = param[1];
    var s = '%s=%s;';
    s = replace(s, [key, val]);
    str = replace(str, ['%s%s', s]);
    return resolveCircular(str);
  }

  function createFunc(structure) {
    var base = '{var u,%pc=%s;%p%sreturn c;}';
    var str = createFuncStr(structure, ['o'], '');
    str = replace(base, str);
    str = resolveProto(str, structure);
    str = resolveCircular(str);
    str = replace(str, '');
    return new Function('o', str);
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = new DeepCopy();
  } else {
    this.dcp = new DeepCopy();
  }
}.call(this));
