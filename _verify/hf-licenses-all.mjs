/** 抓每个仓库的 LICENSE 文件首行作为许可名，写入 _verify/licenses.json。命名要在生成时反查。 */
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

/** 默认抓 enrich.json 里所有仓库；设 LIC_REPOS='owner/a,owner/b' 可以只抓指定仓库（补录批次用） */
const repos = process.env.LIC_REPOS
  ? process.env.LIC_REPOS.split(',').map((s) => s.trim()).filter(Boolean)
  : Object.values(JSON.parse(fs.readFileSync('_verify/enrich.json', 'utf8'))).map((v) => v.repo).filter(Boolean);
const CANDIDATES = ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'License', 'LICENSE-MODEL', 'LICENSE_MODEL', 'license'];
const KNOWN = /^(apache|mit|bsd|cc-|gemma|llama|falcon|nvidia|openmdw|exaone|lfm)/i;

let cache = {};
try { cache = JSON.parse(fs.readFileSync('_verify/licenses.json', 'utf8')); } catch {}

let idx = 0;
async function worker() {
  while (idx < repos.length) {
    const repo = repos[idx++];
    if (cache[repo] && typeof cache[repo] === 'object' && 'inline' in cache[repo]) continue;
    let found = null;
    for (const file of CANDIDATES) {
      try {
        const res = await fetch(`https://huggingface.co/${repo}/raw/main/${file}`, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) continue;
        const text = await res.text();
        const first = text.replace(/^\uFEFF/, '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 3).join(' / ').slice(0, 120);
        // 有些仓库的 LICENSE 是在自家声明后面直接粘一份 Apache-2.0 / MIT 全文
        const inline = /Apache License\s*Version 2\.0|apache\.org\/licenses\/LICENSE-2\.0/i.test(text)
          ? 'Apache-2.0'
          : /Permission is hereby granted, free of charge[\s\S]{0,400}without restriction/i.test(text)
            ? 'MIT'
            : null;
        found = { file, first, inline };
        break;
      } catch {}
    }
    cache[repo] = found ?? { file: null, first: null, inline: null };
  }
}
await Promise.all(Array.from({ length: 5 }, worker));
fs.writeFileSync('_verify/licenses.json', JSON.stringify(cache, null, 1), 'utf8');

for (const repo of repos) {
  const c = cache[repo];
  if (!c.file) console.log(`(no license file)\t${repo}`);
  else if (!KNOWN.test(c.first)) console.log(`CUSTOM\t${repo}\t[${c.file}] ${c.first}`);
}
console.log('done, repos=' + repos.length);