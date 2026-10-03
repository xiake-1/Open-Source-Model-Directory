/**
 * 冒烟测试：没有筛选条件的页面（社区项目）与卡片很多的 AIGC 页面也不应该报错。
 * 顺便确认左侧卡片数量符合预期（项目页只有「时间」；生图 / 生视频是「时间 + 所属 + 筛选」三张）。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(HERE, '../../dist');
// 与 src/pages/index.astro 的 HOME_WINDOW_DAYS 保持一致（改首页窗口时两边一起改）
const HOME_WINDOW_DAYS = 30;
const chunkName = readdirSync(`${DIST}/_astro`).find((f) => f.startsWith('TagFilter') && f.endsWith('.js'));
const chunk = readFileSync(`${DIST}/_astro/${chunkName}`, 'utf8');

/** 卡片数从 src/content/ 现算，收录量变化不用改这里；filter 用来只数生图或只数生视频 */
const countMd = (dir, filter) =>
  readdirSync(resolve(HERE, `../../src/content/${dir}`))
    .filter((f) => f.endsWith('.md'))
    .map((f) => readFileSync(resolve(HERE, `../../src/content/${dir}/${f}`), 'utf8'))
    .filter((t) => !filter || filter.test(t)).length;

const pages = [
  { file: 'llm/github/index.html', url: 'https://example.com/llm/github/', label: '/llm/github/（社区项目：只有时间卡片）', cards: countMd('projects'), side: 1 },
  { file: 'llm/deploy/index.html', url: 'https://example.com/llm/deploy/', label: '/llm/deploy/（部署方式：按方案大类分组，左侧确实没有卡片）', cards: countMd('deploy'), side: 0 },
  { file: 'aigc/image/index.html', url: 'https://example.com/aigc/image/', label: '/aigc/image/（生图：时间 + 所属 + 筛选）', cards: countMd('aigc', /^output: image$/m), side: 3 },
  { file: 'aigc/video/index.html', url: 'https://example.com/aigc/video/', label: '/aigc/video/（生视频：时间 + 所属 + 筛选）', cards: countMd('aigc', /^output: video$/m), side: 3 },
  { file: 'llm/models/index.html', url: 'https://example.com/llm/models/', label: '/llm/models/（模型：三张卡片）', cards: countMd('llm'), side: 3 },
];

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

for (const page of pages) {
  console.log(`\n=== ${page.label} ===`);
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errors.push(String(e.message || e)));
  vc.on('error', (m) => errors.push(String(m)));

  const html = readFileSync(`${DIST}/${page.file}`, 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: page.url,
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      window.matchMedia = () => ({
        matches: false,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
      });
      window.fetch = async () => ({ json: async () => [] });
    },
  });
  const { window } = dom;
  const doc = window.document;
  await new Promise((resolve) => {
    if (doc.readyState === 'complete') return resolve();
    const t = setTimeout(resolve, 2000);
    window.addEventListener('load', () => { clearTimeout(t); resolve(); }, { once: true });
  });

  // 注入组件脚本（jsdom 不跑 module script），有就注入
  const hasFilter = Boolean(doc.querySelector('[data-timeline]'));
  if (hasFilter) {
    const tag = doc.createElement('script');
    tag.textContent = chunk;
    doc.body.appendChild(tag);
  }

  check('条目卡片数', doc.querySelectorAll('.entry').length, page.cards);
  check('左侧卡片数', doc.querySelectorAll('.listing-side > *').length, page.side);
  check(
    '所有卡片标题都在新窗口打开',
    [...doc.querySelectorAll('.entry-title')].every(
      (a) => a.getAttribute('target') === '_blank' && a.getAttribute('rel') === 'noopener'
    ),
    true
  );
  check('新窗口链接数 = 卡片数', doc.querySelectorAll('.entry-title[target="_blank"]').length, page.cards);
  check('左侧下拉默认全部收起', [...doc.querySelectorAll('.listing-side details')].every((d) => !d.open), true);
  check('脚本错误', errors, []);
  dom.window.close();
}

console.log(`\n结果：通过 ${pass}、失败 ${fail}`);

// 首页：近 30 天（日历天）窗口，条目直接平铺、没有月份小节，且不再写"新的在前"
{
  console.log(`\n=== /（首页：近 ${HOME_WINDOW_DAYS} 天窗口） ===`);
  const doc = new JSDOM(readFileSync(`${DIST}/index.html`, 'utf8')).window.document;
  check('没有月份小节（不再按月拆）', doc.querySelectorAll('.section.month').length, 0);
  check('没有月份日期小标题', doc.querySelectorAll('.month-sub').length, 0);
  check('没有"新的在前"字样', doc.body.textContent.includes('新的在前'), false);
  // 分区标题上的计数从内容现算：窗口内（最近 30 个日历天）发布的条目数
  const countWindow = (dir) => {
    const cutoff = Date.now() - HOME_WINDOW_DAYS * 86_400_000;
    return readdirSync(resolve(HERE, `../../src/content/${dir}`))
      .filter((f) => f.endsWith('.md'))
      .map((f) => readFileSync(resolve(HERE, `../../src/content/${dir}/${f}`), 'utf8'))
      .filter((t) => {
        const m = t.match(/^released: ["']?(\d{4}-\d{2}-\d{2})/m);
        return m && new Date(`${m[1]}T00:00:00Z`).getTime() >= cutoff;
      }).length;
  };
  // 分区标题（LLM 近期模型 / AIGC 近期模型）就是"看全部"的入口，标题下面那行说明文字已经删掉
  check(
    '分区标题是链接',
    [...doc.querySelectorAll('.home-title a')].map((a) => a.getAttribute('href')),
    ['/llm/models/', '/aigc/image/']
  );
  check('分区标题文本（型号 + 计数 + 箭头）', [...doc.querySelectorAll('.home-title')].map((h) => h.textContent.replace(/\s+/g, '')), [
    `LLM近期模型${countWindow('llm')}→`,
    `AIGC近期模型${countWindow('aigc')}→`,
  ]);
  check('标题下面不再有说明段落', doc.querySelectorAll('.section-note').length, 0);
  check(
    '首页不再出现"看全部模型"这类正文链接',
    [...doc.querySelectorAll('.section p a')].length,
    0
  );
}

console.log(`\n总计：通过 ${pass}、失败 ${fail}`);
process.exit(fail ? 1 : 0);