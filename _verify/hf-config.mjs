/** 针对 config 拿不到的字段：直接读 HuggingFace 仓库的 config.json / 参数量索引。 */
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
  let cfg = {};
  let total = null;
  try {
    cfg = await (await fetch(`https://huggingface.co/${repo}/raw/main/config.json`, { signal: AbortSignal.timeout(25000) })).json();
  } catch (e) { cfg = { err: String(e.message) }; }
  try {
    const st = await (await fetch(`https://huggingface.co/api/models/${repo}?blobs=false`, { signal: AbortSignal.timeout(25000) })).json();
    total = st?.safetensors?.total ?? null;
  } catch {}
  const keys = Object.keys(cfg).filter((k) => /expert|param|head|hidden|layer|vocab|max_position|rope/i.test(k));
  console.log(JSON.stringify({ repo, total, model_type: cfg.model_type, arch: cfg.architectures, maxPos: cfg.max_position_embeddings, picked: Object.fromEntries(keys.map((k) => [k, cfg[k]])) }, null, 1));
}