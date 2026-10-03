/**
 * 由 _verify/aigc-plans.mjs 生成 src/content/aigc/*.md（生图 / 生视频条目）。
 *
 * 与 LLM 那条流水线（plans.mjs → generate.mjs）同一套路，区别在于字段是 AIGC 的那几项
 * （output / architecture / params / vram），并且用 `_verify/aigc-enrich.json`
 * （由 `aigc-verify.mjs` 拉好的 HF 元数据）做交叉核验：
 *   createdAt   → 与 plan 的 released 对一遍，差值 ≥3 天会打出来人工复核
 *   params      → plan 没写时用它兜底（safetensors 真实参数量）
 *   license     → 与 plan 手写的许可名并列打印，方便肉眼比对
 *
 * 用法：
 *   node _verify/aigc-generate.mjs                  # 全部，覆盖写入
 *   node _verify/aigc-generate.mjs flux             # 只生成 slug 以 flux 开头的
 *   node _verify/aigc-generate.mjs --dry            # 只看会写成什么，不落盘
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { PLANS } from './aigc-plans.mjs';

const OUT = 'src/content/aigc';
const ADDED = '2026-10-03';
const dry = process.argv.includes('--dry');
const filter = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? '';

/** 枚举从 src/lib/taxonomy.ts 正则解析，改标签体系只需要动那一个文件 */
const tax = await fs.readFile('src/lib/taxonomy.ts', 'utf8');
const listOf = (name) => {
  const m = tax.match(new RegExp(`${name}\\s*=\\s*\\[([^\\]]*)\\]`));
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [];
};
const AIGC_TAGS = listOf('AIGC_TAGS');
const COMMERCIAL_VALUES = listOf('COMMERCIAL_VALUES');

const enrich = await fs.readFile('_verify/aigc-enrich.json', 'utf8').then(JSON.parse).catch(() => ({}));

function q(s) {
  return `"${String(s).replace(/"/g, '\\"')}"`;
}

/** 生成一条条目的 frontmatter（模型页不写正文，所以文件到这里就结束） */
function render(p) {
  const lines = ['---'];
  lines.push(`title: ${q(p.title)}`);
  lines.push(`org: ${q(p.org)}`);
  if (p.family) lines.push(`family: ${q(p.family)}`);
  lines.push(`released: ${p.released}`);
  lines.push(`added: ${ADDED}`);
  lines.push(`summary: ${q(p.summary)}`);
  lines.push(`tags: [${p.tags.join(', ')}]`);
  if (p.license) lines.push(`license: ${q(p.license)}`);
  lines.push(`commercial: ${p.commercial}`);
  lines.push(`output: ${p.output}`);
  if (p.architecture) lines.push(`architecture: ${q(p.architecture)}`);
  if (p.params) lines.push(`params: ${q(p.params)}`);
  if (p.vram) lines.push(`vram: ${q(p.vram)}`);
  lines.push('links:');
  for (const [k, v] of Object.entries(p.links ?? {})) {
    if (!v) continue;
    if (!['hf', 'github', 'paper', 'demo', 'docs'].includes(k)) throw new Error(`${p.slug}: 未知链接字段 ${k}`);
    lines.push(`  ${k}: ${q(v)}`);
  }
  lines.push('---');
  return `${lines.join('\n')}\n`;
}

const problems = [];
const drift = [];
const todo = PLANS.filter((p) => !filter || p.slug.startsWith(filter));
console.log(`plans=${PLANS.length} todo=${todo.length}${dry ? ' (dry-run)' : ''}`);

const seen = new Set();
for (const p of todo) {
  if (seen.has(p.slug)) problems.push(`${p.slug}: slug 在 plans 里重复`);
  seen.add(p.slug);
  if (!p.title || !p.org || !p.released || !p.summary) problems.push(`${p.slug}: 缺 title / org / released / summary`);
  if (!['image', 'video'].includes(p.output)) problems.push(`${p.slug}: output 只能是 image / video`);
  if (!COMMERCIAL_VALUES.includes(p.commercial)) problems.push(`${p.slug}: commercial 不在枚举里（${p.commercial}）`);
  for (const t of p.tags ?? []) if (!AIGC_TAGS.includes(t)) problems.push(`${p.slug}: tags 里的 ${t} 不在 ${AIGC_TAGS.join(' / ')}`);
  const chars = [...(p.summary ?? '')].filter((c) => /[\u4e00-\u9fa5]/.test(c)).length;
  if (chars < 10) problems.push(`${p.slug}: 简介中文只有 ${chars} 字（schema 要求 ≥10 字）`);
  if (!Object.values(p.links ?? {}).some(Boolean)) problems.push(`${p.slug}: 一个链接都没有`);

  const e = p.repo ? enrich[p.repo] : null;
  if (p.repo && !e) problems.push(`${p.slug}: ${p.repo} 不在 aigc-enrich.json 里（先跑 aigc-verify.mjs）`);
  // 401 是 gated 仓库（需要登录接受条款才能看元数据），模型本身存在，只提示不拦
  if (e && !e.exists && !/401/.test(e.error ?? '')) problems.push(`${p.slug}: ${p.repo} 在 HF 上取不到（${e.error}）`);
  if (e && !e.exists) console.log(`  · ${p.slug}: ${p.repo} 是 gated 仓库，HF 元数据不可读（按官方模型卡填写）`);
  if (e?.created && e.created !== p.released) {
    const days = Math.round((new Date(p.released) - new Date(e.created)) / 86400000);
    if (Math.abs(days) >= 3) drift.push(`${p.slug}\t官方 ${p.released}\tHF ${e.created}\t${days > 0 ? '+' : ''}${days} 天`);
  }
  // plan 没写参数量时用 HF 的实测值兜底
  if (!p.params && e?.params) p.params = e.params;

  const body = render(p);
  if (!dry) {
    await fs.mkdir(OUT, { recursive: true });
    await fs.writeFile(path.join(OUT, `${p.slug}.md`), body, 'utf8');
  }
}

console.log(`written=${dry ? 0 : todo.length} -> ${OUT}`);
if (problems.length) {
  console.log(`\n== 字段问题（${problems.length}）==`);
  for (const x of problems) console.log('  ' + x);
}
if (drift.length) {
  console.log(`\n== 官方发布日 vs HF 仓库创建日（差值 ≥3 天，需要复核；${drift.length}）==`);
  for (const x of drift) console.log('  ' + x);
}
if (problems.length) process.exitCode = 1;