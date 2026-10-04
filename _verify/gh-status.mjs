/**
 * 巡检**已收录**的社区方案（`src/content/projects/`）与部署方式（`src/content/deploy/`）
 * 在 GitHub 上的现状：按每个条目的 `links.github` 拉一次 `/repos/{owner}/{repo}`，
 * 把「归档 / 停更 / 改名 / star 变了 / 许可不一致 / 仓库没了」挑出来，只打印要人工看的那些。
 *
 * 只读：不碰任何内容文件，结果落盘到 `_verify/gh-status.json` 供人工复核
 * （该改哪条、怎么改，见 `docs/项目技能/更新收录.md` 第六节）。
 *
 * 用法：
 *   node _verify/gh-status.mjs                 # projects + deploy 全查
 *   node _verify/gh-status.mjs --only deploy   # 只查一个集合
 *   node _verify/gh-status.mjs --stale 120     # 「多久没提交」算停更（天，默认 180）
 *   node _verify/gh-status.mjs --releases      # 追加查每个仓库的 latest release（请求数翻倍）
 *   node _verify/gh-status.mjs --json          # 只打印 JSON
 *   node _verify/gh-status.mjs --proxy         # 走系统代理（默认直连，见下）
 *
 * 限速：未认证的 GitHub API 是 **60 次/小时**（按出口 IP 算），38 个仓库跑一遍就吃掉大半 ——
 * 一小时内跑第二遍会拿到 403。要连跑就给 `GITHUB_TOKEN`（脚本自动带上）。
 * **默认直连**：`api.github.com` 一般直连就能通，而走本机代理时出口 IP 常常是共享的，
 * 60 次/小时的配额可能早被别人用光（2026-10-04 实测：直连有配额、走 127.0.0.1:7897 剩余 0）。
 * 直连不通时再加 `--proxy`（读 `HTTPS_PROXY`，没有就读一次 Windows 系统代理），与 `gh-fetch.mjs` 同一套路。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'gh-status.json');

const DIRS = { projects: 'src/content/projects', deploy: 'src/content/deploy' };
const argv = process.argv.slice(2);
const ONLY = (argv.find((a) => a.startsWith('--only'))?.split('=')[1] ?? argv[argv.indexOf('--only') + 1] ?? '').trim();
const STALE_DAYS = Number(argv.find((a) => a.startsWith('--stale'))?.split('=')[1] ?? argv[argv.indexOf('--stale') + 1] ?? 180);
const WANT_RELEASES = argv.includes('--releases');
const JSON_ONLY = argv.includes('--json');
const USE_PROXY = argv.includes('--proxy');
const CONCURRENCY = 4;

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
    /* 受限沙箱里读注册表会被拒：那就直连 */
  }
  return '';
}

const PROXY = USE_PROXY ? systemProxy() : '';
const { setGlobalDispatcher, ProxyAgent } = await import('undici').catch(() => ({}));
if (PROXY && setGlobalDispatcher && ProxyAgent) setGlobalDispatcher(new ProxyAgent(PROXY));

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const HEADERS = {
  accept: 'application/vnd.github+json',
  'user-agent': 'open-source-model-directory',
  ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
};

let rateLeft = null;
let stopReason = '';

async function getJSON(url) {
  if (rateLeft === 0) {
    stopReason = 'GitHub 限流（未认证 60 次/小时）';
    return null;
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
      const left = res.headers.get('x-ratelimit-remaining');
      if (left !== null) rateLeft = Number(left);
      if (res.status === 404) return { notFound: true };
      if (res.status === 403 || res.status === 429) {
        stopReason = `GitHub 限流（HTTP ${res.status}${rateLeft === 0 ? '，剩余 0' : ''}）`;
        return null;
      }
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt === 3) return { error: String(err.message || err) };
      await new Promise((r) => setTimeout(r, 900 * attempt));
    }
  }
}

