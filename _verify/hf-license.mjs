/** 抓仓库里的 LICENSE 文件做商用判定抽查。 */
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

const repos = process.argv.slice(2);
for (const repo of repos) {
  let text = '';
  let name = '';
  for (const file of ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'License.txt', 'NOTICE']) {
    try {
      const res = await fetch(`https://huggingface.co/${repo}/raw/main/${file}`, { signal: AbortSignal.timeout(20000) });
      if (res.ok) { text = await res.text(); name = file; break; }
    } catch {}
  }
  if (!text) {
    try {
      const meta = await (await fetch(`https://huggingface.co/api/models/${repo}`, { signal: AbortSignal.timeout(20000) })).json();
      console.log(`### ${repo}\n  license tag: ${meta.cardData?.license ?? '(none)'} | license_name: ${meta.cardData?.license_name ?? ''} | link: ${meta.cardData?.license_link ?? ''}\n`);
    } catch (e) { console.log(`### ${repo}\n  FAILED ${e.message}\n`); }
    continue;
  }
  const norm = text.replace(/\s+/g, ' ');
  const hits = [];
  for (const [label, re] of [
    ['commercial-use-grant', /commercial use/i],
    ['non-commercial', /non-?commercial/i],
    ['not-for-commercial', /not (?:be )?used? for commercial/i],
    ['100M MAU', /100 million|100,000,000|one hundred million/i],
    ['700M MAU', /700 million|700,000,000/i],
    ['Apache-2.0', /Apache License\s*2\.0/i],
    ['MIT', /MIT License|Permission is hereby granted, free of charge/i],
    ['Tencent', /Tencent/i],
    ['NVIDIA', /NVIDIA/i],
    ['Apache link', /apache\.org\/licenses/i],
  ]) if (re.test(norm)) hits.push(label);
  console.log(`### ${repo} [${name}] len=${text.length}\n  hits: ${hits.join(', ') || '(none)'}\n  head: ${norm.slice(0, 260)}\n`);
}