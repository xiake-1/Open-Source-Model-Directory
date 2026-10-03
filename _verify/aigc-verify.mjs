/**
 * 逐个仓库核对 AIGC 模型的 HF 元数据：仓库创建日、许可标识、safetensors 真实参数量。
 * 用法：node _verify/aigc-verify.mjs [repo1 repo2 ...]
 *   - 不带参数：核对 `_verify/aigc-repos.mjs` 里列出的全部仓库
 *   - 带参数：只核对指定的仓库 ID
 * 输出：_verify/aigc-enrich.json 与终端汇总（缺失的仓库会明确报出来）
 */
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { REPOS } = await import('./aigc-repos.mjs');

const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
const { setGlobalDispatcher, ProxyAgent } = await import('undici').catch(() => ({}));
if (PROXY && setGlobalDispatcher && ProxyAgent) setGlobalDispatcher(new ProxyAgent(PROXY));

const OUT = '_verify/aigc-enrich.json';
const cache = await fs.readFile(OUT, 'utf8').then(JSON.parse).catch(() => ({}));

const targets = process.argv.slice(2).length ? process.argv.slice(2) : REPOS;

function paramsOf(info) {
  const st = info?.safetensors;
  const total = st?.total;
  if (!total) return null;
  return total >= 1e12 ? `${(total / 1e12).toFixed(2)}T` : `${(total / 1e9).toFixed(1)}B`;
}

for (const repo of targets) {
  if (cache[repo]?.created && !process.argv.slice(2).length) continue;
  try {
    const res = await fetch(`https://huggingface.co/api/models/${repo}?blobs=false`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const info = await res.json();
    const licenses = (info.tags ?? []).filter((t) => /^license:/.test(t)).map((t) => t.replace('license:', ''));
    cache[repo] = {
      created: (info.createdAt ?? '').slice(0, 10),
      lastModified: (info.lastModified ?? '').slice(0, 10),
      license: licenses.join(' / '),
      params: paramsOf(info),
      pipeline: info.pipeline_tag ?? '',
      likes: info.likes ?? 0,
      downloads: info.downloads ?? 0,
      gated: info.gated ?? false,
      exists: true,
    };
    const c = cache[repo];
    console.log(`${repo}\t${c.created}\t${c.params ?? '-'}\t${c.license || '-'}\t${c.pipeline || '-'}\tlikes=${c.likes}`);
  } catch (err) {
    cache[repo] = { exists: false, error: String(err.message || err) };
    console.log(`${repo}\t!! ${err.message || err}`);
  }
}

await fs.writeFile(OUT, JSON.stringify(cache, null, 1), 'utf8');
const missing = Object.entries(cache).filter(([, v]) => !v.exists).map(([k]) => k);
console.log(`\nrepos=${targets.length} cached=${Object.keys(cache).length} missing=${missing.length}`);
if (missing.length) console.log('MISSING:', missing.join(', '));
console.log('DONE ->', OUT, PROXY ? `(proxy ${PROXY})` : '(no proxy)');