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
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const COLLECTIONS = ['llm', 'aigc', 'deploy'];
const CONCURRENCY = 8;
const TIMEOUT_MS = 20000;

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
    return res.status;
  };
  try {
    let status = await attempt('HEAD');
    // 不少站点不支持 HEAD，或者对 HEAD 返回 403/405，改用 GET 复查一次
    if (status === 403 || status === 405 || status === 501) {
      status = await attempt('GET');
    }
    return status;
  } catch (err) {
    return `ERR:${err.name === 'TimeoutError' ? 'timeout' : (err.cause?.code ?? err.message)}`;
  }
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
  console.log(`检查 ${urls.length} 个链接（集合：${targets.join(', ')}）…\n`);

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