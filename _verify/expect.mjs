/** 按 filter-test.mjs 需要的口径，从站点数据算出各筛选结果的期望值。 */
import { readFileSync, readdirSync } from 'node:fs';

const DIR = 'src/content/llm';
const rows = [];
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.md'))) {
  const txt = readFileSync(`${DIR}/${f}`, 'utf8');
  const get = (k) => txt.match(new RegExp(`^${k}: "(.*)"$`, 'm'))?.[1] ?? txt.match(new RegExp(`^${k}: (.*)$`, 'm'))?.[1] ?? '';
  const title = get('title');
  const released = get('released');
  const context = get('context');
  const params = get('params');
  const tags = (txt.match(/^tags: \[(.*)\]$/m)?.[1] ?? '').replace(/"/g, '').split(',').map((s) => s.trim());
  const ctxTag = context.match(/^\s*(\d+(?:\.\d+)?)\s*([KM])/i);
  const contextTag = ctxTag ? `${ctxTag[1]}${ctxTag[2].toUpperCase()}` : '';
  const pm = params.match(/(\d+(?:\.\d+)?)\s*([BT])/i);
  const totalB = pm ? (pm[2].toUpperCase() === 'T' ? Number(pm[1]) * 1000 : Number(pm[1])) : null;
  const sizeTag = totalB == null ? '' : totalB < 100 ? '低 ≤100B' : totalB < 500 ? '中 100-500B' : '高 ≥500B';
  rows.push({ title, released, family: get('family'), contextTag, sizeTag, tags, month: released.slice(0, 7) });
}
const n = (f) => rows.filter(f).length;
console.log('总条数', rows.length);
console.log('家族数', new Set(rows.map((r) => r.family)).size);
console.log('family=Kimi', n((r) => r.family === 'Kimi'), rows.filter((r) => r.family === 'Kimi').map((r) => r.title));
console.log('family=Kimi|GLM', n((r) => r.family === 'Kimi' || r.family === 'GLM'));
console.log('2026-06', n((r) => r.month === '2026-06'), rows.filter((r) => r.month === '2026-06').map((r) => r.title));
console.log('2026-06 + (Kimi|GLM)', n((r) => r.month === '2026-06' && (r.family === 'Kimi' || r.family === 'GLM')));
console.log('2026-06 + MoE', n((r) => r.month === '2026-06' && r.tags.includes('MoE')), rows.filter((r) => r.month === '2026-06' && r.tags.includes('MoE')).map((r) => r.title));
console.log('MoE 全部', n((r) => r.tags.includes('MoE')));
console.log('2025-06|2025-07', n((r) => r.month === '2025-06' || r.month === '2025-07'));
console.log('family=DeepSeek', n((r) => r.family === 'DeepSeek'));
console.log('family=Qwen', n((r) => r.family === 'Qwen'));
const qwenMonths = {};
for (const r of rows.filter((r) => r.family === 'Qwen')) qwenMonths[r.month] = (qwenMonths[r.month] ?? 0) + 1;
console.log('Qwen 按月', JSON.stringify(qwenMonths));
console.log('所有月份', JSON.stringify(rows.reduce((a, r) => (a[r.month] = (a[r.month] ?? 0) + 1, a), {})));
console.log('2026-04 + DeepSeek + MoE', n((r) => r.month === '2026-04' && r.family === 'DeepSeek' && r.tags.includes('MoE')), rows.filter((r) => r.month === '2026-04' && r.family === 'DeepSeek').map((r) => r.title));
console.log('contextTag 1M', n((r) => r.contextTag === '1M'));
console.log('sizeTag 高', n((r) => r.sizeTag === '高 ≥500B'));
console.log('sizeTag 低', n((r) => r.sizeTag === '低 ≤100B'));
console.log('contextTag 256K', n((r) => r.contextTag === '256K'), rows.filter((r) => r.contextTag === '256K').map((r) => r.title));
console.log('family=LFM 且 2025-01', n((r) => r.family === 'LFM' && r.month === '2025-01'));
console.log('family=LFM', n((r) => r.family === 'LFM'), rows.filter((r) => r.family === 'LFM').map((r) => r.title));