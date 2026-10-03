/** 用 _verify/final.json（上一轮带 evidence / notes 的核实结果）交叉核对我这轮的条目字段。 */
import { readFileSync, readdirSync } from 'node:fs';

const DIR = 'src/content/llm';
const mine = new Map();
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.md'))) {
  const txt = readFileSync(`${DIR}/${f}`, 'utf8');
  const get = (k) => txt.match(new RegExp(`^${k}: "(.*)"$`, 'm'))?.[1] ?? txt.match(new RegExp(`^${k}: (.*)$`, 'm'))?.[1] ?? '';
  mine.set(f.replace(/\.md$/, ''), {
    title: get('title'), released: get('released'), params: get('params'),
    context: get('context'), license: get('license'), commercial: get('commercial'),
    hf: txt.match(/^\s+hf: "(.*)"$/m)?.[1] ?? '',
  });
}

const final = JSON.parse(readFileSync('_verify/final.json', 'utf8').replace(/^\uFEFF/, ''));
console.log(`final.json 条目数=${final.length}，站内=${mine.size}\n`);
for (const e of final) {
  const slugInRepo = [...mine.entries()].find(([, v]) => v.hf && e.links?.hf === v.hf);
  const key = slugInRepo?.[0];
  const m = slugInRepo?.[1];
  const rel = (e.released ?? '').match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? '';
  console.log(`--- ${e.title}`);
  console.log(`    final: released=${e.released} | params=${e.params} | ctx=${e.context} | lic=${e.license} | 商用=${e.commercial}`);
  if (!m) { console.log('    站内: 没有同 hf 链接的条目'); continue; }
  console.log(`    站内(${key}): released=${m.released} | params=${m.params} | ctx=${m.context} | lic=${m.license} | 商用=${m.commercial}`);
  const diffs = [];
  if (rel && rel !== m.released) diffs.push(`released ${m.released} vs ${rel}`);
  if (e.commercial && e.commercial !== m.commercial) diffs.push(`商用 ${m.commercial} vs ${e.commercial}`);
  if (e.license && m.license && !m.license.includes(e.license.split('（')[0].split(' ')[0])) diffs.push(`license ${m.license} vs ${e.license}`);
  console.log(diffs.length ? `    ⚠ 差异：${diffs.join('；')}` : '    ✓ 关键字段一致');
}