/** 检查旧条目的 params 与 HF 实测参数量是否一致（只报告，不自动改）。 */
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

function systemProxy() {
  if (process.env.HTTPS_PROXY) return process.env.HTTPS_PROXY;
  try {
    const out = execFileSync('reg', ['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'], { encoding: 'utf8' });
    const on = /ProxyEnable\s+REG_DWORD\s+0x1/.test(out);
    const server = out.match(/ProxyServer\s+REG_SZ\s+(\S+)/)?.[1];
    if (on && server) return server.includes('://') ? server : `http://${server}`;
  } catch {}
  return '';
}
const PROXY = systemProxy();
const { setGlobalDispatcher, ProxyAgent } = await import('undici').catch(() => ({}));
if (PROXY && setGlobalDispatcher && ProxyAgent) setGlobalDispatcher(new ProxyAgent(PROXY));

const plan = (await import('./plans.mjs')).models;
const planned = new Set(plan.map((m) => m.slug));

const rows = [];
for (const f of readdirSync('src/content/llm').filter((x) => x.endsWith('.md'))) {
  const slug = f.replace(/\.md$/, '');
  if (planned.has(slug)) continue; // 这轮生成的不看
  const txt = readFileSync(`src/content/llm/${f}`, 'utf8');
  const hf = txt.match(/^\s+hf: "(.*)"$/m)?.[1] ?? '';
  const params = txt.match(/^params: "(.*)"$/m)?.[1] ?? '';
  if (!hf) { rows.push({ slug, note: '无 hf 链接' }); continue; }
  const repo = hf.replace('https://huggingface.co/', '');
  let total = null;
  try {
    const meta = await (await fetch(`https://huggingface.co/api/models/${repo}`, { signal: AbortSignal.timeout(20000) })).json();
    total = meta.safetensors?.total ?? null;
  } catch {}
  rows.push({ slug, repo, params, hfTotal: total ? Math.round(total / 1e9) : null });
}
for (const r of rows) {
  if (r.note) { console.log(`${r.slug}\t${r.note}`); continue; }
  const claimed = Number((r.params.match(/([\d.]+)\s*([BT])/i) ?? [])[1]) * ((r.params.match(/([\d.]+)\s*([BT])/i) ?? [])[2]?.toUpperCase() === 'T' ? 1000 : 1);
  const diff = r.hfTotal && claimed ? Math.abs(r.hfTotal - claimed) : null;
  const flag = diff == null ? '?' : diff <= 3 ? 'ok' : `⚠ 差 ${diff}B`;
  console.log(`${r.slug}\t条目=${r.params || '(空)'}\tHF=${r.hfTotal ?? '无'}\t${flag}`);
}