import { Parser } from './Parser';
import { createFunc } from './util';

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
    const analyze = new Parser(structure);
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