/** `https://github.com/owner/repo(/…)` → `owner/repo` */
function ghRepoOf(url) {
  const m = String(url || '').match(/^https?:\/\/github\.com\/([^/?#]+)\/([^/?#]+)/i);
  if (!m) return '';
  return `${m[1]}/${m[2].replace(/\.git$/i, '')}`;
}

function field(text, key) {
  return (text.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))?.[1] ?? '').trim().replace(/^["']|["']$/g, '');
}

async function collect() {
  const rows = [];
  const names = ONLY ? [ONLY] : Object.keys(DIRS);
  for (const name of names) {
    if (!DIRS[name]) {
      console.error(`--only 只认 ${Object.keys(DIRS).join(' / ')}`);
      process.exit(1);
    }
    const dir = path.join(ROOT, DIRS[name]);
    for (const file of (await fs.readdir(dir)).filter((f) => f.endsWith('.md'))) {
      const text = await fs.readFile(path.join(dir, file), 'utf8');
      const url = text.match(/^\s*github:\s*["']?([^"'\s]+)["']?\s*$/m)?.[1] ?? '';
      const repo = ghRepoOf(url);
      const slug = file.replace(/\.md$/, '');
      if (!repo) {
        rows.push({ collection: name, slug, repo: '', note: '条目里没有 github 链接（不巡检）' });
        continue;
      }
      rows.push({
        collection: name,
        slug,
        title: field(text, 'title'),
        repo,
        entryStatus: field(text, 'status') || 'active',
        entryStars: name === 'deploy' ? Number(field(text, 'stars')) || null : null,
        entryLicense: field(text, 'license'),
      });
    }
  }
  return rows.filter((r) => r.repo);
}

const SPDX_COMMON = ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'BSD-2-Clause', 'GPL-3.0', 'AGPL-3.0', 'MPL-2.0', 'ISC'];
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function daysSince(iso) {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Math.floor((Date.now() - t) / 86_400_000) : null;
}

async function inspect(row) {
  const data = await getJSON(`https://api.github.com/repos/${row.repo}`);
  if (data === null) return { ...row, skipped: stopReason || '未取到' };
  if (data.notFound) return { ...row, flags: ['仓库不存在 / 已改名（404）'], gone: true };
  if (data.error) return { ...row, flags: [`取数失败：${data.error}`] };

  const flags = [];
  const pushedDays = daysSince(data.pushed_at);
  const renamed = data.full_name && data.full_name.toLowerCase() !== row.repo.toLowerCase();
  if (renamed) flags.push(`仓库已改名 / 迁移：${row.repo} → ${data.full_name}`);
  if (data.archived) flags.push(`已归档（${row.entryStatus === 'active' ? '条目还是 active' : `条目已标 ${row.entryStatus}`}）`);
  if (row.entryStatus !== 'active' && !data.archived) flags.push(`条目标了 ${row.entryStatus}，仓库还活着（复核一下）`);
  if (pushedDays !== null && pushedDays > STALE_DAYS) flags.push(`${pushedDays} 天没提交（最后 push ${String(data.pushed_at).slice(0, 10)}）`);
  if (row.entryStars && data.stargazers_count && row.entryStars !== data.stargazers_count) {
    const diff = Math.abs(data.stargazers_count - row.entryStars) / Math.max(row.entryStars, 1);
    if (diff >= 0.05) {
      flags.push(`stars ${row.entryStars.toLocaleString('en-US')} → ${data.stargazers_count.toLocaleString('en-US')}（部署页大类内排序按它）`);
    }
  }
  const spdx = data.license?.spdx_id ?? '';
  if (spdx && SPDX_COMMON.includes(spdx) && row.entryLicense && !norm(row.entryLicense).includes(norm(spdx))) {
    flags.push(`许可不一致：条目写「${row.entryLicense}」/ GitHub 说 ${spdx}`);
  }

  const out = {
    ...row,
    fullName: data.full_name,
    stars: data.stargazers_count,
    pushedAt: String(data.pushed_at).slice(0, 10),
    pushedDays,
    archived: !!data.archived,
    licenseSpdx: spdx || null,
    defaultBranch: data.default_branch,
    flags,
  };

  if (WANT_RELEASES) {
    const rel = await getJSON(`https://api.github.com/repos/${row.repo}/releases/latest`);
    if (rel && !rel.notFound && !rel.error && rel.tag_name) {
      out.latestRelease = { tag: rel.tag_name, publishedAt: String(rel.published_at).slice(0, 10) };
    } else {
      out.latestRelease = null;
    }
  }
  return out;
}

const rows = await collect();
console.log(
  `巡检 ${rows.length} 个 GitHub 仓库（${ONLY || Object.keys(DIRS).join(' + ')}）；网络：${PROXY ? `代理 ${PROXY}` : '直连（--proxy 可改走系统代理）'}；token：${TOKEN ? '有' : '无'}`
);

const results = [];
let cursor = 0;
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, rows.length) }, async () => {
    while (cursor < rows.length) {
      const row = rows[cursor++];
      results.push(await inspect(row));
    }
  })
);

