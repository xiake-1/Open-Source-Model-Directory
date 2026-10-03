/**
 * 「热度」快照：按每个条目的 HuggingFace 仓库拉一次下载量（HF 口径：近 30 天）与 likes，
 * 落盘到 `src/data/hf-downloads.json`，列表页左侧「热度」分组按它分档
 * （分档口径写在 `src/lib/taxonomy.ts` 的 POPULARITY_BUCKETS，脚本这边不管阈值）。
 *
 * 为什么落盘、不在构建期现拉：构建必须能离线跑（Cloudflare 构建机上没有代理），
 * 所以下载量以「快照 + 生成时间」的形式进仓库；想刷新热度就重跑这个脚本。
 *
 * 用法：
 *   node _verify/hf-downloads.mjs          # 联网拉一遍并写盘
 *   node _verify/hf-downloads.mjs --dry    # 只列将要查询的仓库与已有快照的覆盖率，不联网
 *   CONCURRENCY=4 node _verify/hf-downloads.mjs
 *
 * 环境：Node 的 fetch 不读 Windows 系统代理（NODE_USE_ENV_PROXY 只在进程启动时读），
 * 所以这里先看 HTTPS_PROXY，没有再去注册表读一次系统代理，然后挂上 undici 的 ProxyAgent ——
 * 与 `hf-fetch.mjs` / `scripts/check-links.mjs` 同一套路。挂了代理的机器上通常这样跑：
 *   $env:HTTPS_PROXY='http://127.0.0.1:7897'; node _verify/hf-downloads.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(ROOT, 'src/data/hf-downloads.json');
const CONTENT_DIRS = ['src/content/llm', 'src/content/aigc'];
const CONCURRENCY = Number(process.env.CONCURRENCY || 6);
const DRY = process.argv.includes('--dry');

function systemProxy() {
  if (process.env.HTTPS_PROXY) return process.env.HTTPS_PROXY;
  if (process.env.https_proxy) return process.env.https_proxy;
  try {
    const out = execFileSync(
      'reg',
      ['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'],
      { encoding: 'utf8' }
    );
    const on = /ProxyEnable\s+REG_DWORD\s+0x1/.test(out);
    const server = out.match(/ProxyServer\s+REG_SZ\s+(\S+)/)?.[1];
    if (on && server) return server.includes('://') ? server : `http://${server}`;
  } catch {
    /* 沙箱里读注册表可能被拒（EPERM）：那就直连，失败时再提示挂 HTTPS_PROXY */
  }
  return '';
}

