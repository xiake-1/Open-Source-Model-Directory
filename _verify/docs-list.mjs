/**
 * 由站点数据生成三份收录清单，并输出「日期与来源核对表」供人工复核：
 *   docs/项目模型/LLM模型收录清单.md    （src/content/llm）
 *   docs/项目模型/AIGC模型收录清单.md   （src/content/aigc，生图 / 生视频）
 *   docs/项目模型/社区项目收录清单.md  （src/content/projects，本地 LLM 部署社区方案）
 * 用法：node _verify/docs-list.mjs
 *
 * LLM 的 HF 仓库创建日来自 `_verify/enrich.json`，AIGC 的来自 `_verify/hf-aigc/*.json`
 * （由 `_verify/hf-fetch.mjs` / `_verify/aigc-fetch.mjs` 落盘），两者都缺也不影响出清单。
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

/** AIGC 的仓库创建日：把所有机构文件合并成 { repo: createdAt } */
function loadAigcCreated() {
  const out = {};
  const dir = '_verify/hf-aigc';
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    try {
      for (const row of JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'))) {
        if (row?.id) out[row.id] = (row.createdAt ?? '').slice(0, 10);
      }
    } catch {}
  }
  return out;
}

const AIGC_CREATED = loadAigcCreated();

function frontmatterOf(dir, f) {
  const txt = readFileSync(`${dir}/${f}`, 'utf8');
  const get = (k) =>
    txt.match(new RegExp(`^${k}: "(.*)"$`, 'm'))?.[1] ?? txt.match(new RegExp(`^${k}: (.*)$`, 'm'))?.[1] ?? '';
  const hf = txt.match(/^\s+hf: "(.*)"$/m)?.[1] ?? '';
  return { get, repo: hf.replace('https://huggingface.co/', '') };
}

/** 读一个集合的条目，归一成清单需要的那几个字段 */
function readCollection(dir, { withContext = false } = {}) {
  const rows = [];
  if (!existsSync(dir)) return rows;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const { get, repo } = frontmatterOf(dir, f);
    rows.push({
      slug: f.replace(/\.md$/, ''),
      title: get('title'),
      org: get('org'),
      family: get('family'),
      released: get('released'),
      output: get('output'),
      architecture: get('architecture'),
      params: get('params'),
      context: withContext ? get('context') : '',
      commercial: get('commercial'),
      license: get('license'),
      hf: repo,
    });
  }
  return rows;
}

/** 按 年份 → 月份 分类，同月内新的在前 */
function byYearMonth(rows) {
  const byMonth = new Map();
  for (const r of rows) {
    const k = r.released.slice(0, 7);
    if (!byMonth.has(k)) byMonth.set(k, []);
    byMonth.get(k).push(r);
  }
  const months = [...byMonth.keys()].sort().reverse();
  const years = [...new Set(months.map((m) => m.slice(0, 4)))].sort().reverse();
  for (const [k, list] of byMonth) {
    byMonth.set(
      k,
      list.sort((a, b) => b.released.localeCompare(a.released) || a.title.localeCompare(b.title))
    );
  }
  return { byMonth, months, years };
}

