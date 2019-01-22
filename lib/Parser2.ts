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
    const str = `{let u,n=null; return ${this.parse(obj, ['o'], '')}};`;
    console.log(str);
    this.cloner = new Function('o', str) as any;
    console.log('base:', obj);
    console.log('clone:', this.cloner(obj));
    console.log('init:', this.cloner());
  }

  private parse<T>(obj: T, keys: string[], str: string) {
    if (typeof obj !== 'object' || obj === null) {
      return this.resolveValue(keys, obj);
    }
    return null;
  }

  private resolveValue(keys: string[], value: unknown) {
    const key = resolveKey(keys);
    switch (typeof value) {
      case 'string':
        return `${key}!==u?'${value}':''`;
      case 'number':
      case 'undefined':
      case 'boolean':
      case 'function':
      case 'object':
        return value === null ? null : null;
      default:
      // return replace(replace('%c<%s|%s>', info.key), value);
    }
    return null;
  }
}

const resolveKey = (keys: string[]): string => {
  const [base] = keys;
  if (keys.length === 1) {
    return base;
  }
  return base;
};