const needLook = results.filter((r) => r.flags?.length);
const skipped = results.filter((r) => r.skipped);

if (!JSON_ONLY && skipped.length === results.length && results.length > 0) {
  console.log(
    '\n全部没查成：如果是「取数失败：fetch failed」这类网络层错误，加 --proxy 走系统代理；\n' +
      '如果是 403 / 剩余 0，就是配额用完（未认证 60 次/小时，按出口 IP 算），设 GITHUB_TOKEN 或过一小时再跑。'
  );
}

if (!JSON_ONLY) {
  console.log(`\n== 需要人工看：${needLook.length} 条 ==`);
  for (const r of needLook.sort((a, b) => a.repo.localeCompare(b.repo))) {
    console.log(`  ! ${r.repo}（${r.collection}/${r.slug}）`);
    for (const f of r.flags) console.log(`      - ${f}`);
  }
  if (skipped.length) {
    console.log(`\n== 没查成：${skipped.length} 条 ==`);
    for (const r of skipped) console.log(`  - ${r.repo}：${r.skipped}`);
  }
  console.log(`\n== 全部 ${results.length} 条 ==`);
  for (const r of results.sort((a, b) => `${a.collection}/${a.repo}`.localeCompare(`${b.collection}/${b.repo}`))) {
    if (r.skipped) {
      console.log(`  ? ${r.collection.padEnd(8)} ${r.repo.padEnd(38)} ${r.skipped}`);
      continue;
    }
    if (r.gone) {
      console.log(`  ✗ ${r.collection.padEnd(8)} ${r.repo.padEnd(38)} 404`);
      continue;
    }
    const star = r.stars === undefined ? '' : `stars=${String(r.stars).padStart(7)}`;
    const rel = r.latestRelease ? ` release=${r.latestRelease.tag}@${r.latestRelease.publishedAt}` : '';
    console.log(
      `  ${r.flags.length ? '!' : '·'} ${r.collection.padEnd(8)} ${r.repo.padEnd(38)} ${star} push=${r.pushedAt}${r.archived ? ' archived' : ''}${rel}`
    );
  }
  if (WANT_RELEASES) console.log('\n（--releases：release 只是「上一次发布」，不等于「有新东西要写进条目」）');
}

await fs.writeFile(
  OUT,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      metric: 'stars / pushed_at / archived 取自 GitHub REST /repos/{owner}/{repo}；flags 是相对条目现有字段的差异',
      source: 'https://api.github.com/repos/<owner>/<repo>',
      staleDays: STALE_DAYS,
      rateLimitRemaining: rateLeft,
      rows: results.sort((a, b) => `${a.collection}/${a.repo}`.localeCompare(`${b.collection}/${b.repo}`)),
    },
    null,
    1
  )}\n`,
  'utf8'
);

if (JSON_ONLY) console.log(JSON.stringify({ needLook: needLook.length, skipped: skipped.length, total: results.length }));
console.log(`\nDONE -> ${OUT}（需要人工看 ${needLook.length} 条${skipped.length ? `，没查成 ${skipped.length} 条` : ''}；剩余配额 ${rateLeft ?? '未知'}）`);