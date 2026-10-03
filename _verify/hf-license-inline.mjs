/** 给 licenses.json 补 inline 字段：判断 LICENSE 文件里是否夹带了 Apache-2.0 / MIT 全文。 */
import fs from 'node:fs';
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

const cache = JSON.parse(fs.readFileSync('_verify/licenses.json', 'utf8'));
const entries = Object.entries(cache).filter(([, v]) => v.file);
let done = 0;
let idx = 0;
async function worker() {
  while (idx < entries.length) {
    const [repo, v] = entries[idx++];
    if (v.inline !== undefined) continue;
    try {
      const res = await fetch(`https://huggingface.co/${repo}/raw/main/${v.file}`, { signal: AbortSignal.timeout(25000) });
      const text = res.ok ? await res.text() : '';
      v.inline = /Apache License\s*Version 2\.0|apache\.org\/licenses\/LICENSE-2\.0/i.test(text)
        ? 'Apache-2.0'
        : /Permission is hereby granted, free of charge[\s\S]{0,400}without restriction/i.test(text)
          ? 'MIT'
          : null;
      done++;
    } catch { v.inline = v.inline ?? null; }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
fs.writeFileSync('_verify/licenses.json', JSON.stringify(cache, null, 1), 'utf8');
console.log('updated', done);
for (const [repo, v] of entries) if (v.inline) console.log(`  ${v.inline}\t${repo}`);