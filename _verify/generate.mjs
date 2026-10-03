/**
 * 由 _verify/plans.mjs 生成 src/content/llm/*.md。
 *
 * 每个条目从 HuggingFace API 补齐可核验的字段：
 *   createdAt        → released 的交叉核验（plan 里写了 released 就以 plan 为准，不一致会告警）
 *   safetensors.total→ params 的总参数量（plan 只提供「激活 xxB」这类补充）
 *   config.json      → 专家数（判断 MoE）、上下文长度参考值
 *   cardData.license → license 与 commercial 的核对
 * 其余（summary / family / vram / 中文名）由 plan 人工给出。
 *
 * 用法：node _verify/generate.mjs [slug 前缀过滤]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { models } from './plans.mjs';
import { commercialOf } from './license-policy.mjs';

function systemProxy() {
  if (process.env.HTTPS_PROXY) return process.env.HTTPS_PROXY;
  try {
    const out = execFileSync('reg', ['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'], { encoding: 'utf8' });
    const on = /ProxyEnable\s+REG_DWORD\s+0x1/.test(out);
    const server = out.match(/ProxyServer\s+REG_SZ\s+(\S+)/)?.[1];
    if (on && server) return server.includes('://') ? server : `http://${server}`;
  } catch {}
  return '';
}
const PROXY = systemProxy();
const { setGlobalDispatcher, ProxyAgent } = await import('undici').catch(() => ({}));
if (PROXY && setGlobalDispatcher && ProxyAgent) setGlobalDispatcher(new ProxyAgent(PROXY));

const CACHE = '_verify/enrich.json';
let cache = {};
try { cache = JSON.parse(await fs.readFile(CACHE, 'utf8')); } catch {}

async function getJSON(url, timeout = 25000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function enrich(repo) {
  if (cache[repo]) return cache[repo];
  const out = { repo };
  try {
    const meta = await getJSON(`https://huggingface.co/api/models/${repo}`);
    out.created = (meta.createdAt ?? '').slice(0, 10);
    out.lastModified = (meta.lastModified ?? '').slice(0, 10);
    out.license = meta.cardData?.license ?? '';
    out.pipeline = meta.pipeline_tag ?? '';
    out.likes = meta.likes ?? 0;
    out.downloads = meta.downloads ?? 0;
    out.gated = meta.gated ?? false;
    out.totalParams = meta.safetensors?.total ?? null;
    out.tags = meta.tags ?? [];
  } catch (e) { out.err = String(e.message ?? e); }
  try {
    const cfg = await getJSON(`https://huggingface.co/${repo}/raw/main/config.json`);
    out.experts = cfg.num_experts ?? cfg.num_local_experts ?? cfg.n_routed_experts ?? cfg.moe_num_experts ?? null;
    out.maxPos = cfg.max_position_embeddings ?? null;
    out.modelType = cfg.model_type ?? '';
    out.hidden = cfg.hidden_size ?? null;
    out.layers = cfg.num_hidden_layers ?? null;
    out.architectures = cfg.architectures ?? [];
  } catch (e) { out.cfgErr = String(e.message ?? e); }
  cache[repo] = out;
  return out;
}

const LIMIT = Number(process.env.GEN_LIMIT ?? 0);
const FILTER = process.argv[2] ?? '';
const CONCURRENCY = Number(process.env.GEN_CONC ?? 4);

const queue = models.filter((m) => !FILTER || m.slug.startsWith(FILTER));
console.log(`plan=${models.length} todo=${queue.length}${LIMIT ? ` limit=${LIMIT}` : ''}`);

const results = [];
let idx = 0;
async function worker() {
  while (idx < queue.length) {
    const m = queue[idx++];
    const repo = m.repo;
    if (!repo) { results.push({ m }); continue; }
    try { results.push({ m, e: await enrich(repo) }); }
    catch (err) { results.push({ m, e: { repo, err: String(err.message ?? err) } }); }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await fs.writeFile(CACHE, JSON.stringify(cache, null, 1), 'utf8');

/** 参数量：HF 的 safetensors.total 是权威值；plan.paramsExtra 用来补「激活 xxB」 */
function paramsText(plan, e) {
  let total = plan.totalB;
  if (total == null && e?.totalParams) total = e.totalParams / 1e9;
  if (total == null) return plan.paramsExtra ?? '';
  const rounded = total >= 100 ? Math.round(total) : Number(total.toFixed(1));
  const label = rounded >= 1000 ? `${(rounded / 1000).toFixed(1)}T` : `${rounded}B`;
  return plan.paramsExtra ? `${label} (${plan.paramsExtra})` : label;
}

