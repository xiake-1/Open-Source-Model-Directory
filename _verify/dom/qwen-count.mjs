/** 实测：勾上「所属 = Qwen」后到底剩几条，以及未勾选时页面上共有几条。 */
import { readFileSync, readdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(HERE, '../../dist');
const html = readFileSync(`${DIST}/llm/models/index.html`, 'utf8');
const chunkName = readdirSync(`${DIST}/_astro`).find((f) => f.startsWith('TagFilter') && f.endsWith('.js'));
const chunk = readFileSync(`${DIST}/_astro/${chunkName}`, 'utf8');

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
tag.textContent = chunk;
doc.body.appendChild(tag);

const visible = () => [...doc.querySelectorAll('.entry')].filter((c) => !c.hasAttribute('data-filtered'));
const titles = () => visible().map((c) => c.querySelector('.entry-title').textContent);

console.log('未勾选时可见条目:', visible().length);
const qwen = [...doc.querySelectorAll('[data-family]')].find((b) => b.value === 'Qwen');
qwen.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
await new Promise((r) => window.requestAnimationFrame(() => window.requestAnimationFrame(r)));
console.log('勾选 Qwen 后可见条目:', visible().length);
console.log('它们的分组:', [...doc.querySelectorAll('.section.month')].filter((s) => !s.hasAttribute('data-filtered')).map((s) => s.getAttribute('data-month') + '(' + s.querySelectorAll('.entry:not([data-filtered])').length + ')').join(' '));
console.log('标题:', titles().join(' | '));
console.log('hash:', window.location.hash);
console.log('下拉角标:', qwen.parentElement.querySelector('.dd-count')?.textContent);