/**
 * 功能测试：把构建产物真的跑起来，模拟勾选/点击，检查就地过滤是否正确。
 *
 * 期望值**不写死**：启动时从 `src/content/llm/*.md` 现算（与 `_verify/expect.mjs` 同一套口径），
 * 热度那一组再叠一次 `src/data/hf-downloads.json` 的下载量，
 * 所以增删收录、刷新热度之后都不需要再来改这个文件。
 *
 * 两点环境说明：
 *  1. Astro 把组件的 <script> 打包成 type="module" 的外部 chunk，而 jsdom 不执行 module 脚本，
 *     所以这里手动把该 chunk 当普通脚本注入（它本身没有 import/export，可以这样跑）。
 *  2. jsdom 没有 matchMedia，主题脚本会用到，用 beforeParse 补一个空实现。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(HERE, '../../dist');
const CONTENT = resolve(HERE, '../../src/content/llm');

/* ---------------- 期望值：从内容文件现算 ---------------- */
// 热度：与站内同一口径（links.hf 的仓库 ID → src/data/hf-downloads.json 的下载量 → 分档）
const DOWNLOADS = JSON.parse(
  readFileSync(resolve(HERE, '../../src/data/hf-downloads.json'), 'utf8')
).repos;
// links.hf 在 frontmatter 里是缩进过的（`  hf: "https://…"`），不能用上面那个顶格的 get()
const hfRepoOf = (txt) =>
  (txt.match(/^\s*hf:\s*["']?([^"'\s]+)["']?/m)?.[1] ?? '').replace(/^https?:\/\/huggingface\.co\//, '');
const popularityTagOf = (downloads) =>
  downloads === undefined
    ? ''
    : downloads >= 1_000_000
      ? '高 ≥100万'
      : downloads >= 100_000
        ? '中 10万-100万'
        : '低 <10万';

const rows = [];
for (const f of readdirSync(CONTENT).filter((x) => x.endsWith('.md'))) {
  const txt = readFileSync(`${CONTENT}/${f}`, 'utf8');
  const get = (k) => txt.match(new RegExp(`^${k}: "(.*)"$`, 'm'))?.[1] ?? txt.match(new RegExp(`^${k}: (.*)$`, 'm'))?.[1] ?? '';
  const tags = (txt.match(/^tags: \[(.*)\]$/m)?.[1] ?? '').replace(/"/g, '').split(',').map((s) => s.trim());
  const ctx = get('context').match(/^\s*(\d+(?:\.\d+)?)\s*([KM])/i);
  const pm = get('params').match(/(\d+(?:\.\d+)?)\s*([BT])/i);
  const totalB = pm ? Number(pm[1]) * (pm[2].toUpperCase() === 'T' ? 1000 : 1) : null;
  // 侧栏「上下文」按分档展示（与 lib/taxonomy.ts 的 contextBucketOf 同口径：128K 算中、512K 仍是中）
  const ctxK = ctx ? Number(ctx[1]) * (ctx[2].toUpperCase() === 'M' ? 1024 : 1) : null;
  rows.push({
    title: get('title'),
    family: get('family'),
    month: get('released').slice(0, 7),
    tags,
    contextTag: ctxK == null ? '' : ctxK < 128 ? '低 0-128K' : ctxK <= 512 ? '中 128K-512K' : '高 >512K',
    sizeTag: totalB == null ? '' : totalB < 100 ? '低 ≤100B' : totalB < 500 ? '中 100-500B' : '高 ≥500B',
    popularityTag: popularityTagOf(DOWNLOADS[hfRepoOf(txt)]?.downloads),
  });
}
const pick = (fn) => rows.filter(fn);
const titlesOf = (fn) => pick(fn).map((r) => r.title).sort();
const FAMS = new Set(rows.map((r) => r.family)).size;
const TOTAL = rows.length;
const MONTHS = [...new Set(rows.map((r) => r.month))].sort().reverse();
const qwenByMonth = {};
for (const r of pick((r) => r.family === 'Qwen')) qwenByMonth[r.month] = (qwenByMonth[r.month] ?? 0) + 1;
const QWEN_GROUPS = MONTHS.map((m) => [m, qwenByMonth[m] ? `显示(${qwenByMonth[m]})` : '隐藏']);

const html = readFileSync(`${DIST}/llm/models/index.html`, 'utf8');
const chunkName = readdirSync(`${DIST}/_astro`).find((f) => f.startsWith('TagFilter') && f.endsWith('.js'));
const chunk = readFileSync(`${DIST}/_astro/${chunkName}`, 'utf8');

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://example.com/llm/models/',
  pretendToBeVisual: true,
  beforeParse(window) {
    window.matchMedia = () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    });
  },
});