/** 上下文：config 的 max_position_embeddings 只作参考，plan.context 优先；显式写 null 表示不写这个字段 */
function contextText(plan, e) {
  if (plan.context !== undefined) return plan.context ?? '';
  const mp = e?.maxPos;
  if (!mp) return '';
  const k = mp / 1024;
  if (k >= 1024) return `${Math.round(k / 1024)}M`;
  return `${Math.round(k)}K`;
}

const LICENSE_TEXT = {
  'apache-2.0': 'Apache-2.0',
  mit: 'MIT',
  gemma: 'Gemma Terms of Use',
  'cc-by-nc-4.0': 'CC-BY-NC-4.0',
  'cc-by-nc-sa-4.0': 'CC-BY-NC-SA-4.0',
  'cc-by-4.0': 'CC-BY-4.0',
  other: null,
  llama4: 'Llama 4 Community License',
  'llama3.3': 'Llama 3.3 Community License',
  'llama3.2': 'Llama 3.2 Community License',
  'nvidia-open-model-license': 'NVIDIA Open Model License',
  'openmdw-1.1': 'OpenMDW-1.1',
  openmdw: 'OpenMDW',
  'falcon-llm-license': 'Falcon LLM License',
  'exaone-ai-model-license-1.0': 'EXAONE AI Model License 1.0',
  'lfm1.0': 'LFM Open License v1.0',
  'bigscience-openrail-m': 'BigScience OpenRAIL-M',
};

/** 仓库里的 LICENSE 文件标题（_verify/hf-licenses-all.mjs 抓的），比 HF 的 license 标识更准确 */
let licenseTitles = {};
try { licenseTitles = JSON.parse(await fs.readFile('_verify/licenses.json', 'utf8')); } catch {}

