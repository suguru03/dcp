type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };
type Key = string | number;
export type Cloner<T> = (obj?: DeepPartial<T>) => T;

export class Parser2<T> {
  private readonly objects: Map<any, Key[]> = new Map();
  private hasRecursion: boolean = false;
  private cloner: Cloner<T>;
  constructor(obj: T) {
    this.createCloner(obj);
    this.objects = null;
  }

  getCloner() {
    return this.cloner;
  }

  private createCloner<T>(obj: T) {
    const arg = 'o';
    let str = `{let u, r=${this.parse(obj, [arg], 0)}; return r};`;
    if (this.hasRecursion) {
      this.objects.clear();
      str = this.resolveRecursion(str, obj, ['r'], 0);
    }
    this.cloner = new Function(arg, str) as any;
    console.log('base:', require('util').inspect(obj, false, null));
    console.log('clone:', require('util').inspect(this.cloner(obj), false, null));
    console.log('init:', require('util').inspect(this.cloner(), false, null));
  }

  private parse<T>(obj: T, keys: Key[], depth: number) {
    depth++;
    let init: any;
    switch (typeof obj) {
      case 'object':
        if (obj === null) {
          init = null;
          break;
        }
        if (this.objects.has(obj)) {
          this.hasRecursion = true;
          return 'u';
        }
        this.objects.set(obj, keys);
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

  private parseObject<T>(obj: T, keys: Key[], depth: number) {
    let str = '{';
    const objKeys = Object.keys(obj);
    const l = objKeys.length;
    for (let i = 0; i < l; i++) {
      // debug
      // str += '\n'.padEnd(depth * 2, '  ');
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

  private parseArray<T>(arr: T[], keys: Key[], depth: number) {
    let str = '[';
    const l = arr.length;
    for (let i = 0; i < l; i++) {
      // debug
      // str += '\n'.padEnd(depth * 2, '  ');
      keys[depth] = i;
      str += `${this.parse(arr[i], keys, depth)}`;
      if (i !== l - 1) {
        str += ',';
      }
    }
    str += ']';
    return str;
  }

  // TODO: cache
  private resolveKey(keys: Key[], depth: number) {
    let [key] = keys;
    let path = key;
    let i = 0;
    while (++i < depth) {
      path += `[${keys[i]}]`;
      key += `&&${path}`;
    }
    return [key, path];
  }

  private resolveRecursion<T>(str: string, obj: T, keys: Key[], depth: number) {
    if (!obj || typeof obj !== 'object') {
      return str;
    }
    depth++;
    if (this.objects.has(obj)) {
      // debug
      // str = str.replace(/return/, `\nreturn`);
      const referenceKeys = this.objects.get(obj);
      const referencePath = this.getRecursionPath(referenceKeys, referenceKeys.length);
      const path = this.getRecursionPath(keys, depth);
      return str.replace(/return/, `${path}=${referencePath};return`);
    }
    this.objects.set(obj, this.getRecursionKeys(keys));
    for (const [key, value] of Object.entries(obj)) {
      keys[depth] = `'${key}'`;
      str = this.resolveRecursion(str, value, keys, depth);
      keys[depth] = undefined;
    }
    return str;
  }

  private getRecursionKeys(keys: Key[]): Key[] {
    const newKeys = [];
    let i = -1;
    let l = keys.length;
    while (++i < l) {
      const key = keys[i];
      if (key === undefined) {
        break;
      }
      newKeys.push(key);
    }
    return newKeys;
  }

  private getRecursionPath(keys: Key[], depth: number) {
    let [path] = keys;
    let i = 0;
    while (++i < depth) {
      path += `[${keys[i]}]`;
    }
    return path;
  }
}
