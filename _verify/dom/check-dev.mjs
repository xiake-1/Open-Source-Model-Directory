/** 对**运行中的 dev server** 做一次真实过滤验证：勾「所属 = Qwen」看剩下几条。 */
import { JSDOM } from 'jsdom';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const URL = process.env.CHECK_URL ?? 'http://localhost:4321/llm/models/';
const html = await (await fetch(URL)).text();
const cards = (html.match(/class="entry"/g) ?? []).length;
console.log(`dev server 返回卡片：${cards}`);

// 期望值来自内容文件
const CONTENT = resolve(HERE, '../../src/content/llm');
let qwen = 0;
let total = 0;
for (const f of readdirSync(CONTENT).filter((x) => x.endsWith('.md'))) {
  const t = readFileSync(`${CONTENT}/${f}`, 'utf8');
  total++;
  if (/^family: "Qwen"$/m.test(t)) qwen++;
}
console.log(`内容文件：共 ${total} 条，其中 Qwen ${qwen} 条`);

// dev 模式下脚本是 module 且带 import，jsdom 跑不了；这里改为直接数卡片上的 data-tags 里的 Qwen
const qwenCards = [...html.matchAll(/data-released="[^"]*" data-tags="([^"]*)"/g)].filter((m) => m[1].split('|').includes('Qwen')).length;
console.log(`HTML 里打上 Qwen 标签的卡片：${qwenCards}`);
// 卡片标题是否唯一（重名会让「某某只显示几条」这种直觉判断失真）
const titles = [...html.matchAll(/class="entry-title"[^>]*>([^<]+)</g)].map((m) => m[1]);
const dup = titles.filter((t, i) => titles.indexOf(t) !== i);
console.log(`卡片标题重复的：${dup.length ? [...new Set(dup)].join('、') : '无'}`);

const ok = cards === total && qwenCards === qwen && dup.length === 0;
console.log(ok ? '\n✓ dev server 的数据与内容文件一致，且标题无重复' : '\n✗ 有不一致之处');
process.exit(ok ? 0 : 1);