/** HF 既没有 license 标识、也没有 LICENSE 文件的条目：按家族既有口径补齐，并在 docs 里说明来源 */
const LICENSE_FALLBACK = {
  'inclusionAI/Ling-lite-1.5': 'MIT',
  'inclusionAI/Ling-flash-2.0': 'MIT',
  'inclusionAI/Ring-flash-2.0': 'MIT',
  'inclusionAI/Ling-1T': 'MIT',
  'inclusionAI/Ring-1T': 'MIT',
  'inclusionAI/Ling-3.0-flash': 'MIT',
  'stepfun-ai/Step-3.5-Flash': 'Apache-2.0',
  'stepfun-ai/Step-3.7-Flash': 'Apache-2.0',
  'XiaomiMiMo/MiMo-7B-RL': 'MIT',
  'XiaomiMiMo/MiMo-VL-7B-RL': 'MIT',
  'XiaomiMiMo/MiMo-V2-Flash': 'MIT',
  'XiaomiMiMo/MiMo-V2.5-Pro': 'MIT',
  'XiaomiMiMo/MiMo-V2.6-Pro-RL': 'MIT',
  'ByteDance-Seed/Seed-Coder-8B-Instruct': 'MIT',
  'OpenGVLab/InternVL3_5-38B': 'Apache-2.0',
  'openbmb/MiniCPM4-8B': 'Apache-2.0',
  'openbmb/MiniCPM-V-4_5': 'Apache-2.0',
  'openbmb/MiniCPM5-1B': 'Apache-2.0',
  'Tele-AI/TeleChat3-36B-Thinking': 'TeleChat 模型许可协议',
  'google/gemma-3-12b-it': 'Gemma Terms of Use',
  'google/gemma-3n-E4B-it': 'Gemma Terms of Use',
  'google/gemma-3-270m': 'Gemma Terms of Use',
  'google/medgemma-27b-it': 'Health AI Developer Foundations 条款',
  'meta-llama/Llama-4-Scout-17B-16E-Instruct': 'Llama 4 Community License',
  'nvidia/NVIDIA-Nemotron-Nano-9B-v2': 'NVIDIA Open Model License',
  'nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-FP8': 'NVIDIA Open Model License',
  'nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-BF16': 'OpenMDW-1.1',
  'ibm-granite/granite-4.0-h-1b': 'Apache-2.0',
  'ibm-granite/granite-4.1-8b': 'Apache-2.0',
  'ibm-granite/granite-4.2-30b': 'Apache-2.0',
  'allenai/OLMo-2-0325-32B-Instruct': 'Apache-2.0',
  'allenai/Olmo-3-1025-7B': 'Apache-2.0',
  'mistralai/Mistral-Small-3.2-24B-Instruct-2506': 'Apache-2.0',
  'mistralai/Magistral-Small-2506': 'Apache-2.0',
  'mistralai/Voxtral-Small-24B-2507': 'Apache-2.0',
  'mistralai/Mistral-Large-3-675B-Instruct-2512': 'Apache-2.0',
  'mistralai/Ministral-3-8B-Instruct-2512': 'Apache-2.0',
  'mistralai/Devstral-Small-2507': 'Apache-2.0',
  'tiiuae/Falcon-H1-34B-Instruct': 'Falcon LLM License',
  'tiiuae/Falcon-H1R-7B': 'Falcon LLM License',
  'HuggingFaceTB/SmolLM3-3B': 'Apache-2.0',
  'CohereLabs/tiny-aya-global': 'CC-BY-NC-4.0',
  'ai21labs/AI21-Jamba-Reasoning-3B': 'Apache-2.0',
  'CohereLabs/command-a-plus-05-2026-bf16': 'CC-BY-NC-4.0',
  'CohereLabs/North-Mini-Code-1.0': 'CC-BY-NC-4.0',
  'google/gemma-4-31B-it': 'Apache-2.0',
  'google/gemma-4-12B-it': 'Apache-2.0',
  'google/diffusiongemma-26B-A4B-it': 'Apache-2.0',
  'microsoft/Phi-4-mini-instruct': 'MIT',
  'microsoft/Phi-4-reasoning': 'MIT',
  'swiss-ai/Apertus-70B-Instruct-2509': 'Apache-2.0',
  'upstage/Solar-Open-100B': 'Upstage Solar License',
  'LGAI-EXAONE/EXAONE-4.0-32B': 'EXAONE AI Model License 1.0',
  'LGAI-EXAONE/K-EXAONE-236B-A23B': 'K-EXAONE AI Model License',
  'tencent/Hunyuan-A13B-Instruct': 'Tencent Hunyuan Community License',
  'tencent/Hy3': 'Apache-2.0',
  'tencent/Hy4-preview': 'Apache-2.0',
  'openpangu/openPangu-Ultra-MoE-718B-V1.1': 'OpenPangu Model License 1.0',
  'openpangu/openPangu-2.0-Pro': 'OpenPangu Model License 2.0',
  'moonshotai/Kimi-K2-Instruct-0905': 'Modified MIT',
  'moonshotai/Kimi-K2.7-Code': 'Modified MIT',
  'moonshotai/Kimi-K2-Instruct': 'Modified MIT',
  'moonshotai/Kimi-K2-Thinking': 'Modified MIT',
  'tiiuae/Falcon-H1-34B-Instruct': 'Falcon LLM License',
  'tiiuae/Falcon-H1R-7B': 'Falcon LLM License',
  'nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-FP8': 'NVIDIA Open Model License',
  'nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-BF16': 'NVIDIA Open Model License',
  'MiniMaxAI/MiniMax-Text-01': 'MiniMax Model License（Modified MIT）',
  'MiniMaxAI/MiniMax-VL-01': 'MiniMax Model License（Modified MIT）',
  'MiniMaxAI/MiniMax-M2': 'MiniMax Model License（Modified MIT）',
  'MiniMaxAI/MiniMax-M2.5': 'MiniMax Model License（Modified MIT）',
  'Qwen/Qwen3.8-2.4T-A95B': 'Qwen3.8-Max License',
  'deepseek-ai/DeepSeek-Prover-V2-671B': 'MIT',
  // ---- 仓库里没有 LICENSE 文件，但许可在模型卡 / 官方页面上，已人工核对 ----
  'nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16': 'NVIDIA Open Model License',
  'nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16': 'NVIDIA Open Model License',
  'nvidia/NVIDIA-Nemotron-Nano-12B-v2': 'NVIDIA Open Model License',
  'nvidia/NVIDIA-Nemotron-Nano-9B-v2-Japanese': 'NVIDIA Open Model License',
  'nvidia/Nemotron-Cascade-2-30B-A3B': 'NVIDIA Open Model License',
  'nvidia/Nemotron-Labs-Diffusion-14B': 'NVIDIA Open Model License',
  'meta-llama/Llama-4-Scout-17B-16E': 'Llama 4 Community License',
  'Qwen/Qwen3-Omni-30B-A3B-Thinking': 'Qwen 自定义许可',
  'MiniMaxAI/MiniMax-M2.1': 'MiniMax Model License（Modified MIT）',
  'MiniMaxAI/MiniMax-M2.7': 'Remix 非商业许可（Modified MIT 上加限制）',
  'apple/DiffuCoder-7B-cpGRPO': 'Apple AMLR Model License',
  'android/DiffuCoder': 'Apple AMLR Model License',
  'apple/FastVLM-7B': 'Apple AMLR Model License',
  'apple/LensVLM-9B': 'Apple AMLR Model License',
  'zyphra/ZAYA1-8B': 'Apache-2.0',
};

