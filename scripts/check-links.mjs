#!/usr/bin/env node
/**
 * 死链检查：链接型站点最大的腐烂源就是外链失效。
 *
 *   node scripts/check-links.mjs            # 检查全部条目
 *   node scripts/check-links.mjs --only llm # 只查某个集合
 *
 * 约定：
 *   - 404 / 410 / 超时 / DNS 失败  → 失败（退出码 1）
 *   - 401 / 403 / 429              → 警告（很多站对爬虫就是这套反应，不代表链接坏了）
 *   - 只检查 frontmatter 里的 links 字段，正文里的链接不管（正文常有意引用已失效的页面）
 *
 * 代理：Node 的 fetch 不读系统代理设置，而很多环境下不走代理就连不上
 * huggingface.co 这类站点 —— 会得到一堆假的"连接超时"。所以这里在探测前
 * 先确认代理：环境变量里有就用，没有就试着读一次 Windows 系统代理。
 */
import { readdir, readFile } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();
const COLLECTIONS = ['llm', 'aigc', 'projects', 'deploy'];
const CONCURRENCY = 8;
const TIMEOUT_MS = 20000;

/** 子进程重跑时带上这个标记，避免无限递归 */
const REENTRY_FLAG = 'CHECK_LINKS_PROXY';

/**
 * 代理处理。关键坑：Node 只在**启动时**读取 NODE_USE_ENV_PROXY，
 * 在脚本里改 process.env 已经来不及了 —— fetch 依然直连、依然超时。
 * 所以这里分两步：先算出该用哪个代理，再带着环境变量把脚本自己重跑一遍。
 */
function resolveProxy() {
  const env = process.env;
  const fromEnv = env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy;
  if (fromEnv) return { url: fromEnv, source: '环境变量' };
  if (process.platform !== 'win32') return null;

  // 没有环境变量时，读一次 Windows 的系统代理（很多本机全局代理只写在这里）
  try {
    const key = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings';
    const out = execFileSync('reg', ['query', key], { encoding: 'utf8', windowsHide: true });
    const enabled = /ProxyEnable\s+REG_DWORD\s+0x1/i.test(out);
    const server = out.match(/ProxyServer\s+REG_SZ\s+(\S+)/i)?.[1];
    if (!enabled || !server) return null;
    return { url: /^https?:\/\//i.test(server) ? server : `http://${server}`, source: 'Windows 系统代理' };
  } catch {
    return null;
  }
}

const proxy = resolveProxy();

if (proxy && process.env[REENTRY_FLAG] !== '1') {
  console.log(`检测到${proxy.source}：${proxy.url} —— 带上代理重跑一次（Node 只在启动时读代理配置）。`);
  const result = spawnSync(process.execPath, [path.resolve(process.argv[1]), ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: {
      ...process.env,
      HTTP_PROXY: proxy.url,
      HTTPS_PROXY: proxy.url,
      NODE_USE_ENV_PROXY: '1',
      [REENTRY_FLAG]: '1',
    },
  });
  process.exit(result.status ?? 1);
}

const onlyIndex = process.argv.indexOf('--only');
const only = onlyIndex > -1 ? process.argv[onlyIndex + 1] : null;
const targets = only ? [only] : COLLECTIONS;

/** 只取 frontmatter 里 links: 段落下的 URL */
function extractLinks(markdown) {
  const fm = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return [];
  const lines = fm[1].split(/\r?\n/);
  const start = lines.findIndex((l) => /^links:\s*$/.test(l));
  if (start === -1) return [];
  const urls = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\S/.test(line)) break; // 回到顶层字段，links 段落结束
    const m = line.match(/https?:\/\/[^\s"']+/);
    if (m) urls.push(m[0]);
  }
  return urls;
}

async function collect() {
  const found = new Map(); // url -> [条目名]
  for (const collection of targets) {
    const dir = path.join(ROOT, 'src/content', collection);
    let files = [];
    try {
      files = (await readdir(dir)).filter((f) => f.endsWith('.md'));
    } catch {
      console.warn(`跳过不存在的目录：${dir}`);
      continue;
    }
    for (const file of files) {
      const markdown = await readFile(path.join(dir, file), 'utf8');
      for (const url of extractLinks(markdown)) {
        const key = url;
        if (!found.has(key)) found.set(key, []);
        found.get(key).push(`${collection}/${file.replace(/\.md$/, '')}`);
      }
    }
  }
  return found;
}

/**
 * 网络层的偶发错误（区别于 404 这类确定的结论）。
 * 遇到它们要换方法重试，否则会把好链接报成死链。
 */
const RETRIABLE = new Set([
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'EAI_AGAIN',
]);

async function probe(url) {
  const attempt = async (method) => {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'user-agent': 'link-check/1.0 (+static directory site)',
        accept: '*/*',
      },
    });
    // 只关心状态码，正文直接丢弃，避免下载大文件
    res.body?.cancel().catch(() => {});
    return res.status;
  };

  const codeOf = (err) => (err.name === 'TimeoutError' ? 'timeout' : (err.cause?.code ?? err.message));

  // HEAD 优先（省流量），但对 HEAD 不友好的站点不少：
  // 明确的 403/405/501，以及网络层的偶发失败，都改用 GET 复查。
  const plans = [
    ['HEAD'],
    ['GET'],
    ['GET'], // 再给一次机会：代理抖动、对端限流都不罕见
  ];

  let lastError = null;
  for (const [method] of plans) {
    try {
      const status = await attempt(method);
      if ((status === 403 || status === 405 || status === 501) && method === 'HEAD') {
        lastError = null;
        continue; // 换 GET
      }
      return status;
    } catch (err) {
      lastError = err;
      const code = codeOf(err);
      if (!RETRIABLE.has(code)) return `ERR:${code}`;
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return `ERR:${codeOf(lastError)}`;
}

async function pool(items, worker, size) {
  const results = [];
  let cursor = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const found = await collect();
  const urls = [...found.keys()];
  if (urls.length === 0) {
    console.log('没有找到可检查的链接。');
    return;
  }
  console.log(`检查 ${urls.length} 个链接（集合：${targets.join(', ')}）…`);
  if (process.env[REENTRY_FLAG] === '1') console.log(`已通过代理访问：${process.env.HTTPS_PROXY}`);
  console.log('');

  const statuses = await pool(urls, (url) => probe(url), CONCURRENCY);

  const failures = [];
  const warnings = [];
  const ok = [];

  urls.forEach((url, i) => {
    const status = statuses[i];
    const owners = found.get(url);
    if (typeof status === 'number' && status < 400) {
      ok.push({ url, status });
    } else if (typeof status === 'number' && (status === 401 || status === 403 || status === 429)) {
      warnings.push({ url, status, owners });
    } else {
      failures.push({ url, status, owners });
    }
  });

  for (const f of failures) {
    console.log(`✗ ${f.status}  ${f.url}`);
    console.log(`   来自：${f.owners.join(', ')}`);
  }
  for (const w of warnings) {
    console.log(`! ${w.status}  ${w.url}  （可能是反爬，人工确认）`);
  }

  console.log(`\n正常 ${ok.length} · 警告 ${warnings.length} · 失败 ${failures.length}`);
  if (failures.length) {
    console.log('\n失败的链接不要直接删条目：先把 status 改成 "dead"，保留历史记录。');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});