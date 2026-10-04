/**
 * 冒烟测试：没有筛选条件的页面（社区项目）与卡片很多的 AIGC 页面也不应该报错。
 * 顺便确认左侧卡片数量符合预期（项目页只有「时间」；生图 / 生视频是「时间 + 所属 + 筛选」三张）。
 * 首页部分除了近 30 天窗口，还管最上面那块「近期热门」（热度「高」的模型 + 近 30 天的社区项目），
 * 以及「热度分档 LLM 与 AIGC 各一套阈值」这件事。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(HERE, '../../dist');
// 与 src/pages/index.astro 的 HOME_WINDOW_DAYS 保持一致（改首页窗口时两边一起改）
const HOME_WINDOW_DAYS = 30;
// 同上，对应 index.astro 的 HOT_WINDOW_DAYS：热门模型榜的发布窗口（近两个月）
const HOT_WINDOW_DAYS = 60;
const chunkName = readdirSync(`${DIST}/_astro`).find((f) => f.startsWith('TagFilter') && f.endsWith('.js'));
const chunk = readFileSync(`${DIST}/_astro/${chunkName}`, 'utf8');
/** 热度快照：首页热门榜的期望值要从它现算（与 src/lib/taxonomy.ts 的门槛配套） */
const DOWNLOADS = JSON.parse(readFileSync(resolve(HERE, '../../src/data/hf-downloads.json'), 'utf8')).repos ?? {};

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
  // 第一块是「近期热门」，里面两组：热度「高」的模型 + 近 30 天的社区项目。
  // 标题**不是入口**（热门没有独立列表页，所以没有 <a>、也没有那个"→"），条目本身照常点开详情页
  const hotTitle = doc.querySelector('.home-title.hot-title');
  check('近期热门在 LLM 分区之前', doc.querySelector('.home-title') === hotTitle, true);
  check('近期热门标题不做成入口（没有链接）', Boolean(hotTitle?.querySelector('a')), false);
  check('近期热门标题没有箭头', Boolean(hotTitle?.querySelector('.home-arrow')), false);
  check(
    '两组小标题',
    [...doc.querySelectorAll('.hot-sub')].map((h) => {
      const copy = h.cloneNode(true);
      copy.querySelectorAll('.fact, .hot-note').forEach((el) => el.remove());
      return copy.textContent.trim();
    }),
    [`热度「高」的模型`, `近 ${HOME_WINDOW_DAYS} 天的社区项目`]
  );

  /* ---- 模型榜：从内容 + 热度快照现算（门槛与 lib/taxonomy.ts 一致：LLM ≥100万 / AIGC ≥50万） ---- */
  const HIGH_MIN = { llm: 1_000_000, aigc: 500_000 };
  const readRows = (dir, collection) =>
    readdirSync(resolve(HERE, `../../src/content/${dir}`))
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const txt = readFileSync(resolve(HERE, `../../src/content/${dir}/${f}`), 'utf8');
        const repo = (txt.match(/^\s*hf:\s*["']?([^"'\s]+)/m)?.[1] ?? '').replace(
          /^https?:\/\/huggingface\.co\//,
          ''
        );
        return {
          collection,
          title: txt.match(/^title:\s*(.*)$/m)?.[1]?.replace(/^["']|["']$/g, ''),
          released: txt.match(/^released:\s*(.*)$/m)?.[1]?.replace(/^["']|["']$/g, ''),
          downloads: repo ? DOWNLOADS[repo]?.downloads : undefined,
        };
      });
  const allModels = [...readRows('llm', 'llm'), ...readRows('aigc', 'aigc')];
  const hotCutoff = Date.now() - HOT_WINDOW_DAYS * 86_400_000;
  const highModels = allModels
    .filter(
      (r) =>
        typeof r.downloads === 'number' &&
        r.downloads >= HIGH_MIN[r.collection] &&
        new Date(`${r.released}T00:00:00Z`).getTime() >= hotCutoff
    )
    .sort(
      (a, b) => b.downloads - a.downloads || new Date(b.released).getTime() - new Date(a.released).getTime()
    );
  const hotModelItems = [...doc.querySelectorAll('ol.hot-list .hot-item')];
  const hotModelTitles = hotModelItems.map((li) => li.querySelector('.hot-name').textContent);
  check('模型榜 = 近两个月里热度「高」的前 10（按 HF 下载量）', hotModelTitles, highModels.slice(0, 10).map((r) => r.title));
  check(
    '计数标签：够格的不止 10 条时写成「10 / 共多少条」',
    doc.querySelector('.hot-sub .fact').textContent.replace(/\s+/g, ''),
    `${hotModelItems.length}${highModels.length > hotModelItems.length ? `/${highModels.length}` : ''}`
  );
  check('模型榜的口径小字写了"近两个月"', doc.querySelector('.hot-sub .hot-note').textContent.includes('近两个月'), true);
  check(
    '模型榜名次从 1 开始连着排',
    hotModelItems.map((li) => li.querySelector('.hot-rank').textContent),
    hotModelItems.map((_, i) => String(i + 1))
  );
  check('模型榜只收 LLM / AIGC', [...new Set(hotModelItems.map((li) => li.querySelector('.hot-kind').textContent))].every((k) => k === 'LLM' || k === 'AIGC'), true);
  // 热度数字（1 万以上折成"x.x万"）必须从高到低 —— 否则"热度榜"其实是按别的东西排的
  const heat = hotModelItems.map((li) => {
    const t = li.querySelector('.hot-heat').textContent.trim();
    return t.endsWith('万') ? Number(t.slice(0, -1)) * 10_000 : Number(t.replace(/,/g, ''));
  });
  check('模型榜热度从高到低', heat.every((v, i) => i === 0 || heat[i - 1] >= v), true);
  check(
    '模型榜条目都指向详情页且在新窗口打开',
    hotModelItems.every((li) => {
      const a = li.querySelector('.hot-name');
      return (
        a?.getAttribute('target') === '_blank' &&
        a?.getAttribute('rel') === 'noopener' &&
        /^\/(llm|aigc)\/.+\/$/.test(a.getAttribute('href'))
      );
    }),
    true
  );
  /* ---- 社区项目：近 30 天窗口内发布的那几条（社区项目没有下载量，进不了上面的榜） ---- */
  const cutoff = Date.now() - HOME_WINDOW_DAYS * 86_400_000;
  const windowProjects = readRows('projects', 'projects')
    .filter((r) => new Date(`${r.released}T00:00:00Z`).getTime() >= cutoff)
    .sort((a, b) => new Date(b.released).getTime() - new Date(a.released).getTime());
  const hotProjectItems = [...doc.querySelectorAll('ul.hot-list .hot-item')];
  check(
    '社区项目 = 近 30 天发布的那几条（新的在前）',
    hotProjectItems.map((li) => li.querySelector('.hot-name').textContent),
    windowProjects.map((r) => r.title)
  );
  check('社区项目条目数为 0 时也给出提示', hotProjectItems.length > 0 || doc.body.textContent.includes('最近 30 天还没有新的社区项目'), true);
  check(
    '社区项目行没有名次（名次列留空，只为与模型榜对齐）',
    hotProjectItems.every((li) => li.querySelector('.hot-rank').textContent === ''),
    true
  );
  check(
    '社区项目的右列是发布日期、且指向详情页（新窗口）',
    hotProjectItems.every((li) => {
      const a = li.querySelector('.hot-name');
      return (
        /^\d{4}\/\d{2}\/\d{2}$/.test(li.querySelector('.hot-date').textContent.trim()) &&
        a.getAttribute('target') === '_blank' &&
        a.getAttribute('rel') === 'noopener' &&
        /^\/projects\/.+\/$/.test(a.getAttribute('href'))
      );
    }),
    true
  );
  check(
    '「近期热门」的计数 = 模型数 + 项目数',
    hotTitle.querySelector('.fact').textContent,
    String(hotModelItems.length + hotProjectItems.length)
  );

  // 分区标题（LLM 近期模型 / AIGC 近期模型）就是"看全部"的入口，标题下面那行说明文字已经删掉
  check(
    '分区标题是链接',
    [...doc.querySelectorAll('.home-title:not(.hot-title) a')].map((a) => a.getAttribute('href')),
    ['/llm/models/', '/aigc/image/']
  );
  check(
    '分区标题文本（型号 + 计数 + 箭头）',
    [...doc.querySelectorAll('.home-title:not(.hot-title)')].map((h) => h.textContent.replace(/\s+/g, '')),
    [`LLM近期模型${countWindow('llm')}→`, `AIGC近期模型${countWindow('aigc')}→`]
  );
  check('标题下面不再有说明段落', doc.querySelectorAll('.section-note').length, 0);
  check(
    '首页不再出现"看全部模型"这类正文链接',
    [...doc.querySelectorAll('.section p a')].length,
    0
  );
}

// 热度分档 **LLM 与 AIGC 是两套阈值**（LLM 高 ≥100万 / AIGC 高 ≥50万），
// 侧栏「热度」标签必须跟着页面走 —— 拿错集合最典型的症状就是 AIGC 页上冒出「100万」
{
  console.log('\n=== 侧栏「热度」标签按集合取阈值 ===');
  const heatTagsOf = (file) => {
    const dom = new JSDOM(readFileSync(`${DIST}/${file}`, 'utf8')).window.document;
    return [...dom.querySelectorAll('[data-tag-filter] [data-tag]')]
      .map((a) => a.getAttribute('data-tag'))
      .filter((t) => /^[低中高] /.test(t));
  };
  const llmTags = heatTagsOf('llm/models/index.html');
  const aigcTags = heatTagsOf('aigc/image/index.html');
  check('LLM 页有热度分档', llmTags.length > 0, true);
  check('AIGC 页有热度分档', aigcTags.length > 0, true);
  check('LLM 页不出现 AIGC 的「50万」', llmTags.some((t) => t.includes('50万')), false);
  check('AIGC 页不出现 LLM 的「100万」', aigcTags.some((t) => t.includes('100万')), false);
  check('LLM 页「高」的门槛是 ≥100万', llmTags.includes('高 ≥100万'), true);
  check('AIGC 页「高」的门槛是 ≥50万', aigcTags.includes('高 ≥50万'), true);
}

console.log(`\n总计：通过 ${pass}、失败 ${fail}`);
process.exit(fail ? 1 : 0);