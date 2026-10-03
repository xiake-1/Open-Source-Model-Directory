/**
 * 标题规范化：第二批补录时 title 直接用仓库名推导，出现了一批「原始仓库名当标题」的条目
 * （全小写带连字符），以及个别与既有条目重名的。这里按 slug 覆盖成正式写法。
 */
import { readFileSync, writeFileSync } from 'node:fs';

/** slug → 正式标题 */
const TITLE_FIX = {
  'aya-vision-32b': 'Aya Vision 32B',
  'aya-vision-8b': 'Aya Vision 8B',
  'c4ai-command-a-03-2025': 'Command A（03-2025）',
  'command-a-reasoning-08-2025': 'Command A Reasoning',
  'gemma-3-4b-it': 'Gemma 3 4B',
  'gemma-4-26b-a4b': 'Gemma 4 26B A4B（基座）',
  'gemma-4-e4b-it': 'Gemma 4 E4B',
  'granite-3-2-8b-instruct': 'Granite 3.2 8B',
  'granite-3-3-8b-instruct': 'Granite 3.3 8B',
  'granite-4-1-30b': 'Granite 4.1 30B',
  'granite-4-2-8b': 'Granite 4.2 8B',
  'granite-vision-4-1-4b': 'Granite Vision 4.1 4B',
  'grok-2': 'Grok 2',
  'internlm3-8b-instruct': 'InternLM3-8B',
  'reka-edge-2603': 'Reka Edge',
  'reka-flash-3': 'Reka Flash 3',
  'mimo-v2-5-pro': 'MiMo-V2.5-Pro',
  'hunyuan-7b-instruct': 'Hunyuan-7B',
  'youtu-vl-4b-instruct': 'Youtu-VL-4B',
  'ling-3-0-flash-vl': 'Ling-3.0-flash-VL',
  'olmo-3-1125-32b': 'OLMo 3 32B（1125 基座）',
  'llama-4-scout-17b-16e': 'Llama 4 Scout（基座）',
};

/** 同名冲突的 slug → 加区分后缀（唯一需要改 slug 的情况） */
const SLUG_FIX = {
  'qwen3-vl-235b-a22b':
    '那个仓库是 Instruct 版，和既有「Qwen3-VL-235B-A22B」是同一个模型的官方名，所以把这条的 slug 改掉，避免两条同名。',
};

let changed = 0;
for (const file of readFileSync('_verify/plans.mjs', 'utf8').length ? [] : []) void file;

const src = readFileSync('_verify/plans.mjs', 'utf8');
let out = src;
for (const [slug, title] of Object.entries(TITLE_FIX)) {
  const re = new RegExp(`(slug: '${slug}',\\n    title: )"[^"]*"`);
  if (!re.test(out)) { console.log(`MISS ${slug}`); continue; }
  out = out.replace(re, `$1${JSON.stringify(title)}`);
  changed++;
}
writeFileSync('_verify/plans.mjs', out, 'utf8');
console.log(`已修正 ${changed} 个标题`);
console.log('需要人工处理的 slug 冲突：', Object.keys(SLUG_FIX).join(', ') || '(无)');