const { window } = dom;
const doc = window.document;

await new Promise((resolve) => {
  if (doc.readyState === 'complete') return resolve();
  const t = setTimeout(resolve, 2000);
  window.addEventListener('load', () => { clearTimeout(t); resolve(); }, { once: true });
});

const tag = doc.createElement('script');
tag.textContent = chunk;
doc.body.appendChild(tag);

let pass = 0;
let fail = 0;
const check = (name, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) { pass++; console.log(`  ok   ${name}  → ${a}`); }
  else { fail++; console.log(`  FAIL ${name}\n         实际 ${a}\n         期望 ${e}`); }
};

const visible = () => [...doc.querySelectorAll('.entry')].filter((c) => !c.hasAttribute('data-filtered'));
const titles = () => visible().map((c) => c.querySelector('.entry-title').textContent);
const hash = () => window.location.hash;
const text = (sel) => (doc.querySelector(sel)?.textContent ?? '').trim();
const familyBox = (v) => [...doc.querySelectorAll('[data-family]')].find((b) => b.value === v);
const monthBox = (v) => [...doc.querySelectorAll('[data-month]')].find((b) => b.value === v);
// 「筛选」下拉里的每一项是复选框（多选）；卡片上的标签胶囊是 `<a data-tag>` 的开关
const tagBox = (v) => [...doc.querySelectorAll('[data-tag-filter] input[data-tag]')].find((b) => b.value === v);
const tagAllBox = () => doc.querySelector('[data-tag-all]');
const pill = (v) => [...doc.querySelectorAll('.tag-filter a[data-tag]')].find((a) => a.getAttribute('data-tag') === v);
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
/** 页面脚本有部分更新排在 rAF 里；读完立刻断言会拿到旧 DOM，所以每次断言前先让事件循环跑两拍 */
const settle = () => new Promise((r) => window.requestAnimationFrame(() => window.requestAnimationFrame(r)));
const monthGroups = () =>
  [...doc.querySelectorAll('.section.month')].map((s) => [
    s.getAttribute('data-month'),
    s.hasAttribute('data-filtered') ? '隐藏' : `显示(${s.querySelectorAll('.entry:not([data-filtered])').length})`,
  ]);

console.log(`\n注入的脚本 chunk: ${chunkName}（${chunk.length} 字节）`);
console.log(`期望值来自 src/content/llm/：共 ${TOTAL} 条、${FAMS} 个家族、${MONTHS.length} 个月`);

console.log('\n=== 1. 侧栏结构 ===');
const cards = [...doc.querySelectorAll('.listing-side > *')];
check('左侧卡片数量', cards.length, 3);
check(
  '卡片顺序',
  cards.map(
    (c) =>
      c.className.split(' ')[0] +
      (c.hasAttribute('data-month-filter') ? ':时间' : c.hasAttribute('data-family-filter') ? ':所属' : ':筛选')
  ),
  ['dd:时间', 'dd:所属', 'dd:筛选']
);
check('「所属」是 details 下拉（summary > .dd-value）',
  Boolean(doc.querySelector('details[data-family-details] > summary > .dd-value[data-family-label]')), true);
check('「时间」也是 details 下拉',
  Boolean(doc.querySelector('details[data-month-details] > summary > .dd-value[data-month-label]')), true);
