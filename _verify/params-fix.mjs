/** 按 HF 实测参数量修正既有条目里偏差 ≥5B 的 params（保留「激活 xxB」括注）。 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
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
const APPLY = process.argv.includes('--apply');

for (const f of readdirSync('src/content/llm').filter((x) => x.endsWith('.md'))) {
  const slug = f.replace(/\.md$/, '');
  if (planned.has(slug)) continue;
  const path = `src/content/llm/${f}`;
  let txt = readFileSync(path, 'utf8');
  const hf = txt.match(/^\s+hf: "(.*)"$/m)?.[1] ?? '';
  const paramsLine = txt.match(/^params: "(.*)"$/m)?.[1] ?? '';
  if (!hf || !paramsLine) continue;
  const repo = hf.replace('https://huggingface.co/', '');
  let total = null;
  try {
    const meta = await (await fetch(`https://huggingface.co/api/models/${repo}`, { signal: AbortSignal.timeout(20000) })).json();
    total = meta.safetensors?.total ?? null;
  } catch {}
  if (!total) continue;
  const hfB = total / 1e9;
  const m = paramsLine.match(/^([\d.]+)([BT])(.*)$/i);
  if (!m) continue;
  const claimed = Number(m[1]) * (m[2].toUpperCase() === 'T' ? 1000 : 1);
  if (Math.abs(hfB - claimed) < 5) continue;
  const newLabel = hfB >= 1000 ? `${(hfB / 1000).toFixed(1)}T` : `${Math.round(hfB)}B`;
  const next = `${newLabel}${m[3]}`;
  console.log(`${slug}: ${paramsLine}  ->  ${next}`);
  if (APPLY) {
    txt = txt.replace(/^params: ".*"$/m, `params: "${next}"`);
    writeFileSync(path, txt, 'utf8');
  }
}
console.log(APPLY ? '\n已写入' : '\n（干跑，加 --apply 才写入）');