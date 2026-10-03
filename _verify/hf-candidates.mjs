/**
 * 把 _verify/hf/*.json 去重、筛选成「值得进站」的候选清单。
 * 只保留：text-generation / image-text-to-text / any-to-any 类，2025-01-01 之后创建，likes>0 或 downloads>2000。
 * 输出：_verify/hf-candidates.md（按机构分组）与 _verify/hf-candidates.json
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('_verify/hf');
const KEEP_PIPELINE = /^(text-generation|image-text-to-text|any-to-any|text2text-generation|conversational|audio-text-to-text)$/;

const seen = new Map();
for (const file of fs.readdirSync(DIR)) {
  if (!file.endsWith('.json')) continue;
  const author = path.basename(file, '.json');
  for (const m of JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'))) {
    if (!m.id) continue;
    const prev = seen.get(m.id);
    if (!prev || (m.downloads ?? 0) > (prev.downloads ?? 0)) seen.set(m.id, { ...m, author });
  }
}

const all = [...seen.values()];
const rows = all
  .filter((m) => (m.createdAt ?? '') >= '2025-01-01')
  .filter((m) => (m.likes ?? 0) > 0 || (m.downloads ?? 0) > 2000)
  .filter((m) => KEEP_PIPELINE.test(m.pipeline ?? '') || (m.tags ?? []).length > 0)
  .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));

const byAuthor = new Map();
for (const r of rows) {
  if (!byAuthor.has(r.author)) byAuthor.set(r.author, []);
  byAuthor.get(r.author).push(r);
}

const md = [
  '# HF 候选清单（去重后）',
  '',
  `> 由 _verify/hf-candidates.mjs 生成。原始 ${all.length} 个仓库 → 候选 ${rows.length} 条（2025-01-01 之后、likes>0 或下载>2000、LLM 相关 pipeline）。`,
  '> createdAt = 仓库创建时间，可作为 released 的权威依据；likes/downloads 用来判断是不是「有影响力」。',
  '',
  `机构数：${byAuthor.size}`,
  '',
];
for (const [author, list] of [...byAuthor.entries()].sort((a, b) => b[1].length - a[1].length)) {
  md.push(`## ${author}（${list.length}）`, '');
  md.push('| 仓库 ID | createdAt | likes | downloads | pipeline |');
  md.push('| --- | --- | --- | --- | --- |');
  for (const r of list) {
    md.push(`| ${r.id} | ${(r.createdAt ?? '').slice(0, 10)} | ${r.likes ?? 0} | ${r.downloads ?? 0} | ${r.pipeline ?? ''} |`);
  }
  md.push('');
}
fs.writeFileSync('_verify/hf-candidates.md', md.join('\n'), 'utf8');
fs.writeFileSync('_verify/hf-candidates.json', JSON.stringify(rows, null, 1), 'utf8');
console.log(`rows=${rows.length} authors=${byAuthor.size}`);
for (const [a, l] of [...byAuthor.entries()].sort((x, y) => y[1].length - x[1].length).slice(0, 20)) console.log(`  ${a}: ${l.length}`);