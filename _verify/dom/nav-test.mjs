/**
 * 功能测试：窄屏顶部导航（汉堡抽屉）。
 * 断点靠 matchMedia 模拟，脚本是内联的（is:inline），jsdom 直接就能跑。
 * 只测 DOM 行为与开合状态；"抽屉长什么样"由 CSS 负责，这里顺带确认那几条规则确实进了产物。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(HERE, '../../dist');
const PAGE = 'llm/models/index.html';
const html = readFileSync(`${DIST}/${PAGE}`, 'utf8');

// matchMedia 桩：matches 可切换，用来模拟转屏 / 拉宽窗口
let narrow = true;
const changeHandlers = [];

const boot = ({ scripts = true } = {}) => {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errors.push(String(e.message || e)));
  vc.on('error', (m) => errors.push(String(m)));
  const dom = new JSDOM(html, {
    runScripts: scripts ? 'dangerously' : undefined,
    url: 'https://example.com/llm/models/',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      window.matchMedia = () => ({
        get matches() {
          return narrow;
        },
        addEventListener(type, cb) {
          if (type === 'change') changeHandlers.push(cb);
        },
        removeEventListener() {},
        addListener(cb) {
          changeHandlers.push(cb);
        },
        removeListener() {},
      });
      window.fetch = async () => ({ json: async () => [] });
    },
  });
  return { dom, doc: dom.window.document, window: dom.window, errors };
};

const ready = (window, doc) =>
  new Promise((done) => {
    if (doc.readyState === 'complete') return done();
    const t = setTimeout(done, 2000);
    window.addEventListener('load', () => { clearTimeout(t); done(); }, { once: true });
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

console.log('\n=== 1. 窄屏：头部一行 + 抽屉 ===');
const { dom, doc, window, errors } = boot();
await ready(window, doc);
const navEl = doc.getElementById('site-nav');
const toggle = doc.getElementById('nav-toggle');
const search = doc.querySelector('.search');
const headerInner = doc.querySelector('.header-inner');

check('脚本没报错', errors, []);
check('<html> 挂上了 js（窄屏才启用抽屉形态）', doc.documentElement.classList.contains('js'), true);
check('有汉堡按钮', Boolean(toggle), true);
check('汉堡按钮默认收起', toggle.getAttribute('aria-expanded'), 'false');
check('汉堡按钮指向导航', toggle.getAttribute('aria-controls'), 'site-nav');
check('导航有 aria-label', navEl.getAttribute('aria-label'), '主导航');
check('四项导航都在（子项也都在 HTML 里）', navEl.querySelectorAll('a').length, 9);
check('分组标题只有 LLM / AIGC', [...navEl.querySelectorAll('.nav-group')].map((s) => s.textContent), ['LLM', 'AIGC']);
check('窄屏把搜索框搬进了抽屉', search.parentElement === navEl, true);
check('抽屉默认不展开（[data-open] 不写即收起）', navEl.hasAttribute('data-open'), false);
check('页面滚动没被锁住', doc.body.hasAttribute('data-nav-open'), false);

console.log('\n=== 2. 点汉堡：展开 ===');
toggle.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
check('抽屉已展开', navEl.getAttribute('data-open'), 'true');
check('aria-expanded 同步', toggle.getAttribute('aria-expanded'), 'true');
check('按钮文案变成"关闭"', toggle.getAttribute('aria-label'), '关闭导航菜单');
check('抽屉打开时锁住页面滚动', doc.body.getAttribute('data-nav-open'), 'true');

console.log('\n=== 3. Esc 关闭 ===');
doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('抽屉已收起', navEl.hasAttribute('data-open'), false);
check('aria-expanded 复位', toggle.getAttribute('aria-expanded'), 'false');
check('body 上的滚动锁也撤掉', doc.body.hasAttribute('data-nav-open'), false);

console.log('\n=== 4. 点导航项后自动收起 ===');
toggle.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const firstLink = navEl.querySelector('.nav-menu a');
firstLink.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
check('点了条目后抽屉收起', navEl.hasAttribute('data-open'), false);
check('点的是站内链接（不会真的跳转，只看 href 合法）', /^\/(llm|aigc|projects|deploy)\//.test(firstLink.getAttribute('href')), true);

console.log('\n=== 5. 转屏 / 拉宽：回到宽屏形态 ===');
toggle.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
check('先展开（准备跨断点）', navEl.getAttribute('data-open'), 'true');
narrow = false;
for (const cb of changeHandlers) cb({ matches: false });
check('跨断点后抽屉收起', navEl.hasAttribute('data-open'), false);
check('搜索框回到头部原位', search.parentElement === headerInner, true);
check('搜索框回到汉堡按钮前面', search.nextElementSibling === toggle, true);
narrow = true;
for (const cb of changeHandlers) cb({ matches: true });
check('再回到窄屏，搜索框又进抽屉', search.parentElement === navEl, true);
dom.window.close();

console.log('\n=== 6. 没有 JS 时：导航不会消失（平铺兜底） ===');
const noJs = boot({ scripts: false });
check('没有 js 类，CSS 走平铺兜底', noJs.doc.documentElement.classList.contains('js'), false);
check('导航与全部条目照旧在 HTML 里', noJs.doc.querySelectorAll('#site-nav a').length, 9);
check('没有 data-open 这种半开状态', noJs.doc.getElementById('site-nav').hasAttribute('data-open'), false);
check('汉堡按钮不在 header 里渲染出可点的东西（默认 display:none）', noJs.doc.querySelectorAll('.header-inner > .nav-toggle').length, 1);
noJs.dom.window.close();

console.log('\n=== 7. CSS 产物里有抽屉那几条关键规则 ===');
const cssFiles = readdirSync(`${DIST}/_astro`).filter((f) => f.endsWith('.css'));
const allCss = cssFiles.map((f) => readFileSync(`${DIST}/_astro/${f}`, 'utf8')).join('\n') + html;
const has = (snippet) => allCss.includes(snippet);
check('窄屏抽屉规则（html.js .site-nav）', has('html.js .site-nav'), true);
check('头部高度变量被用到', has('calc(var(--header-h) + 20px)'), true);
check('汉堡默认不显示（宽屏 / 无 JS）', /\.nav-toggle\{[^}]*display:none/.test(allCss), true);
check('抽屉里的行按触控目标做高（min-height:48px）', has('min-height:48px'), true);

console.log(`\n结果：通过 ${pass}、失败 ${fail}`);
process.exit(fail ? 1 : 0);