/** 只认模型仓库页：huggingface.co/<owner>/<repo>（spaces / datasets 这些不是权重仓库） */
export function hfRepoOf(url) {
  const m = String(url || '').match(/^https?:\/\/huggingface\.co\/([^/?#]+)\/([^/?#]+)/);
  if (!m) return '';
  if (['spaces', 'datasets', 'collections', 'papers', 'blog', 'models', 'organizations'].includes(m[1])) return '';
  return `${m[1]}/${m[2]}`;
}

/** 从内容文件里抠出 links.hf 指向的仓库 ID */
async function repoIds() {
  const found = new Map(); // repo -> slug[]
  for (const dir of CONTENT_DIRS) {
    const abs = path.join(ROOT, dir);
    for (const file of (await fs.readdir(abs)).filter((f) => f.endsWith('.md'))) {
      const text = await fs.readFile(path.join(abs, file), 'utf8');
      const hf = text.match(/^\s*hf:\s*["']?([^"'\s]+)["']?\s*$/m)?.[1] ?? '';
      const repo = hfRepoOf(hf);
      const slug = file.replace(/\.md$/, '');
      if (!repo) {
        console.warn(`  ! ${dir}/${file} 没有可用的 HuggingFace 仓库链接（跳过）`);
        continue;
      }
      if (!found.has(repo)) found.set(repo, []);
      found.get(repo).push(slug);
    }
  }
  return found;
}

async function main() {
  const repos = await repoIds();
  const ids = [...repos.keys()].sort();
  console.log(`内容里共 ${ids.length} 个 HuggingFace 仓库（来自 ${CONTENT_DIRS.join(' + ')}）`);

  if (DRY) {
    let cached = {};
    try {
      cached = JSON.parse(await fs.readFile(OUT, 'utf8')).repos ?? {};
    } catch {
      /* 还没有快照 */
    }
    const missing = ids.filter((id) => cached[id] === undefined);
    console.log(`已有快照：${Object.keys(cached).length} 个仓库；缺 ${missing.length} 个`);
    if (missing.length) console.log('  待补：', missing.slice(0, 20).join(', '), missing.length > 20 ? '…' : '');
    return;
  }

  const proxy = systemProxy();
  const { setGlobalDispatcher, ProxyAgent } = await import('undici').catch(() => ({}));
  if (proxy && setGlobalDispatcher && ProxyAgent) setGlobalDispatcher(new ProxyAgent(proxy));
  console.log(`代理：${proxy || '（直连）'}；并发：${CONCURRENCY}`);

  const reposOut = {};
  const failed = [];

  async function one(id) {
    const url = `https://huggingface.co/api/models/${id}?full=false`;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { accept: 'application/json' },
          signal: AbortSignal.timeout(25000),
        });
        if (res.status === 404) return { id, gone: true };
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();
        return {
          id,
          value: { downloads: Number(json.downloads ?? 0), likes: Number(json.likes ?? 0) },
        };
      } catch (err) {
        if (attempt === 3) return { id, error: String(err.message || err) };
        await new Promise((r) => setTimeout(r, 700 * attempt));
      }
    }
  }

  let cursor = 0;
  let done = 0;
  async function worker() {
    while (cursor < ids.length) {
      const id = ids[cursor++];
      const result = await one(id);
      done += 1;
      if (result.value) reposOut[id] = result.value;
      else failed.push(`${id}${result.gone ? '（仓库不存在 / 已改名）' : `（${result.error}）`}`);
      if (done % 25 === 0 || done === ids.length) console.log(`  已查 ${done}/${ids.length}，失败 ${failed.length}`);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, ids.length) }, worker));

  if (Object.keys(reposOut).length === 0) {
    console.error('\n一个仓库都没拉到：先确认这台机器能连 huggingface.co（挂了代理就先挂上 HTTPS_PROXY）。');
    process.exit(1);
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    metric: 'downloads 为 HuggingFace 的近 30 天下载量；无数据的条目（仓库不存在 / 未取到）不进「热度」分档',
    source: 'https://huggingface.co/api/models/<repo>?full=false',
    repos: Object.fromEntries(Object.entries(reposOut).sort(([a], [b]) => a.localeCompare(b))),
  };
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, `${JSON.stringify(snapshot, null, 1)}\n`, 'utf8');

  // 顺手打印一下分布，方便核对分档阈值（阈值只写在 taxonomy.ts 里）
  const values = Object.values(reposOut)
    .map((v) => v.downloads)
    .sort((a, b) => b - a);
  const at = (q) => values[Math.min(values.length - 1, Math.floor(values.length * q))];
  console.log(
    `\n下载量分布：最高 ${values[0]}、上四分位 ${at(0.25)}、中位 ${at(0.5)}、下四分位 ${at(0.75)}、最低 ${values[values.length - 1]}`
  );
  for (const line of [1_000_000, 500_000, 100_000, 50_000, 10_000, 1_000]) {
    console.log(`  ≥ ${line.toLocaleString('en-US').padStart(11)}：${values.filter((v) => v >= line).length} 个`);
  }

  if (failed.length) {
    console.warn(`\n未取到 ${failed.length} 个（这些条目不会出现在「热度」筛选里）：`);
    for (const line of failed) console.warn(`  - ${line}`);
  }
  console.log(`\nDONE -> ${OUT}（${Object.keys(reposOut).length} 个仓库）`);
}

await main();