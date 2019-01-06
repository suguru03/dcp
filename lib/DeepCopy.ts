import { Parser } from './Parser';
import { createFunc } from './util';

type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };
type Cloner<T> = (obj?: DeepPartial<T>) => T;

type StrongType = string | number | boolean | undefined | null;
type WeakType = object;
type ClonerMap = Map<StrongType, Cloner<any>>;
type WeakClonerMap = WeakMap<WeakType, Cloner<any>>;

interface MapInterface {
  get: <T = any>(key: any) => Cloner<T>;
  set: (key: any, cloner: Cloner<any>) => this;
  has: (key: any) => boolean;
  delete: (key: any) => boolean;
}

export class DeepCopy {
  private clonerMap: ClonerMap = new Map();
  private weakClonerMap: WeakClonerMap = new WeakMap();

  clean(key?: any): this {
    if (key) {
      const map = this.getClonerMap(key);
      map.delete(key);
    } else {
      this.clonerMap = new Map();
      this.weakClonerMap = new WeakMap();
    }
    return this;
  }

  define<T>(key: any, structure: T): Cloner<T> {
    const map = this.getClonerMap(key);
    if (map.has(key)) {
      throw new Error(`${key} is already defined.`);
    }
    const parser = new Parser(structure);
    const cloner = createFunc(parser.deep());
    map.set(key, cloner);
    return cloner;
  }

  clone<K>(key: K): K;
  clone<K, T>(key: K, obj: T): T;
  clone<K, T>(key: K, obj?: T): T {
    if (arguments.length === 1) {
      obj = key as any;
    }
    const map = this.getClonerMap(key);
    if (!map.has(key)) {
      this.define(key, obj);
    }
    return map.get(key)(obj);
  }

  private getClonerMap(key: any): MapInterface {
    return key && typeof key === 'object' ? this.weakClonerMap : this.clonerMap;
  }
}
