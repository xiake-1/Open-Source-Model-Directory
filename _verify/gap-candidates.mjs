/**
 * 按定稿口径筛出「值得补录」的候选，输出 _verify/gap-candidates.md 供人工过一遍。
 *
 * 口径（2026-10 与用户确认）：
 *   1) 只收大尺寸与主流版本：参数量 ≥ 4B 的官方版本；Instruct / Thinking / Coder / VL 等官方发布算不同条目
 *   2) 专用模型不收：安全审核、语音（ASR/TTS）、OCR、embedding/reranker、专用 agent 与垂类模型
 *   3) 基线 / 量化 / 第三方改编不收
 *   4) 够得着「主流」的量化门槛：likes ≥ 100 或 downloads ≥ 50000
 *
 * 用法：node _verify/gap-candidates.mjs [org1,org2] [minLikes]
 */
import fs from 'node:fs';
import { readFileSync, readdirSync } from 'node:fs';

const orgsArg = (process.argv[2] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const MIN_LIKES = Number(process.argv[3] ?? 100);
const MIN_DL = 50000;

/** 已经收录的仓库 */
const covered = new Set();
for (const m of (await import('./plans.mjs')).models) if (m.repo) covered.add(m.repo);
for (const f of readdirSync('src/content/llm').filter((x) => x.endsWith('.md'))) {
  const hf = readFileSync(`src/content/llm/${f}`, 'utf8').match(/^\s+hf: "(.*)"$/m)?.[1];
  if (hf) covered.add(hf.replace('https://huggingface.co/', ''));
}

/** 专用模型 / 非通用 LLM —— 按口径不收 */
const SPECIALTY = /(Guard|guard|ASR|TTS|Audio|Omni-.*Captioner|Captioner|OCR|ocr|ForcedAligner|Embedding|Reranker|DeepResearch|Prover|Math|Coder-.*Prover|Voice|Speech|Translate|MT-|WebWorld|AgentWorld|Drive|Robot|Vision-Language-Action|VLA|Reward|Judge|Safety|Moderation|Docling|Chart|Table|TimeSeries|Embed|RAG|Search|Tool|Function|MCP|Code-Interpreter|Sandbox)/;
/** 量化 / 派生格式 / 基线 / 派生微调 */
const DERIV = /(GGUF|ONNX|MLX|AWQ|GPTQ|bnb|quanto|w4a16|mxfp4|nvfp4|NVFP4|FP8|fp8|-4bit|-8bit|-bf16|Base|-base|Instruct-DPO|Distill|distill|instruct-fc|fc-r|LoRA|lora|-SFT|-RL-|DPO|KTO|ORPO|preview-backup|-DSpark|Longevity|Extract|Nanos|Quant|INT4|int4)/;
/** 小尺寸：明确低于 4B 的写法（0.6B/1.5B/1.7B/1.8B/2B/2.6B/3B/3.8B/4B 以下） */
const SMALL = /([0-9]\.?[0-9]?B\b|(\d{3})M\b)/;

const PIPELINE = /^(text-generation|image-text-to-text|any-to-any|text2text-generation|conversational)$/;

/** 从仓库名里抠出参数量（B），抠不出来返回 null */
function sizeB(id) {
  const name = id.split('/')[1] ?? '';
  const m = name.match(/(\d+(?:\.\d+)?)\s*B(?![a-z])/i);
  if (m) return Number(m[1]);
  const t = name.match(/(\d+(?:\.\d+)?)\s*T(?![a-z])/i);
  if (t) return Number(t[1]) * 1000;
  return null;
}

const dir = '_verify/hf';
const rows = [];
const seenIds = new Set();
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const author = file.replace('.json', '');
  if (orgsArg.length && !orgsArg.includes(author)) continue;
  let list = [];
  try { list = JSON.parse(fs.readFileSync(`${dir}/${file}`, 'utf8')); } catch { continue; }
  for (const r of list) {
    if (!r.id || seenIds.has(r.id)) continue;
    seenIds.add(r.id);
    if ((r.createdAt ?? '') < '2025-01-01') continue;
    if ((r.likes ?? 0) < MIN_LIKES && (r.downloads ?? 0) < MIN_DL) continue;
    if (r.pipeline && !PIPELINE.test(r.pipeline)) continue;
    if (DERIV.test(r.id) || SPECIALTY.test(r.id)) continue;
    if (covered.has(r.id)) continue;
    // 小尺寸：名字里带参数就按 ≥4 判；带不出来再人工看
    const b = sizeB(r.id);
    if (b != null && b < 4) continue;
    rows.push({ author, id: r.id, created: (r.createdAt ?? '').slice(0, 10), likes: r.likes, downloads: r.downloads, sizeB: b, pipeline: r.pipeline });
  }
}

const byAuthor = new Map();
for (const r of rows) {
  if (!byAuthor.has(r.author)) byAuthor.set(r.author, []);
  byAuthor.get(r.author).push(r);
}
const md = [
  '# 补录候选（按定稿口径筛过）',
  '',
  `> 门槛：2025-01 起、likes ≥ ${MIN_LIKES} 或 downloads ≥ ${MIN_DL}、名字里能看出参数量则 ≥ 4B、`,
  '> 排除专用模型（审核/语音/OCR/embedding/垂类 agent）、基线、量化与第三方改编。',
  '> 名字里抠不出参数量的会保留在列表里，需要人工判断。',
  '',
];
let total = 0;
for (const [author, list] of [...byAuthor.entries()].sort((a, b) => b[1].length - a[1].length)) {
  total += list.length;
  md.push(`## ${author}（${list.length}）`, '');
  for (const r of list.sort((a, b) => b.created.localeCompare(a.created))) {
    md.push(`- ${r.created}  \`${r.id}\`  ${r.sizeB ? r.sizeB + 'B' : '?'}  likes${r.likes}  dl${r.downloads}`);
  }
  md.push('');
}
md.push(`合计 **${total}** 条（${byAuthor.size} 个机构）`);
fs.writeFileSync('_verify/gap-candidates.md', md.join('\n'), 'utf8');
console.log(`候选 ${total} 条 / ${byAuthor.size} 个机构 → _verify/gap-candidates.md`);
for (const [a, l] of [...byAuthor.entries()].sort((x, y) => y[1].length - x[1].length)) console.log(`  ${a}: ${l.length}`);