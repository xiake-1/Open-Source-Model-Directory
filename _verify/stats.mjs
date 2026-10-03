/** 汇总当前收录数据（家族、按月、商用），用于更新文档里的数字。 */
import { readFileSync, readdirSync } from 'node:fs';

const rows = [];
for (const f of readdirSync('src/content/llm').filter((x) => x.endsWith('.md'))) {
  const txt = readFileSync(`src/content/llm/${f}`, 'utf8');
  const get = (k) => txt.match(new RegExp(`^${k}: "(.*)"$`, 'm'))?.[1] ?? txt.match(new RegExp(`^${k}: (.*)$`, 'm'))?.[1] ?? '';
  rows.push({ family: get('family'), released: get('released'), commercial: get('commercial'), org: get('org') });
}

const fams = new Map();
for (const r of rows) fams.set(r.family, (fams.get(r.family) ?? 0) + 1);
const months = new Map();
for (const r of rows) months.set(r.released.slice(0, 7), (months.get(r.released.slice(0, 7)) ?? 0) + 1);
const comm = new Map();
for (const r of rows) comm.set(r.commercial, (comm.get(r.commercial) ?? 0) + 1);

const sorted = [...months.entries()].sort();
console.log(`总条数 ${rows.length}`);
console.log(`时间跨度 ${sorted[0][0]} ～ ${sorted[sorted.length - 1][0]}（${months.size} 个月）`);
console.log(`家族数 ${fams.size}`);
console.log('按家族（前 20）：' + [...fams.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, v]) => `${k} ${v}`).join('、'));
console.log('全部家族：' + [...fams.keys()].sort().join(' / '));
console.log('商用：' + [...comm.entries()].map(([k, v]) => `${k} ${v}`).join('、'));
console.log('按月：' + sorted.map(([k, v]) => `${k} ${v}`).join('、'));