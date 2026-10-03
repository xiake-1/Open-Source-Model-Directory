/**
 * AIGC（生图 / 生视频）收录流水线的第一步：从 HuggingFace 公共 API 拉取候选机构与关键词的仓库元数据。
 * 用法：node _verify/aigc-fetch.mjs
 * 输出：_verify/hf-aigc/<author>.json（每个仓库的 createdAt / likes / downloads / pipeline_tag）+ _verify/hf-aigc-summary.md
 *
 * 与 `hf-fetch.mjs` 同一套路：Node 的 fetch 不读 Windows 系统代理，这里自己读出来挂上 ProxyAgent。
 * 同样是 `limit=1000` 一次拉全 —— `page=` 与 `before=` 游标会静默重复返回同一批。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const OUT = path.resolve('_verify/hf-aigc');

/** 生图 / 生视频的主要发布方（按官方 HF 组织名） */
const AUTHORS = [
  // 生图
  'black-forest-labs', 'stabilityai', 'Qwen', 'HiDream-ai', 'zai-org', 'ByteDance-Seed',
  'Hunyuan', 'tencent', 'nvidia', 'microsoft', 'Kwai-Kolors', 'kwai-kling', 'Salesforce',
  'google', 'Shakker-Labs', 'lodestones', 'Alpha-VLLM', 'Sana', 'Efficient-Large-Model',
  'OmniGen', 'VectorSpaceLab', 'featherless-ai', 'openfree', 'rednote-hilab', 'baidu',
  'stepfun-ai', 'OpenBMB', 'Skywork', 'xAI', 'meta', 'Meta', 'Sony', 'Adobe', 'Radiant',
  // 生视频
  'Wan-AI', 'Lightricks', 'genmo', 'hpcaitech', 'ali-vilab', 'THUDM', 'Open-Sora',
  'Video-Crafter', 'PKU-YuanGroup', 'TIGER-Lab', 'IndexTeam', 'FramePack', 'lllyasviel',
  'Seaweed-ai', 'KlingAI', 'inclusionAI', 'AIDC-AI', 'Ruyi', 'microsoft', 'nvidia',
  'Sana', 'SkyReels', 'SkyworkAI', 'stepfun-ai', 'meituan-longcat', 'LongCat',
];

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
      const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
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

for (const author of [...new Set(AUTHORS)]) {
  const models = [];
  try {
    const url = `https://huggingface.co/api/models?author=${encodeURIComponent(author)}`
      + `&sort=createdAt&direction=-1&limit=1000&full=false`;
    const batch = await getJSON(url);
    if (Array.isArray(batch)) models.push(...batch);
  } catch (err) {
    summary.push({ author, count: 0, error: String(err.message || err) });
    console.log(`${author}: FAIL ${err.message || err}`);
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
      library: m.library_name ?? '',
      gated: m.gated ?? false,
      tags: (m.tags ?? []).filter((t) => typeof t === 'string' && !t.includes(':') && t.length < 40).slice(0, 12),
    }))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  await fs.writeFile(path.join(OUT, `${author}.json`), JSON.stringify(rows, null, 1), 'utf8');
  summary.push({ author, count: rows.length, top: rows.slice(0, 3).map((r) => `${r.id}@${(r.createdAt ?? '').slice(0, 10)}`) });
  console.log(`${author}: ${rows.length}`);
}

const md = ['# HuggingFace AIGC 仓库核对结果（按机构）', '', '> 由 `_verify/aigc-fetch.mjs` 生成，createdAt 为仓库创建时间。', ''];
for (const s of summary) {
  md.push(`## ${s.author}（${s.count}）`);
  if (s.error) md.push('', `- 拉取失败：${s.error}`);
  else md.push('', ...s.top.map((t) => `- ${t}`));
  md.push('');
}
await fs.writeFile('_verify/hf-aigc-summary.md', md.join('\n'), 'utf8');
console.log('\nDONE ->', OUT, PROXY ? `(proxy ${PROXY})` : '(no proxy)');