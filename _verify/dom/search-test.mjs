/**
 * 功能测试：站内搜索的结果链接是否真的在新窗口打开。
 * 搜索脚本是内联的（is:inline），jsdom 直接就能跑；只有 fetch('/search.json') 需要喂数据。
 */
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(HERE, '../../dist');
const html = readFileSync(`${DIST}/llm/models/index.html`, 'utf8');

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://example.com/llm/models/',
  beforeParse(window) {
    window.matchMedia = () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    });
    // 把 /search.json 指到本地构建产物
    window.fetch = async (url) => {
      const rel = String(url).replace(/^\//, '');
      return { json: async () => JSON.parse(readFileSync(`${DIST}/${rel}`, 'utf8')) };
    };
  },
});

const { window } = dom;
const doc = window.document;

await new Promise((resolve) => {
  if (doc.readyState === 'complete') return resolve();
  const t = setTimeout(resolve, 2000);
  window.addEventListener('load', () => {
    clearTimeout(t);
    resolve();
  }, { once: true });
});

let pass = 0;
let fail = 0;
const check = (name, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    pass++;
    console.log(`  ok   ${name}  → ${a}`);
  } else {
    fail++;
    console.log(`  FAIL ${name}\n         实际 ${a}\n         期望 ${e}`);
  }
};

const input = doc.getElementById('site-search');
const box = doc.getElementById('search-results');

const search = async (q) => {
  input.value = q;
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 60));
};

console.log('\n=== 1. 搜关键词，结果链接的 target ===');
await search('kimi');
const anchors = [...box.querySelectorAll('a')];
check('结果条数 > 0', anchors.length > 0, true);
check('每条都有 target=_blank', anchors.every((a) => a.getAttribute('target') === '_blank'), true);
check('每条都有 rel=noopener', anchors.every((a) => a.getAttribute('rel') === 'noopener'), true);
// 首条只要落在站内四个集合的详情页上即可（具体哪条随收录变化，不写死）
check('首条 href 是站内详情页', /^\/(llm|aigc|projects|deploy)\//.test(anchors[0]?.getAttribute('href') ?? ''), true);
check('结果面板已打开', box.dataset.open, 'true');
console.log(`  （命中 ${anchors.length} 条，前 3 条：${anchors.slice(0, 3).map((a) => a.querySelector('.sr-title').textContent).join(' / ')}）`);

console.log('\n=== 2. 换关键词（含项目 / 部署两类）===');
await search('vllm');
const a2 = [...box.querySelectorAll('a')];
check('结果条数 > 0', a2.length > 0, true);
check('项目/部署结果同样是新窗口', a2.every((x) => x.getAttribute('target') === '_blank'), true);
console.log(`  （命中 ${a2.length} 条：${a2.slice(0, 3).map((a) => a.querySelector('.sr-title').textContent).join(' / ')}）`);

console.log('\n=== 3. 无结果 ===');
await search('zzzz-不存在-zzzz');
check('显示空提示', box.innerHTML.includes('没有匹配的条目'), true);

console.log('\n=== 4. 清空输入 ===');
input.value = '';
input.dispatchEvent(new window.Event('input', { bubbles: true }));
await new Promise((r) => setTimeout(r, 30));
check('面板收起', box.dataset.open, 'false');

console.log(`\n结果：通过 ${pass}、失败 ${fail}`);
process.exit(fail ? 1 : 0);