check('两张下拉都有箭头与默认标题',
  [
    doc.querySelector('[data-family-filter] .dd-chev') !== null,
    doc.querySelector('[data-family-filter] .dd-item-all .dd-text').textContent.trim(),
  ],
  [true, '全部所属']);
check('「所属」已不在「筛选」下拉里',
  [...doc.querySelectorAll('[data-tag-filter] [data-tag]')].some((a) => ['Kimi', 'GLM', 'DeepSeek'].includes(a.getAttribute('data-tag'))),
  false);
// 分组标题上可能挂着口径小字（.dd-note），断言只看标题本身
const groupTitles = () =>
  [...doc.querySelectorAll('[data-tag-filter] .dd-group-title')].map((el) => {
    const copy = el.cloneNode(true);
    copy.querySelector('.dd-note')?.remove();
    return copy.textContent.trim();
  });
check('「筛选」下拉的分组（热度在最上面，再是结构 / 类型与派生的上下文 / 参数量 / 商用）',
  groupTitles(),
  ['热度', '结构', '类型', '上下文', '参数量', '商用']);
check('「热度」标注了自己按什么算',
  doc.querySelector('[data-tag-filter] .dd-note')?.textContent.trim(),
  'HF 下载量');
check('「筛选」也是 details 下拉',
  Boolean(doc.querySelector('details[data-tag-details] > summary > .dd-value[data-tag-label]')), true);
check('「筛选」里每一项都是复选框（多选）',
  [...doc.querySelectorAll('[data-tag-filter] [data-tag]')].every(
    (el) => el.tagName === 'INPUT' && el.type === 'checkbox'
  ), true);
check('每个标签复选框都带分组名（组内「或」、组间「与」靠它算）',
  [...doc.querySelectorAll('[data-tag-filter] input[data-tag]')].every((el) => Boolean(el.getAttribute('data-tag-group'))), true);
check('「筛选」里的分组名 = 复选框上的 data-tag-group',
  [...new Set([...doc.querySelectorAll('[data-tag-filter] input[data-tag]')].map((el) => el.getAttribute('data-tag-group')))],
  ['热度', '结构', '类型', '上下文', '参数量', '商用']);
check('「筛选」也有一个"全部"复选框',
  Boolean(doc.querySelector('[data-tag-filter] [data-tag-all]')), true);
check('三张下拉默认都是收起的',
  [...doc.querySelectorAll('.listing-side details')].map((d) => d.open), [false, false, false]);
check('所属下拉的家族数', [...doc.querySelectorAll('[data-family]')].length, FAMS);

console.log('\n=== 2. 脚本真的跑起来了（初始状态）===');
check('可见条目', visible().length, TOTAL);
check('hash', hash(), '');
check('时间标题', text('[data-month-label]'), '全部时间');
check('所属标题', text('[data-family-label]'), '全部所属');
check('全部时间已勾选', doc.querySelector('[data-month-all]').checked, true);
check('全部所属已勾选', doc.querySelector('[data-family-all]').checked, true);
check('「筛选」标题默认是全部', text('[data-tag-label]'), '全部');
check('标签"全部"已勾选、没有单个标签被勾上',
  [tagAllBox().checked, [...doc.querySelectorAll('[data-tag-filter] input[data-tag]')].some((b) => b.checked)],
  [true, false]);

console.log('\n=== 3. 所属单选（Kimi）===');
click(familyBox('Kimi'));
const KIMI = titlesOf((r) => r.family === 'Kimi');
check('可见条目', visible().length, KIMI.length);
check('hash', hash(), '#family=Kimi');
check('所属标题', text('[data-family-label]'), 'Kimi');
check('全部所属取消勾选', doc.querySelector('[data-family-all]').checked, false);
check('Kimi 复选框已勾选', familyBox('Kimi').checked, true);
check('条目明细', titles().sort(), KIMI);

console.log('\n=== 4. 所属多选（+GLM）===');
click(familyBox('GLM'));
const KG = titlesOf((r) => r.family === 'Kimi' || r.family === 'GLM');
check('可见条目', visible().length, KG.length);
check('hash', hash(), '#family=Kimi,GLM');
check('所属标题', text('[data-family-label]'), '已选 2 个所属');

