/** 列出「context 字段来自 config 兜底」（plan 里没写）的条目，供人工复核。 */
import { readFileSync, readdirSync } from 'node:fs';
const plan = (await import('./plans.mjs')).models;
const withCtx = new Map(plan.map((m) => [m.slug, m.context]));
for (const f of readdirSync('src/content/llm').filter((x) => x.endsWith('.md'))) {
  const slug = f.replace(/\.md$/, '');
  if (!withCtx.has(slug)) continue;
  if (withCtx.get(slug) !== undefined) continue;
  const txt = readFileSync(`src/content/llm/${f}`, 'utf8');
  const ctx = txt.match(/^context: "(.*)"$/m)?.[1] ?? '(无)';
  console.log(`${slug}\t${ctx}`);
}