/** 归一化：同一份许可在不同仓库里写法不一致，列表里不要出现三种名字 */
function normalizeLicense(name) {
  if (!name) return name;
  if (/nvidia.*nemotron open model license/i.test(name)) return 'NVIDIA Open Model License';
  if (/^minimax|minimax model license/i.test(name) && !/non-commercial|remix/i.test(name)) return 'MiniMax Model License（Modified MIT）';
  if (/tencent.*(hy|hunyuan).*license/i.test(name) || /^TENCENT HY/i.test(name)) return 'Tencent Hunyuan Community License';
  if (/^qwen/i.test(name) && !/research/i.test(name)) return 'Qwen 自定义许可';
  if (/^reka edge/i.test(name)) return 'Business Source License 1.1（Reka Edge）';
  if (/exaone.*nc|EXAONE AI Model License Agreement 1\.[12] - NC/i.test(name)) return 'EXAONE AI Model License 1.1 - NC';
  if (/^exaone ai model license/i.test(name)) return 'EXAONE AI Model License 1.0';
  if (/^lfm/i.test(name)) return 'LFM Open License v1.0';
  if (/^glm/i.test(name)) return 'GLM 自定义许可';
  if (/^kimi|modified mit/i.test(name)) return 'Modified MIT';
  return name;
}