console.log('\n=== 5. 叠加时间（2026-06）===');
click(monthBox('2026-06'));
const JUN_KG = titlesOf((r) => r.month === '2026-06' && (r.family === 'Kimi' || r.family === 'GLM'));
check('可见条目', visible().length, JUN_KG.length);
check('条目明细', titles().sort(), JUN_KG);
check('hash', hash(), '#months=2026-06&family=Kimi,GLM');
check('时间标题', text('[data-month-label]'), '2026 年 6 月');
check('全部时间取消勾选', doc.querySelector('[data-month-all]').checked, false);

console.log('\n=== 6. 再叠加标签（MoE）===');
click(tagBox('MoE'));
const JUN_MOE = titlesOf((r) => r.month === '2026-06' && r.tags.includes('MoE') && (r.family === 'Kimi' || r.family === 'GLM'));
check('可见条目', visible().length, JUN_MOE.length);
check('hash', hash(), '#months=2026-06&family=Kimi,GLM&tag=MoE');
check('MoE 复选框已勾选', tagBox('MoE').checked, true);
check('「筛选」标题显示标签名', text('[data-tag-label]'), 'MoE');

console.log('\n=== 7. 清空所属，时间与标签保留 ===');
click(doc.querySelector('[data-family-all]'));
const JUN_MOE_ALL = titlesOf((r) => r.month === '2026-06' && r.tags.includes('MoE'));
check('可见条目', visible().length, JUN_MOE_ALL.length);
check('hash', hash(), '#months=2026-06&tag=MoE');
check('所属标题回到默认', text('[data-family-label]'), '全部所属');
check('所属复选框全部取消', [...doc.querySelectorAll('[data-family]')].some((b) => b.checked), false);
check('条目明细', titles().sort(), JUN_MOE_ALL);

console.log('\n=== 8. 清空时间 → 只剩标签 ===');
click(doc.querySelector('[data-month-all]'));
const MOE_ALL = titlesOf((r) => r.tags.includes('MoE'));
check('可见条目', visible().length, MOE_ALL.length);
check('hash', hash(), '#tag=MoE');

console.log('\n=== 9. 清空标签 → 全部条目 ===');
click(tagAllBox());
check('可见条目', visible().length, TOTAL);
check('hash', hash(), '');
check('标题回到「全部」、勾选也跟着回位',
  [text('[data-tag-label]'), tagAllBox().checked, tagBox('MoE').checked],
  ['全部', true, false]);

console.log('\n=== 10. 多选月份 ===');
click(monthBox('2025-06'));
click(monthBox('2025-07'));
const M56 = titlesOf((r) => r.month === '2025-06' || r.month === '2025-07');
check('可见条目', visible().length, M56.length);
check('hash', hash(), '#months=2025-07,2025-06');
check('时间标题', text('[data-month-label]'), '已选 2 个月');

console.log('\n=== 11. 旧的 #tag=家族 链接仍能过滤 ===');
window.location.hash = '#tag=DeepSeek';
window.dispatchEvent(new window.Event('hashchange'));
const DS = titlesOf((r) => r.family === 'DeepSeek');
check('可见条目', visible().length, DS.length);
check('条目明细', titles().sort(), DS);
window.location.hash = '';
window.dispatchEvent(new window.Event('hashchange'));

console.log('\n=== 12. 时间线分组随之折叠（Qwen）===');
click(familyBox('Qwen'));
const QWEN = titlesOf((r) => r.family === 'Qwen');
check('可见条目', visible().length, QWEN.length);
check('分组状态', monthGroups(), QWEN_GROUPS);
check('时间线标记已过滤', doc.querySelector('[data-timeline]').getAttribute('data-filtered'), 'true');

console.log('\n=== 13. 点外面 / Esc 收起两个下拉 ===');
const monthDetails = doc.querySelector('[data-month-details]');
const familyDetails = doc.querySelector('[data-family-details]');
monthDetails.open = true;
familyDetails.open = true;
click(doc.body);
check('点外面后', [monthDetails.open, familyDetails.open], [false, false]);
monthDetails.open = true;
familyDetails.open = true;
doc.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
check('按 Esc 后', [monthDetails.open, familyDetails.open], [false, false]);

