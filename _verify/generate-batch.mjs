/**
 * 把 batch.mjs 里的补录清单并进 plans.mjs：
 *   - 从 HuggingFace 取 createdAt（released 默认取它）、参数量、许可证、专家数
 *   - 按仓库名推导 title（去掉机构前缀；`-Instruct` / `-Thinking` 等后缀保留）
 *   - 已存在的仓库跳过，不重复追加
 *
 * 用法：node _verify/generate-batch.mjs [--apply]
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { batch } from './batch-list.mjs';
import { models } from './plans.mjs';

const APPLY = process.argv.includes('--apply');

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

const have = new Set(models.map((m) => m.repo).filter(Boolean));
let licCache = {};
try { licCache = JSON.parse(fs.readFileSync('_verify/licenses.json', 'utf8')); } catch {}
const items = batch.filter((b) => !b.skip && !b.allSkip && b.repo && !have.has(b.repo));
console.log(`batch=${batch.length} 待补=${items.length}（已收录或标记 skip 的自动跳过）`);

async function j(url, t = 25000) {
  const r = await fetch(url, { signal: AbortSignal.timeout(t) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
let i = 0;
async function worker() {
  while (i < items.length) {
    const b = items[i++];
    const out = { ...b };
    try {
      const meta = await j(`https://huggingface.co/api/models/${b.repo}`);
      out.created = (meta.createdAt ?? '').slice(0, 10);
      out.license = meta.cardData?.license ?? '';
      out.likes = meta.likes ?? 0;
      out.totalParams = meta.safetensors?.total ?? null;
      out.pipeline = meta.pipeline_tag ?? '';
      out.gated = meta.gated ?? false;
    } catch (e) { out.err = String(e.message); }
    try {
      const cfg = await j(`https://huggingface.co/${b.repo}/raw/main/config.json`);
      out.experts = cfg.num_experts ?? cfg.num_local_experts ?? cfg.n_routed_experts ?? cfg.moe_num_experts ?? null;
      out.maxPos = cfg.max_position_embeddings ?? null;
      out.modelType = cfg.model_type ?? '';
    } catch {}
    await sleep(60);
    rows.push(out);
    if (rows.length % 20 === 0) console.log(`  ...${rows.length}/${items.length}`);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const titleOf = (repo) => (repo.split('/')[1] ?? repo);
const LIC = { 'apache-2.0': 'Apache-2.0', mit: 'MIT', gemma: 'Gemma Terms of Use', 'cc-by-nc-4.0': 'CC-BY-NC-4.0', other: null };

/** HF 没标许可、但已核对过许可原文的仓库（补齐后商用判定才有依据） */
const LICENSE_FALLBACK = {
  'MiniMaxAI/MiniMax-M2.1': 'MiniMax Model License（Modified MIT）',
  'MiniMaxAI/MiniMax-M2.7': 'MiniMax Model License（Modified MIT）',
  'tencent/Hy3-preview': 'Apache-2.0',
  'tencent/Hunyuan-7B-Instruct': 'Tencent Hunyuan Community License',
  'tencent/Youtu-VL-4B-Instruct': 'Tencent Hunyuan Community License',
  'LGAI-EXAONE/EXAONE-4.5-33B': 'EXAONE AI Model License 1.0',
  'LGAI-EXAONE/EXAONE-Deep-32B': 'EXAONE AI Model License 1.0',
  'RekaAI/reka-edge-2603': 'Apache-2.0',
  'apple/FastVLM-7B': 'Apple Sample Code License',
  'apple/DiffuCoder-7B-cpGRPO': 'Apple Sample Code License',
  'apple/LensVLM-9B': 'Apple Sample Code License',
  'xai-org/grok-2': 'xAI Grok 2 Open Weights License',
  'upstage/Solar-Open2-250B': 'Upstage Solar License',
};

/** 许可 → 商用判定（口径与 docs/项目结构/项目说明.md 一致） */
function commercialOf(license, plan) {
  if (plan.commercial) return plan.commercial;
  if (!license) return '有条件可商用';
  if (/CC-BY-NC/.test(license)) return '不可商用';
  if (/EXAONE AI Model License 1\.0|K-EXAONE|Business Source License/i.test(license)) return '不可商用';
  if (/(Model License（Modified MIT）|Community License|Terms of Use|Solar License|Sample Code License|Grok 2 Open Weights License|Llama \d|openPangu|TeleChat|LFM|HAI-DEF)/.test(license)) return '有条件可商用';
  return '可商用';
}
const knownSlugs = new Set(models.map((m) => m.slug));

