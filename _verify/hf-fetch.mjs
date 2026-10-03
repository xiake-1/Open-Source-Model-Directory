/**
 * 从 HuggingFace 公共 API 拉取指定机构的模型仓库元数据，作为核对「模型名 / 仓库 ID / 首次上线时间」的权威依据。
 * 用法：node _verify/hf-fetch.mjs
 * 输出：_verify/hf/<author>.json 与 _verify/hf-summary.md
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const OUT = path.resolve('_verify/hf');

const AUTHORS = [
  // 中国
  'deepseek-ai', 'Qwen', 'moonshotai', 'zai-org', 'MiniMaxAI', 'ByteDance-Seed', 'baidu',
  'inclusionAI', 'stepfun-ai', 'tencent', 'ascend', 'XiaomiMiMo', 'OpenBMB',
  'internlm', 'Tele-AI', 'Skywork', '01-ai', 'baichuan-inc', 'thu-coai', 'IDEA-Research',
  'sensenova', 'OpenDFM', 'IndexTeam', 'rednote-hilab', 'infinigence', 'Hunyuan',
  // 欧美
  'meta-llama', 'google', 'mistralai', 'openai', 'microsoft', 'nvidia', 'ibm-granite',
  'allenai', 'LiquidAI', 'CohereLabs', 'ai21labs', 'apple', 'tiiuae', 'HuggingFaceTB',
  'stabilityai', 'Zyphra', 'RWKV', 'databricks', 'LGAI-EXAONE', 'upstage', 'naver',
  'swiss-ai', 'utter-project', 'xai-org', 'amazon', 'Salesforce', 'ServiceNow',
  'togethercomputer', 'SakanaAI', 'RekaAI', 'Nexusflow', 'ZyphraAI',
];

/**
 * Node 的 fetch 不读 Windows 系统代理（NODE_USE_ENV_PROXY 只在启动时读），
 * 所以这里自己把系统代理读出来，再带它重跑一次本脚本 —— 与 scripts/check-links.mjs 同一套路。
 */
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

async function getJSON(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}

await fs.mkdir(OUT, { recursive: true });
const summary = [];

for (const author of AUTHORS) {
  const models = [];
  try {
    // 一次最多 1000 条就能覆盖一个机构的全部仓库；不要用 page= 翻页 ——
    // HF 对 `page` 与 `before` 游标都会静默重复返回同一批（曾经因此只回溯到 2025-10 就停了）。
    const url = `https://huggingface.co/api/models?author=${encodeURIComponent(author)}`
      + `&sort=createdAt&direction=-1&limit=1000&full=false`;
    const batch = await getJSON(url, 60000);
    if (Array.isArray(batch)) models.push(...batch);
  } catch (err) {
    summary.push({ author, count: 0, error: String(err.message || err) });
    continue;
  }
  const rows = models
    .filter((m) => (m.createdAt ?? '') >= '2024-12-01')
    .map((m) => ({
      id: m.id,
      createdAt: m.createdAt,
      downloads: m.downloads ?? 0,
      likes: m.likes ?? 0,
      pipeline: m.pipeline_tag ?? '',
      tags: (m.tags ?? []).filter((t) => ['text-generation', 'image-text-to-text', 'any-to-any', 'text2text-generation', 'conversational'].includes(t)),
      gated: m.gated ?? false,
    }))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  await fs.writeFile(path.join(OUT, `${author}.json`), JSON.stringify(rows, null, 1), 'utf8');
  summary.push({ author, count: rows.length, top: rows.slice(0, 3).map((r) => `${r.id}@${(r.createdAt ?? '').slice(0, 10)}`) });
  console.log(`${author}: ${rows.length}`);
}

const md = ['# HuggingFace 仓库核对结果（按机构）', '', '> 由 `_verify/hf-fetch.mjs` 生成，createdAt 为仓库创建时间。', ''];
for (const s of summary) {
  md.push(`## ${s.author}（${s.count}）`);
  if (s.error) md.push('', `- 拉取失败：${s.error}`);
  else md.push('', ...s.top.map((t) => `- ${t}`));
  md.push('');
}
await fs.writeFile('_verify/hf-summary.md', md.join('\n'), 'utf8');
console.log('\nDONE ->', OUT, PROXY ? `(proxy ${PROXY})` : '');