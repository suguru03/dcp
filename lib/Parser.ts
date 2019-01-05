import { clone, map, resolveKey } from './util';

export class Parser {
  private structure: any;
  private object: any[] = [];
  private keys: any[] = [];
  constructor(structure: any) {
    this.structure = structure;
  }

  private parse(structure, keys, depth?: number, current: number = 0) {
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
    structure = map(structure, (value, key) => this.parse(value, keys.concat(key), depth, current));
    if (current === 1) {
      this.object = [];
      this.keys = [];
    }
    return structure;
  }

  deep() {
    return this.parse(this.structure, ['c']);
  }
  shallow() {
    return this.parse(this.structure, ['c'], 1);
  }
}