function licenseText(plan, e) {
  const repo = e?.repo;
  // plans 里的 license 若是 HF 的占位 tag（other / apple-amlr…），交给下面的推导逻辑处理
  const PLACEHOLDER = /^(other|unknown|apple-amlr)$/i;
  const fromPlan = plan.license && !PLACEHOLDER.test(plan.license) ? plan.license : null;
  if (fromPlan) return normalizeLicense(fromPlan);
  const title = repo ? licenseTitles[repo]?.first : null;
  const inline = repo ? licenseTitles[repo]?.inline : null;
  // 优先级：plans 显式写的 > 人工核对过的 fallback > LICENSE 文件标题 > LICENSE 里的标准全文 > HF 标签。
  // `Modified MIT`（Mistral）正文就是 MIT 全文，所以标题一定要排在 inline 前面。
  let fromTitle = null;
  if (title) {
    if (/^Apache License/i.test(title)) fromTitle = 'Apache-2.0';
    else if (/^Modified MIT/i.test(title)) fromTitle = 'Modified MIT';
    else if (/^MIT License/i.test(title)) fromTitle = 'MIT';
    else if (/^NON-COMMERCIAL LICENSE/i.test(title)) fromTitle = 'Remix 非商业许可（Modified MIT 上加限制）';
    else if (/OpenMDW[^\n]*version\s*([\d.]+)/i.test(title)) fromTitle = `OpenMDW-${title.match(/OpenMDW[^\n]*version\s*([\d.]+)/i)[1]}`;
    else if (/^Microsoft\.|^Copyright|^Tencent is pleased/i.test(title)) fromTitle = null; // 只是版权行
    else if (/^#/.test(title)) fromTitle = title.replace(/^#\s*/, '').split(/[:\n]/)[0].split(' / ')[0].slice(0, 60) || null;
    else fromTitle = title.split(' / ')[0].slice(0, 60);
  }
  if (repo && LICENSE_FALLBACK[repo]) {
    // fallback 是人工按许可原文写的；只有在 LICENSE 文件里出现了标准全文（Apache / MIT）时才让文件说话
    if (fromTitle === 'Apache-2.0' || fromTitle === 'MIT' || fromTitle === 'Modified MIT') return fromTitle;
    return normalizeLicense(LICENSE_FALLBACK[repo]);
  }
  if (fromTitle) return fromTitle;
  if (inline === 'Apache-2.0') return 'Apache-2.0';
  if (inline === 'MIT') return 'MIT';
  const id = (e?.license ?? '').toLowerCase();
  return normalizeLicense(LICENSE_TEXT[id] ?? e?.license ?? '');
}

function yamlList(list) {
  return `[${list.map((v) => (String(v).includes(',') || String(v).includes('(') ? `"${v}"` : v)).join(', ')}]`;
}

const warnings = [];
const written = [];
for (const { m, e } of results) {
  if (e?.err) warnings.push(`${m.slug}: HF 元数据失败 ${e.err}`);
  if (m.repo && e?.created && m.released && e.created !== m.released) {
    warnings.push(`${m.slug}: released=${m.released} 但 HF createdAt=${e.created}`);
  }
  if (m.repo && e?.gated) warnings.push(`${m.slug}: 仓库 gated（权重需申请）`);

  const released = m.released ?? e?.created;
  const params = paramsText(m, e);
  const context = contextText(m, e);
  const license = licenseText(m, e);
  // 商用判定：既有 35 条是上一轮逐条人工判的；plans 里带 `verified: true` 的条目
  // （第二批补录，许可都按 LICENSE 原文核过）直接由许可算，保证 license 与 commercial 不互相矛盾。
  const commercial = m.verified ? commercialOf(license) : m.commercial;
  if (m.verified && commercial !== m.commercial) {
    warnings.push(`${m.slug}: 商用按许可判为「${commercial}」，plans 里写的是「${m.commercial}」（已采用许可判定）`);
  }
  const tags = [...(m.tags ?? [])];
  if (!tags.some((t) => t === 'MoE' || t === 'Dense')) {
    tags.unshift(e?.experts ? 'MoE' : 'Dense');
  }
  const modalities = m.modalities ?? ['text'];
  if (modalities.includes('image') && !tags.includes('可识别图像')) {
    tags.push('可识别图像');
  }

  const lines = ['---'];
  lines.push(`title: "${m.title}"`);
  lines.push(`org: "${m.org}"`);
  if (m.family) lines.push(`family: "${m.family}"`);
  lines.push(`released: ${released}`);
  lines.push(`added: ${m.added ?? '2026-10-03'}`);
  lines.push(`summary: "${m.summary}"`);
  lines.push(`tags: ${yamlList(tags)}`);
  if (license) lines.push(`license: "${license}"`);
  lines.push(`commercial: ${commercial}`);
  if (params) lines.push(`params: "${params}"`);
  if (context) lines.push(`context: "${context}"`);
  if (m.vram) lines.push(`vram: "${m.vram}"`);
  lines.push(`modalities: ${yamlList(modalities)}`);
  const deploys = m.deploys ?? [];
  if (deploys.length) lines.push(`deploys: ${yamlList(deploys)}`);
  const links = [];
  if (m.repo) links.push(`  hf: "https://huggingface.co/${m.repo}"`);
  if (m.github) links.push(`  github: "${m.github}"`);
  if (m.paper) links.push(`  paper: "${m.paper}"`);
  if (m.demo) links.push(`  demo: "${m.demo}"`);
  if (m.docs) links.push(`  docs: "${m.docs}"`);
  lines.push('links:');
  lines.push(...links);
  lines.push('---');
  lines.push('');

  await fs.writeFile(path.join('src/content/llm', `${m.slug}.md`), lines.join('\n'), 'utf8');
  written.push(m.slug);
}

console.log(`written=${written.length}`);
if (warnings.length) {
  console.log('\n--- 告警 ---');
  for (const w of warnings) console.log(w);
}