console.log('\n=== 14. 无结果时的提示 ===');
click(doc.querySelector('[data-family-all]')); // 先清空上一步留下的「所属」
click(familyBox('Spark'));
click(monthBox('2025-01')); // Spark 是 2026-09 发布的，与 2025-01 不可能同时命中
await settle();
const note = doc.querySelector('[data-filter-note]');
check('可见条目', visible().length, 0);
check('提示可见', note.hidden, false);
check('提示文案', note.textContent, '没有符合条件的模型。 · 清空左侧筛选看所有条目');

console.log('\n=== 15. 深链接直接进入（hash 预置）===');
window.location.hash = '#months=2026-04&family=DeepSeek&tag=MoE';
window.dispatchEvent(new window.Event('hashchange'));
const APR = titlesOf((r) => r.month === '2026-04' && r.family === 'DeepSeek' && r.tags.includes('MoE'));
check('可见条目', visible().length, APR.length);
check('条目明细', titles().sort(), APR);
check('所属标题', text('[data-family-label]'), 'DeepSeek');
check('时间标题', text('[data-month-label]'), '2026 年 4 月');
check('DeepSeek 复选框已勾选', familyBox('DeepSeek').checked, true);
check('2026-04 复选框已勾选', monthBox('2026-04').checked, true);
check('MoE 复选框已勾选', tagBox('MoE').checked, true);

console.log('\n=== 16. 三张下拉的手风琴行为 ===');
const openDrop = (d) => { d.open = true; d.dispatchEvent(new window.Event('toggle')); };
const monthD = doc.querySelector('[data-month-details]');
const familyD = doc.querySelector('[data-family-details]');
const tagD = doc.querySelector('[data-tag-details]');
openDrop(monthD);
check('展开「时间」', [monthD.open, familyD.open, tagD.open], [true, false, false]);
openDrop(familyD);
check('展开「所属」后「时间」自动收起', [monthD.open, familyD.open, tagD.open], [false, true, false]);
openDrop(tagD);
check('展开「筛选」后「所属」自动收起', [monthD.open, familyD.open, tagD.open], [false, false, true]);
check('收起不影响已选条件（标题仍在）', text('[data-tag-label]'), 'MoE');
click(doc.body);
check('点外面三张全收起', [monthD.open, familyD.open, tagD.open], [false, false, false]);

console.log('\n=== 17. 上下文 / 参数量：不同分组之间是「与」 ===');
window.location.hash = '';
window.dispatchEvent(new window.Event('hashchange'));
check('先清空所有条件', [visible().length, hash()], [TOTAL, '']);
const C_HIGH = titlesOf((r) => r.contextTag === '高 >512K');
click(tagBox('高 >512K'));
check(`上下文 高 >512K → ${C_HIGH.length} 条`, visible().length, C_HIGH.length);
check('hash', hash(), '#tag=' + encodeURIComponent('高 >512K'));
check('「筛选」标题显示 高 >512K', text('[data-tag-label]'), '高 >512K');
const HIGH = titlesOf((r) => r.sizeTag === '高 ≥500B');
const C_HIGH_S_HIGH = titlesOf((r) => r.contextTag === '高 >512K' && r.sizeTag === '高 ≥500B');
click(tagBox('高 ≥500B'));
check(`再勾 参数量 高 ≥500B（另一组，两条都要满足）→ ${C_HIGH_S_HIGH.length} 条`, visible().length, C_HIGH_S_HIGH.length);
check('条目明细', titles().sort(), C_HIGH_S_HIGH);
check('两个复选框同时选中（不再是单选顶掉）',
  [tagBox('高 >512K').checked, tagBox('高 ≥500B').checked], [true, true]);
check('hash 里两个标签都在', hash(),
  '#tag=' + [encodeURIComponent('高 >512K'), encodeURIComponent('高 ≥500B')].join(','));
