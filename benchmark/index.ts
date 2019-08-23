import * as _ from 'lodash';
import { Suite } from 'benchmark';
import * as minimist from 'minimist';

import dcp, { DeepCopy } from '../';
import * as tasks from './tasks';

export interface Functions {
  _: _.LoDashStatic;
  dcp: DeepCopy;
}

const funcs = { _, dcp };

const argv = minimist(process.argv.slice(2));

const target = argv.t || argv.target || '.*'; // -t <function name>
const regex = new RegExp(target);

console.log('======================================');
runTasks().catch(console.error);

async function runTasks() {
  const queue = _.chain(tasks)
    .pickBy((func, key) => regex.test(key))
    .map((createTaskMap, name) => {
      const taskMap = createTaskMap(funcs);
      return _.map(taskMap, (obj, title) => [`${name}:${title}`, obj]);
    })
    .flatten()
    .value();
  while (queue.length) {
    await execute().catch(console.error);
  }

  async function execute() {
    if (queue.length === 0) {
      return;
    }
    const [name, task]: any[] = queue.shift();
    console.log(`running ${name}...`);
    const setup = task.setup();
    const suite = new Suite();
    for (const [key, func] of Object.entries<Function>(task.taskMap)) {
      suite.add(key, () => func(setup));
    }

    return new Promise(resolve => {
      suite
        .on('complete', function() {
          const result = _.chain(this)
            .map(data => {
              const { name, stats } = data;
              const { mean } = stats;
              return { name, mean };
            })
            .sortBy('mean')
            .value();

          for (let [rank, { name, mean }] of result.entries()) {
            const diff = _.first(result).mean / mean;
            const rate = mean / _.first(result).mean;
            mean *= Math.pow(10, 6);
            ++rank;
            console.log(`[${rank}] "${name}" ${mean.toPrecision(3)}μs[${diff.toPrecision(3)}][${rate.toPrecision(3)}]`);
          }
          result.forEach(({ name, mean }, index) => {});
          resolve();
        })
        .run();
    });
  }
}
