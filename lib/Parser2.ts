type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };
type Cloner<T> = (obj?: DeepPartial<T>) => T;

export class Parser2<T> {
  private readonly objects: Set<any> = new Set();
  private cloner: Cloner<T>;
  constructor(obj: T) {
    this.createCloner(obj);
    this.objects = null;
  }

  private createCloner<T>(obj: T) {
    const arg = 'o';
    const str = `{let u; return ${this.parse(obj, [arg], 0)}};`;
    console.log(str);
    this.cloner = new Function(arg, str) as any;
    console.log('base:', require('util').inspect(obj, false, null));
    console.log('clone:', require('util').inspect(this.cloner(obj), false, null));
    console.log('init:', require('util').inspect(this.cloner(), false, null));
  }

  private parse<T>(obj: T, keys: string[], depth: number) {
    depth++;
    let init: any;
    switch (typeof obj) {
      case 'object':
        if (obj === null) {
          init = null;
          break;
        }
        if (Array.isArray(obj)) {
          return this.parseArray(obj, keys, depth);
        }
        return this.parseObject(obj, keys, depth);
      case 'string':
        init = `''`;
        break;
      case 'number':
        init = 0;
        break;
      case 'undefined':
        init = 'u';
        break;
      case 'boolean':
        init = false;
        break;
      case 'function':
        init = obj.toString();
        break;
    }
    const [key, path] = this.resolveKey(keys, depth);
    return `${key}!==u?${path}:${init}`;
  }

  private parseArray<T>(obj: T[], keys: string[], depth: number) {}

  private parseObject<T>(obj: T, keys: string[], depth: number) {
    let str = '{';
    const objKeys = Object.keys(obj);
    const l = objKeys.length;
    for (let i = 0; i < l; i++) {
      // debug
      // str += '\n  ';

      const k = objKeys[i];
      const v = obj[k];
      const ks = `'${k}'`;
      keys[depth] = ks;
      str += `${ks}:${this.parse(v, keys, depth)}`;
      if (i !== l - 1) {
        str += ',';
      }
    }
    str += '}';
    return str;
  }

  // TODO: cache
  private resolveKey(keys: string[], depth: number) {
    let [key] = keys;
    let path = key;
    let i = 0;
    while (++i < depth) {
      const k = `[${keys[i]}]`;
      key += `&&${k}`;
      path += k;
    }
    return [key, path];
  }
}
