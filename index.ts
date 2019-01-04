export class DeepCopy {
  private definitionMap: Map<any, any> = new Map();

  clean(key?: any) {
    if (key) {
      this.definitionMap.delete(key);
    } else {
      this.definitionMap = new Map();
    }
    return this;
  }

  define(key: any, structure: any) {
    if (this.definitionMap.has(key)) {
      throw new Error(`${key} is already defined.`);
    }
    const analyze = new Analyze(structure);
    const def = {
      deep: createFunc(analyze.deep()),
      shallow: createFunc(analyze.shallow()),
    };
    this.definitionMap.set(key, def);
    return def.deep;
  }

  shallow(key, obj?) {
    const func = this.get('shallow', key, obj);
    return arguments.length === 1 ? func : func(obj);
  }

  clone(key, obj?) {
    const func = this.get('deep', key, obj);
    return arguments.length === 1 ? func : func(obj);
  }

  private get(type, key, object) {
    if (!this.definitionMap.has(key)) {
      this.define(key, object);
    }
    return this.definitionMap.get(key)[type];
  }
}

class Analyze {
  private structure: any;
  private object: any[] = [];
  private keys: any[] = [];
  constructor(structure: any) {
    this.structure = structure;
  }

  private analyze(structure, keys, depth?: number, current: number = 0) {
    if (structure === null) {
      return 'null';
    }
    const type = typeof structure;
    if (type === 'function') {
      return structure;
    }
    const index = this.object.indexOf(structure);
    if (index >= 0) {
      return resolveKey(clone(this.keys[index])).key;
    }
    if (current === depth || type !== 'object') {
      return type;
    }
    current++;
    this.object.push(structure);
    this.keys.push(keys);
    structure = map(structure, (value, key) =>
      this.analyze(value, keys.concat(key), depth, current),
    );
    if (current === 1) {
      this.object = [];
      this.keys = [];
    }
    return structure;
  }

  deep() {
    return this.analyze(this.structure, ['c']);
  }
  shallow() {
    return this.analyze(this.structure, ['c'], 1);
  }
}

function clone(obj) {
  return map(obj, value => value);
}

function map(obj, iter) {
  if (Array.isArray(obj)) {
    return obj.map((value, index) => iter(value, index));
  }
  let key: any;
  let index = -1;
  const keys = Object.keys(obj);
  const size = keys.length;
  const result = {};
  while (++index < size) {
    key = keys[index];
    result[key] = iter(obj[key], key);
  }
  return result;
}

function replace(str, value, exp = /%s/) {
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
      key: k,
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
    key: key,
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
    s = isArray ? replace(s, '%s,%s') : replace(s, "'" + k + "'" + ':%s,%s');
    s = createFuncStr(o, keys.concat(k), s);
  });
  s = replace(s, '', /(%s|,%s)/g);
  return replace(str, s) || s;
}

// TODO resolve deep prototype
function resolveProto(str, structure) {
  if (typeof structure === 'object') {
    str = replace(str, ['p="__proto__",', 'c[p]=o&&o[p];'], /%p/);
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

export default new DeepCopy();
