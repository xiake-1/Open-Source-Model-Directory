/**
 * 从 GitHub 公共 API 搜索「2025-01 之后创建的本地 LLM 部署相关仓库」，
 * 作为补录 `src/content/projects/` 的候选清单（找线索用，不直接出条目）。
 * 用法：node _verify/gh-fetch.mjs
 * 输出：_verify/gh-search.json（全量）+ 控制台紧凑清单
 *
 * 未认证限速：search 10 次/分钟、core 60 次/小时，所以查询之间留 7 秒。
 */
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

/** Node 的 fetch 不读 Windows 系统代理，这里自己读出来带上 —— 与 hf-fetch.mjs 同一套路 */
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

const HEADERS = {
  accept: 'application/vnd.github+json',
  'user-agent': 'open-source-model-directory',
};

async function getJSON(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 搜索类查询：2025-01-01 之后创建、按 star 排序 */
const SEARCHES = [
  { q: 'llm inference stars:>300', note: '推理引擎' },
  { q: 'local llm stars:>300', note: '本地部署' },
  { q: 'llm server stars:>300', note: '服务化' },
  { q: 'llm quantization stars:>200', note: '量化' },
  { q: 'gguf stars:>200', note: '量化格式' },
  { q: 'llama cpu stars:>200', note: 'CPU 推理' },
  { q: 'llm webui stars:>200', note: 'WebUI' },
  { q: 'llm rust stars:>300', note: 'Rust 实现' },
  { q: 'mlx llm stars:>200', note: 'Apple Silicon' },
  { q: 'speculative decoding stars:>200', note: '投机解码' },
  { q: 'llm embedded stars:>200', note: '嵌入式' },
];

/** 2025 年前创建、但要核对「首个可用版本是否落在窗口内」的已知仓库 */
const KNOWN = [
  'turboderp/exllamaV3',
  'kvcache-ai/KTransformers',
  'ooblets/llama-farm',
  'ooblets/text-generation-webui',
  'mudler/LocalAI',
  'tabbyml/tabbyAPI',
  'koboldcpp',
  'mlc-ai/mlc-llm',
  'ggml-org/llama.cpp',
  'open-webui/open-webui',
  'janhq/jan',
  'ggerganov/llama.cpp',
];

const rowOf = (r) => ({
  full_name: r.full_name,
  description: (r.description ?? '').slice(0, 200),
  created_at: (r.created_at ?? '').slice(0, 10),
  pushed_at: (r.pushed_at ?? '').slice(0, 10),
  stars: r.stargazers_count ?? 0,
  language: r.language ?? '',
  license: r.license?.spdx_id ?? r.license?.key ?? '',
  topics: (r.topics ?? []).slice(0, 12),
  homepage: r.homepage ?? '',
  archived: r.archived ?? false,
  fork: r.fork ?? false,
});

const all = new Map();

for (const s of SEARCHES) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(`${s.q} created:>2025-01-01`)}&sort=stars&order=desc&per_page=30`;
  try {
    const data = await getJSON(url);
    for (const r of data.items ?? []) {
      if (!all.has(r.full_name)) all.set(r.full_name, rowOf(r));
    }
    console.log(`search "${s.q}": ${data.items?.length ?? 0}（累计 ${all.size}）`);
  } catch (err) {
    console.log(`search "${s.q}": 失败 ${err.message}`);
  }
  await sleep(7000);
}

for (const name of KNOWN) {
  try {
    const r = await getJSON(`https://api.github.com/repos/${name}`);
    if (!all.has(r.full_name)) all.set(r.full_name, rowOf(r));
    console.log(`known ${name}: created ${r.created_at?.slice(0, 10)} stars ${r.stargazers_count}`);
  } catch (err) {
    console.log(`known ${name}: 失败 ${err.message}`);
  }
  await sleep(800);
}

const rows = [...all.values()].sort((a, b) => b.stars - a.stars);
await fs.writeFile('_verify/gh-search.json', JSON.stringify(rows, null, 1), 'utf8');

const cols = { full_name: 44, created_at: 12, stars: 8, language: 10, license: 12 };
console.log('\n== 候选清单（按 star 降序）==');
for (const r of rows) {
  const inWindow = r.created_at >= '2025-01-01';
  console.log(
    `${inWindow ? '' : '·'}${r.full_name.padEnd(cols.full_name)} ${r.created_at} ${String(r.stars).padStart(cols.stars)} ${r.language.slice(0, 10).padEnd(cols.language)} ${(r.license || '-').slice(0, 12).padEnd(cols.license)}`
  );
}
console.log(`\n共 ${rows.size ?? rows.length} 个仓库 -> _verify/gh-search.json${PROXY ? `（proxy ${PROXY}）` : ''}`);
