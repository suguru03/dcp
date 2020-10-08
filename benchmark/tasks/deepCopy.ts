import { Functions } from '../';

export default ({ _, rfdc, dcp }: Functions) => ({
  example1: {
    setup() {
      const obj = {
        a: 1,
        b: 'test',
        c: [true, false, { c1: 'a' }],
        d: { d1: { d11: { d111: { d1111: 0 }, d112: 1 } } },
      };
      return {
        obj,
      };
    },
    taskMap: {
      lodash: ({ obj }) => _.cloneDeep(obj),
      dcp: ({ obj }) => dcp.clone(obj),
      JSON: ({ obj }) => JSON.parse(JSON.stringify(obj)),
      rfdc: ({ obj }) => rfdc(obj),
    },
  },
});
