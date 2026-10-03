/** 依次跑三个 DOM 测试；任一失败就整体失败 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const suites = ['filter-test.mjs', 'search-test.mjs', 'nav-test.mjs', 'smoke-test.mjs'];

let failed = 0;
for (const suite of suites) {
  console.log(`\n########## ${suite} ##########`);
  const result = spawnSync(process.execPath, [resolve(HERE, suite)], { stdio: 'inherit' });
  if (result.status !== 0) failed += 1;
}

console.log(failed ? `\n有 ${failed} 个套件失败` : '\n全部套件通过');
process.exit(failed ? 1 : 0);