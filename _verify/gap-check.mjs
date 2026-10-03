/**
 * 缺口盘点：把 HF 候选池（2025-01 起、机构自有仓库）与已收录的 plans / 条目对比，
 * 列出「机构自研、够得着收录标准，但站里没有」的模型，按机构分组打印。
 *
 * 用法：node _verify/gap-check.mjs [org1,org2] [minLikes]
 */
import fs from 'node:fs';
import { readFileSync, readdirSync } from 'node:fs';

const orgsArg = (process.argv[2] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const MIN_LIKES = Number(process.argv[3] ?? 40);

/** 已收录：plans.mjs + src/content/llm/*.md 里的 hf 链接 */
const covered = new Set();
for (const m of (await import('./plans.mjs')).models) if (m.repo) covered.add(m.repo);
for (const f of readdirSync('src/content/llm').filter((x) => x.endsWith('.md'))) {
  const hf = readFileSync(`src/content/llm/${f}`, 'utf8').match(/^\s+hf: "(.*)"$/m)?.[1];
  if (hf) covered.add(hf.replace('https://huggingface.co/', ''));
}

/** 明显不是「一个可收录的模型」的仓库：量化 / 衍生格式 / 非生成式 / 工具 */
const SKIP = /(GGUF|ONNX|MLX|AWQ|GPTQ|bnb|quanto|w4a16|mxfp4|nvfp4|NVFP4|FP8|fp8|-4bit|-8bit|-bf16|Reranker|Embedding|embedding|Tokenizer|Bench|SAE-|ForcedAligner|-Base$|Base-|preview-backup|-DSpark$)/;

/** 第三方量化 / 改编：仓库归属不是原机构时（nvidia/Qwen3.8-27B-NVFP4 这类）按标准不收 */
const THIRD_PARTY = /^(nvidia|ibm-granite|togethercomputer|Salesforce|ServiceNow)\//;
const FOREIGN_MODEL = /(Qwen|DeepSeek|GLM|Kimi|MiniMax|Llama|Gemma|Mistral|gpt-oss|Hunyuan|ERNIE|Nemotron|Granite|Phi|Falcon)/i;

const PIPELINE = /^(text-generation|image-text-to-text|any-to-any|text2text-generation|conversational)$/;

const dir = '_verify/hf';
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
const missing = [];
const seenIds = new Set();
for (const file of files) {
  const author = file.replace('.json', '');
  if (orgsArg.length && !orgsArg.includes(author)) continue;
  let rows = [];
  try { rows = JSON.parse(fs.readFileSync(`${dir}/${file}`, 'utf8')); } catch { continue; }
  for (const r of rows) {
    if (!r.id || seenIds.has(r.id)) continue;
    seenIds.add(r.id);
    if ((r.createdAt ?? '') < '2025-01-01') continue;
    if ((r.likes ?? 0) < MIN_LIKES) continue;
    if (SKIP.test(r.id)) continue;
    if (r.pipeline && !PIPELINE.test(r.pipeline)) continue;
    // 上一行已经排掉量化名，这里再挡一次"别家模型的量化版/派生版直接挂在自己名下"的情况
    if (THIRD_PARTY.test(r.id) && FOREIGN_MODEL.test(r.id) && !new RegExp(`^${author}/`, 'i').test(r.id.replace(/^[^/]+\//, ''))) {
      const own = new RegExp(`(NVIDIA-)?(Nemotron|Granite|Command|Apriel|Aya|xLAM|Tev|NV-)`, 'i');
      if (!own.test(r.id)) continue;
    }
    if (covered.has(r.id)) continue;
    missing.push({ author, id: r.id, created: (r.createdAt ?? '').slice(0, 10), likes: r.likes, downloads: r.downloads, pipeline: r.pipeline });
  }
}

const byAuthor = new Map();
for (const m of missing) {
  if (!byAuthor.has(m.author)) byAuthor.set(m.author, []);
  byAuthor.get(m.author).push(m);
}
console.log(`候选门槛：2025-01 起、likes ≥ ${MIN_LIKES}、LLM 类 pipeline、非量化/衍生\n`);
let total = 0;
for (const [author, list] of [...byAuthor.entries()].sort((a, b) => b[1].length - a[1].length)) {
  total += list.length;
  console.log(`## ${author}（${list.length}）`);
  for (const m of list.sort((a, b) => b.created.localeCompare(a.created))) {
    console.log(`  ${m.created}  ${m.id}  likes${m.likes}  dl${m.downloads}`);
  }
  console.log('');
}
console.log(`缺口合计 ${total} 条（覆盖 ${byAuthor.size} 个机构）`);