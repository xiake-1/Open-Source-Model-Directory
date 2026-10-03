/**
 * 校验 license 与 commercial 是否自洽，并把两者的分布打出来供人工抽查。
 *
 * 判定口径（与 docs/项目结构/项目说明.md 的「商用怎么判」一节一致）：
 * - 标「可商用」：Apache-2.0 / MIT，以及核对过原文、没有商用门槛的宽松自定义许可
 *   （Falcon LLM License、NVIDIA Open Model License、OpenMDW、MiniMax 2025-01 版模型许可）。
 * - 标「不可商用」：CC-BY-NC-4.0（Cohere）、EXAONE 的 NC 许可。
 * - 标「有条件可商用」：自定义协议里带门槛的 —— Gemma Terms、Llama 4 Community License、
 *   Qwen / GLM-5.3 / Kimi 的 Modified MIT（月活或 MaaS 收入门槛）、Hunyuan-A13B 社区许可、
 *   openPangu（禁止在欧盟使用）、TeleChat / Upstage Solar / LFM / HAI-DEF 等。
 */
import { readFileSync, readdirSync } from 'node:fs';

const LENIENT = ['Apache-2.0', 'MIT'];
const PERMISSIVE_CUSTOM = /^(Falcon LLM License|NVIDIA Open Model License|OpenMDW-[\d.]+|MiniMax Model License（Modified MIT）)$/;
const NONCOMMERCIAL = /(CC-BY-NC|EXAONE AI Model License 1\.0|K-EXAONE AI Model License)/;
/** 名字里像自定义许可的写法；用来发现"带条款却标了可商用"的漏网条目 */
const LOOKS_CUSTOM = /(License|LICENSE|协议|条款|Terms)/;

let bad = 0;
const byCommercial = new Map();
for (const f of readdirSync('src/content/llm').filter((x) => x.endsWith('.md'))) {
  const txt = readFileSync(`src/content/llm/${f}`, 'utf8');
  const lic = txt.match(/^license: "(.*)"$/m)?.[1] ?? '(无)';
  const com = txt.match(/^commercial: (.*)$/m)?.[1] ?? '(无)';
  if (!byCommercial.has(com)) byCommercial.set(com, new Map());
  const m = byCommercial.get(com);
  m.set(lic, (m.get(lic) ?? 0) + 1);

  const issues = [];
  if (LENIENT.includes(lic) && com !== '可商用') issues.push(`宽松许可标成了 ${com}`);
  if (NONCOMMERCIAL.test(lic) && com !== '不可商用') issues.push('非商业许可却不是「不可商用」');
  if (LOOKS_CUSTOM.test(lic) && !PERMISSIVE_CUSTOM.test(lic) && !NONCOMMERCIAL.test(lic) && com === '可商用') {
    issues.push('带条款的许可却标了「可商用」（需核对原文或改判）');
  }
  if (issues.length) {
    bad++;
    console.log(`⚠ ${f.replace('.md', '')}: license=${lic} commercial=${com} → ${issues.join('；')}`);
  }
}

console.log(`\n不自洽 ${bad} 条 / ${[...byCommercial.values()].reduce((n, m) => n + [...m.values()].reduce((a, b) => a + b, 0), 0)} 条\n`);
for (const [com, m] of byCommercial) {
  console.log(`== ${com} ==`);
  for (const [lic, n] of [...m.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${n}\t${lic}`);
}