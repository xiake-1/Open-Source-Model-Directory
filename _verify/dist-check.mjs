/** 汇总站点数据的分布，用来抽查有没有异常（月份、家族、商用、上下文、参数量分档）。 */
import { readFileSync, readdirSync } from 'node:fs';

const DIR = 'src/content/llm';
const rows = [];
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.md'))) {
  const txt = readFileSync(`${DIR}/${f}`, 'utf8');
  const get = (k) => txt.match(new RegExp(`^${k}: "(.*)"$`, 'm'))?.[1] ?? txt.match(new RegExp(`^${k}: (.*)$`, 'm'))?.[1] ?? '';
  rows.push({
    slug: f.replace(/\.md$/, ''),
    title: get('title'),
    family: get('family'),
    released: get('released'),
    commercial: get('commercial'),
    params: get('params'),
    context: get('context'),
    tags: get('tags'),
  });
}

const count = (key) => {
  const m = new Map();
  for (const r of rows) m.set(r[key], (m.get(r[key]) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

console.log(`总计 ${rows.length} 条\n`);
for (const key of ['commercial', 'family', 'context', 'tags']) {
  console.log(`== ${key} ==`);
  for (const [k, v] of count(key)) console.log(`  ${v}\t${k}`);
  console.log('');
}
console.log('== 2025 年条数 by 月 ==');
const byMonth = new Map();
for (const r of rows) {
  const k = (r.released ?? '').slice(0, 7);
  byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
}
for (const [k, v] of [...byMonth.entries()].sort()) console.log(`  ${k}\t${v}`);
console.log('');
console.log('== 摘要过短（<10 字） ==');
for (const r of rows) {
  const s = readFileSync(`${DIR}/${r.slug}.md`, 'utf8').match(/^summary: "(.*)"$/m)?.[1] ?? '';
  if (s.length < 10) console.log(`  ${r.slug}: ${s}`);
}
console.log('');
console.log('== 缺 family / params 的条目 ==');
for (const r of rows) if (!r.family || !r.params) console.log(`  ${r.slug}: family=${r.family} params=${r.params}`);