/** 演示：卡片右侧的相对时间不是写死在 HTML 里的，而是构建时输出日期、浏览器里再算成"x 天前"。 */
import { readFileSync, readdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(HERE, '../../dist');
const html = readFileSync(`${DIST}/llm/models/index.html`, 'utf8');
const chunkName = readdirSync(`${DIST}/_astro`).find((f) => f.startsWith('TagFilter') && f.endsWith('.js'));
const chunk = readFileSync(`${DIST}/_astro/${chunkName}`, 'utf8');

const head = html.slice(html.indexOf('data-released'), html.indexOf('data-released') + 420);
console.log('--- 构建产物里的原始 HTML（没有"天前"字样）---');
console.log(head.replace(/\s+/g, ' '));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://example.com/llm/models/',
  pretendToBeVisual: true,
  beforeParse(window) {
    window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  },
});
const { window } = dom;
const doc = window.document;
await new Promise((r) => { if (doc.readyState === 'complete') return r(); window.addEventListener('load', r, { once: true }); });
const tag = doc.createElement('script');
tag.textContent = chunk; // TagFilter 脚本
doc.body.appendChild(tag);

// BaseLayout 里的内联脚本（相对时间 + NEW 角标）在文档里，jsdom 会执行；这里再手动跑一遍确认
const inline = [...doc.querySelectorAll('script:not([type="module"])')].map((s) => s.textContent).join('\n');
if (!doc.querySelector('time[data-relative]').textContent.match(/前|今天|昨天/)) {
  const s = doc.createElement('script');
  s.textContent = inline;
  doc.body.appendChild(s);
}

const first = doc.querySelector('.entry');
console.log('\n--- 浏览器里跑完脚本后 ---');
console.log('卡片标题:', first.querySelector('.entry-title').textContent);
console.log('右侧时间:', first.querySelector('time.entry-time').textContent, '（datetime=' + first.querySelector('time.entry-time').getAttribute('datetime') + '）');
console.log('NEW 角标:', first.querySelector('.badge-new')?.textContent ?? '(无)');