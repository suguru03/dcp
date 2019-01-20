export const clone = obj => map(obj, value => value);

export const map = (obj, iter) => {
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
};

const replace = (str, value, exp = /%s/) => {
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
};

export const resolveKey = keys => {
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
};

const resolveValue = (keys, value) => {
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
};

const createFuncStr = (obj, keys, str) => {
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
};

// TODO resolve deep prototype
const resolveProto = (str, structure) => {
  if (typeof structure === 'object') {
    str = replace(str, ['p="__proto__",', 'c[p]=o&&o[p];'], /%p/);
  } else {
    str = replace(str, '', /%p/g);
  }
  return str;
};

const resolveCircular = str => {
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
};

export const createFunc = <T>(structure) => {
  var base = '{var u,%pc=%s;%p%sreturn c;}';
  var str = createFuncStr(structure, ['o'], '');
  str = replace(base, str);
  str = resolveProto(str, structure);
  str = resolveCircular(str);
  str = replace(str, '');
  return new Function('o', str) as any;
};