check('「筛选」标题写"已选 2 个标签"', text('[data-tag-label]'), '已选 2 个标签');
check('比只筛参数量时更窄', visible().length < HIGH.length, true);
click(tagBox('高 ≥500B')); // 取消其中一个 → 回到只筛上下文
check('取消参数量后只剩上下文', [visible().length, hash()], [C_HIGH.length, '#tag=' + encodeURIComponent('高 >512K')]);
click(tagAllBox());
check('「全部」回到全部条目', [visible().length, hash(), text('[data-tag-label]')], [TOTAL, '', '全部']);

console.log('\n=== 18. 热度分档：同一组内是「或」 ===');
const HOT = titlesOf((r) => r.popularityTag === '高 ≥100万');
click(tagBox('高 ≥100万'));
check(`热度 高 ≥100万 → ${HOT.length} 条`, visible().length, HOT.length);
check('条目明细', titles().sort(), HOT);
check('hash', hash(), '#tag=' + encodeURIComponent('高 ≥100万'));
check('「筛选」标题显示热度分档', text('[data-tag-label]'), '高 ≥100万');
const MID = titlesOf((r) => r.popularityTag === '中 10万-100万');
const COLD = titlesOf((r) => r.popularityTag === '低 <10万');
click(tagBox('中 10万-100万'));
const HOT_MID = titlesOf((r) => r.popularityTag === '高 ≥100万' || r.popularityTag === '中 10万-100万');
check(`再加 中 10万-100万（同组，命中任意一档即可）→ ${HOT_MID.length} 条`, visible().length, HOT_MID.length);
check('条目明细', titles().sort(), HOT_MID);
click(tagBox('低 <10万'));
check('三档全勾 = 取到下载量的全部条目', visible().length, rows.filter((r) => r.popularityTag).length);
check('三档相加 = 取到下载量的条目数', HOT.length + MID.length + COLD.length, rows.filter((r) => r.popularityTag).length);
// 结构是另一个组：组间仍是「与」
click(tagBox('低 <10万'));
click(tagBox('中 10万-100万'));
click(tagBox('MoE'));
const HOT_MOE = titlesOf((r) => r.popularityTag === '高 ≥100万' && r.tags.includes('MoE'));
check(`热度「高」+ 结构 MoE（不同组，都要满足）→ ${HOT_MOE.length} 条`, visible().length, HOT_MOE.length);
check('条目明细', titles().sort(), HOT_MOE);
click(tagAllBox());
check('回到全部条目', [visible().length, hash()], [TOTAL, '']);

console.log('\n=== 19. 卡片上的标签胶囊也是一个开关 ===');
check('卡片上有 MoE 胶囊', Boolean(pill('MoE')), true);
click(pill('MoE'));
check('点胶囊 = 把标签加进选择（侧栏跟着勾上、胶囊自己高亮）',
  [tagBox('MoE').checked, pill('MoE').classList.contains('is-active'), hash()],
  [true, true, '#tag=MoE']);
check('可见条目', visible().length, titlesOf((r) => r.tags.includes('MoE')).length);
click(pill('MoE'));
check('再点一次 = 移出选择', [visible().length, hash(), tagBox('MoE').checked], [TOTAL, '', false]);

console.log('\n=== 20. 同组多选：MoE 或 Dense 就等于不筛 ===');
click(tagBox('MoE'));
click(tagBox('Dense'));
const MOE_DENSE = titlesOf((r) => r.tags.includes('MoE') || r.tags.includes('Dense'));
check(`MoE + Dense（同组「或」）→ ${MOE_DENSE.length} 条`, visible().length, MOE_DENSE.length);
check('hash 里两个都在', hash(), '#tag=MoE,Dense');
check('「筛选」标题写"已选 2 个标签"', text('[data-tag-label]'), '已选 2 个标签');
click(tagAllBox());
check('清空后回到全部', [visible().length, hash(), text('[data-tag-label]')], [TOTAL, '', '全部']);

console.log(`\n结果：通过 ${pass}、失败 ${fail}`);
process.exit(fail ? 1 : 0);