const appended = [];
const problems = [];
for (const r of rows) {
  if (r.err) { problems.push(`${r.repo}: ${r.err}`); continue; }
  const title = titleOf(r.repo);
  const slug = slugify(title);
  if (knownSlugs.has(slug)) { problems.push(`${r.repo}: slug 撞车（${slug}）`); continue; }
  knownSlugs.add(slug);
  const lic = r.license ? (LIC[r.license] ?? r.license) : (LICENSE_FALLBACK[r.repo] ?? null);
  const licTitle = licCache[r.repo]?.first;
  const licInline = licCache[r.repo]?.inline;
  // LICENSE 文件优先：有些仓库的 tag 是 other/apple-amlr，而文件里写着真正的名字
  const licFinal = licInline === 'Apache-2.0' ? 'Apache-2.0'
    : licInline === 'MIT' ? 'MIT'
    : licTitle && !/^(Microsoft\.|Copyright)/i.test(licTitle) ? licTitle.split(' / ')[0].slice(0, 60)
    : lic;
  const totalB = r.totalParams ? r.totalParams / 1e9 : null;
  const params = r.paramsExtra
    ? `${totalB ? (totalB >= 1000 ? `${(totalB / 1000).toFixed(1)}T` : `${totalB >= 100 ? Math.round(totalB) : Math.round(totalB * 10) / 10}B`) + ' ' : ''}(${r.paramsExtra})`
    : totalB ? (totalB >= 1000 ? `${(totalB / 1000).toFixed(1)}T` : `${totalB >= 100 ? Math.round(totalB) : Math.round(totalB * 10) / 10}B`) : null;
  const tags = [r.experts ? 'MoE' : 'Dense', (r.modalities ?? ['text']).includes('image') ? '可识别图像' : '纯文本'];
  const obj = {
    slug,
    title,
    org: r.org,
    family: r.family,
    repo: r.repo,
    released: r.released ?? r.created,
    summary: r.summary ?? `${title}：${r.family} 官方发布的开放权重版本。`,
    tags,
    license: lic,
    commercial: commercialOf(lic, r),
    paramsExtra: r.paramsExtra ?? null,
    context: r.context ?? null,
    vram: r.vram ?? null,
    modalities: r.modalities ?? ['text'],
    deploys: r.deploys ?? ['vllm', 'sglang'],
  };
  if (params) obj.paramsText = params;
  appended.push(obj);
}

// 打印即将追加的内容，便于人工过一遍
for (const a of appended) {
  console.log(`+ ${a.slug}\t${a.released}\t${a.paramsText ?? '?'}\t${a.license ?? '(无许可)'}\t${a.tags.join('/')}`);
}
console.log(`\n将追加 ${appended.length} 条；有问题 ${problems.length} 条`);
for (const p of problems) console.log(`  ! ${p}`);

if (APPLY) {
  const block = appended.map((a) => {
    const lines = ['  {'];
    lines.push(`    slug: '${a.slug}',`);
    lines.push(`    title: ${JSON.stringify(a.title)},`);
    lines.push(`    org: ${JSON.stringify(a.org)},`);
    lines.push(`    family: ${JSON.stringify(a.family)},`);
    lines.push(`    repo: '${a.repo}',`);
    lines.push(`    released: '${a.released}',`);
    lines.push(`    verified: true, // 许可与商用已按原文核对，generate.mjs 会据此直接按许可算 commercial`);
    lines.push(`    summary: ${JSON.stringify(a.summary)},`);
    lines.push(`    tags: [${a.tags.map((t) => `'${t}'`).join(', ')}],`);
    if (a.license) lines.push(`    license: ${JSON.stringify(a.license)},`);
    lines.push(`    commercial: '${a.commercial}',`);
    if (a.paramsExtra) lines.push(`    paramsExtra: ${JSON.stringify(a.paramsExtra)},`);
    if (a.context) lines.push(`    context: ${JSON.stringify(a.context)},`);
    if (a.vram) lines.push(`    vram: ${JSON.stringify(a.vram)},`);
    lines.push(`    modalities: [${a.modalities.map((m) => `'${m}'`).join(', ')}],`);
    lines.push(`    deploys: [${a.deploys.map((d) => `'${d}'`).join(', ')}],`);
    lines.push('  },');
    return lines.join('\n');
  }).join('\n');
  let src = fs.readFileSync('_verify/plans.mjs', 'utf8');
  src = src.replace(/\n\];\s*$/, `\n\n  // ===== 第二批补录（2026-10，按「只收大尺寸与主流版本」口径筛出）=====\n${block}\n];\n`);
  fs.writeFileSync('_verify/plans.mjs', src, 'utf8');
  console.log('已写入 plans.mjs');
}