/** 生成一份清单的正文 */
function render({ heading, intro, rows, line }) {
  const { byMonth, months, years } = byYearMonth(rows);
  const lines = [heading, '', ...intro, ''];
  for (const y of years) {
    const ys = rows.filter((r) => r.released.startsWith(y));
    lines.push(`## ${y} 年（${ys.length}）`, '');
    for (const m of months.filter((x) => x.startsWith(y))) {
      const ms = byMonth.get(m);
      lines.push(`### ${m}（${ms.length}）`);
      for (const r of ms) lines.push(`- ${line(r)}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

/** 日期核对表：官方发布日与 HF 仓库创建日差值 ≥3 天的条目 */
function report(label, rows, createdOf) {
  const drift = rows
    .filter((r) => createdOf(r))
    .map((r) => ({ ...r, created: createdOf(r), days: Math.round((new Date(r.released) - new Date(createdOf(r))) / 86400000) }))
    .filter((r) => Math.abs(r.days) >= 3)
    .sort((a, b) => Math.abs(b.days) - Math.abs(a.days));
  console.log(`\n== ${label}：官方发布日 vs HF 仓库创建日（差值 ≥3 天，需要复核）==`);
  if (!drift.length) console.log('  （无）');
  for (const r of drift) console.log(`  ${r.slug}\t${r.released}\tHF ${r.created}\t${r.days > 0 ? '+' : ''}${r.days} 天`);
  return drift;
}

/* ---------------- LLM ---------------- */

const enrich = existsSync('_verify/enrich.json') ? JSON.parse(readFileSync('_verify/enrich.json', 'utf8')) : {};
const llmRows = readCollection('src/content/llm', { withContext: true });
const llmMonths = byYearMonth(llmRows).months;
const llmText = render({
  heading: '# LLM 模型收录清单',
  intro: [
    '> 已写进站内的开源 LLM，按 **年份 → 月份** 分类，同月内新的在前。',
    `> 共 ${llmRows.length} 条（${llmMonths[llmMonths.length - 1]} ～ ${llmMonths[0]}）。只收机构自研的开放权重模型：`,
    '> 社区微调、蒸馏、剪枝、换皮，以及知名实验室对大厂模型的改造版都不收。',
    '> 由 `node _verify/docs-list.mjs` 生成，改完条目重跑即可；收录标准与字段口径见 [项目说明.md](../项目结构/项目说明.md)。',
  ],
  rows: llmRows,
  line: (r) =>
    [r.title, r.released, `${r.org}／${r.family}`, [r.params && `总参 ${r.params}`, r.context && `上下文 ${r.context}`, r.commercial].filter(Boolean).join('，')].join(' — '),
});
writeFileSync('docs/项目模型/LLM模型收录清单.md', llmText, 'utf8');

/* ---------------- AIGC ---------------- */

const aigcRows = readCollection('src/content/aigc');
const images = aigcRows.filter((r) => r.output === 'image');
const videos = aigcRows.filter((r) => r.output === 'video');
const aigcMonths = byYearMonth(aigcRows).months;
const OUTPUT_LABEL = { image: '生图', video: '生视频' };
const aigcText = render({
  heading: '# AIGC 模型收录清单',
  intro: [
    '> 已写进站内的开源 AIGC 模型（**生图 + 生视频**），按 **年份 → 月份** 分类，同月内新的在前。',
    `> 共 ${aigcRows.length} 条（${aigcMonths[aigcMonths.length - 1]} ～ ${aigcMonths[0]}）：生图 ${images.length} 条、生视频 ${videos.length} 条。`,
    '> 只收机构自研、权重可下载的模型：社区微调、LoRA、蒸馏与量化再发布、第三方改编都不收；',
    '> 只有 API 的闭源服务（Kling、Seedance、Midjourney、Nano Banana 等）不收。',
    '> 由 `node _verify/docs-list.mjs` 生成，改完条目重跑即可；收录标准与字段口径见 [项目说明.md](../项目结构/项目说明.md)。',
  ],
  rows: aigcRows,
  line: (r) =>
    [
      r.title,
      r.released,
      `${OUTPUT_LABEL[r.output] ?? r.output}｜${r.org}／${r.family}`,
      [r.architecture, r.params && `总参 ${r.params}`, r.commercial].filter(Boolean).join('，'),
    ].join(' — '),
});
writeFileSync('docs/项目模型/AIGC模型收录清单.md', aigcText, 'utf8');

/* ---------------- 社区项目 ---------------- */

const projectRows = readCollection('src/content/projects');
const projectMonths = byYearMonth(projectRows).months;
const projectText = render({
  heading: '# 社区项目收录清单',
  intro: [
    '> 已写进站内的社区项目（`src/content/projects/`），按 **年份 → 月份** 分类，同月内新的在前。',
    `> 共 ${projectRows.length} 条（${projectMonths[projectMonths.length - 1]} ～ ${projectMonths[0]}）。`,
    '> 收录范围：2025 年初以来首次公开、与「本地部署开源 LLM」相关的社区方案；',
    '> 只收社区反馈较好（star 量级 / 社区活跃度）的项目，不是全量清单 —— 长尾与个人玩具仓库不收。',
    '> `released` 取仓库创建日（GitHub / HF，即首次公开日），`added` 是收录时间；',
    '> 部署方式栏目（vLLM / SGLang / llama.cpp / Ollama 等）单独维护，不在此列。',
    '> 由 `node _verify/docs-list.mjs` 生成，改完条目重跑即可；收录标准与字段口径见 [项目说明.md](../项目结构/项目说明.md)。',
  ],
  rows: projectRows,
  line: (r) =>
    [r.title, r.released, r.org, [r.params, r.license].filter(Boolean).join('，')].join(' — '),
});
writeFileSync('docs/项目模型/社区项目收录清单.md', projectText, 'utf8');

console.log(`llm=${llmRows.length}（${llmMonths.length} 个月，${llmMonths[llmMonths.length - 1]} ～ ${llmMonths[0]}）`);
console.log(`aigc=${aigcRows.length}（生图 ${images.length} / 生视频 ${videos.length}，${aigcMonths.length} 个月，${aigcMonths[aigcMonths.length - 1]} ～ ${aigcMonths[0]}）`);
console.log(`projects=${projectRows.length}（${projectMonths.length} 个月，${projectMonths[projectMonths.length - 1]} ～ ${projectMonths[0]}）`);
report('LLM', llmRows, (r) => enrich[r.hf]?.created ?? '');
report('AIGC', aigcRows, (r) => AIGC_CREATED[r.hf] ?? '');