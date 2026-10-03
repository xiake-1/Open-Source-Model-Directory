/** 抽查条目内部自洽性：简介里写的参数量与 context 是否和 params / context 字段对得上。 */
import { readFileSync, readdirSync } from 'node:fs';

const rows = [];
for (const f of readdirSync('src/content/llm').filter((x) => x.endsWith('.md'))) {
  const txt = readFileSync(`src/content/llm/${f}`, 'utf8');
  const get = (k) => txt.match(new RegExp(`^${k}: "(.*)"$`, 'm'))?.[1] ?? '';
  rows.push({ slug: f.replace(/\.md$/, ''), summary: get('summary'), params: get('params'), context: get('context') });
}

let bad = 0;
for (const r of rows) {
  const pm = r.params?.match(/^([\d.]+)([BT])/i);
  const fieldTotal = pm ? Number(pm[1]) * (pm[2].toUpperCase() === 'T' ? 1000 : 1) : null;
  const sm = r.summary?.match(/(\d+(?:\.\d+)?)\s*(B|T)\b/);
  const summaryTotal = sm ? Number(sm[1]) * (sm[2] === 'T' ? 1000 : 1) : null;
  const issues = [];
  if (fieldTotal && summaryTotal && Math.abs(fieldTotal - summaryTotal) > Math.max(2, fieldTotal * 0.02)) {
    issues.push(`简介说 ${sm[0]}，字段是 ${r.params}`);
  }
  const ctxField = r.context?.match(/^(\d+(?:\.\d+)?)(K|M)/i);
  const ctxSummary = r.summary?.match(/(\d+(?:\.\d+)?)\s*(K|M)\b/);
  if (ctxField && ctxSummary && ctxField[1] !== ctxSummary[1]) {
    issues.push(`简介说上下文 ${ctxSummary[0]}，字段是 ${r.context}`);
  }
  if (issues.length) { bad++; console.log(`${r.slug}: ${issues.join('；')}\n    ${r.summary}`); }
}
console.log(`\n有疑问 ${bad} 条 / 共 ${rows.length} 条`);