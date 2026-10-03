#!/usr/bin/env node
/**
 * 新增一条收录：交互式问答，生成带完整 frontmatter 的 Markdown 文件。
 *
 *   pnpm new llm "Qwen3-235B-A22B"
 *   pnpm new aigc "FLUX.2" flux-2 --dry-run
 *   pnpm new projects "Strata" strata
 *
 * 需要终端交互（不支持用管道喂答案）。要批量生成请直接 import scripts/lib/entry-file.mjs。
 * 这里的校验和 src/content.config.ts 的 schema 一致，让你在写文件之前就发现漏填。
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { slugify, yamlStr, buildEntryFile, validate, LINK_KEYS } from './lib/entry-file.mjs';

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT = process.cwd();

/**
 * 标签与部署类型的枚举定义在 src/lib/taxonomy.ts（页面和 schema 都从那里取）。
 * 这里直接解析那个文件，避免两边各存一份、改了一处忘了另一处。
 * 解析失败时只影响提示与过滤，不阻塞新增条目。
 */
async function readTaxonomy() {
  const file = path.join(ROOT, 'src/lib/taxonomy.ts');
  let source = '';
  try {
    source = await readFile(file, 'utf8');
  } catch {
    console.warn(`[提示] 读不到 ${file}，标签提示会缺失（不影响写入）。`);
    return {};
  }
  const parse = (name) => {
    const match = source.match(new RegExp(`export const ${name}\\s*=\\s*\\[([^\\]]*)\\]`));
    if (!match) return [];
    return match[1]
      .split(',')
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  };
  return {
    llm: parse('LLM_TAGS'),
    aigc: parse('AIGC_TAGS'),
    deployKinds: parse('DEPLOY_KINDS'),
    commercial: parse('COMMERCIAL_VALUES'),
  };
}

const TAXONOMY = await readTaxonomy();
if (TAXONOMY.llm?.length === 0 || TAXONOMY.deployKinds?.length === 0) {
  console.warn('[提示] 没能从 src/lib/taxonomy.ts 解析出标签枚举，将不校验标签。');
}

const COLLECTIONS = {
  llm: {
    dir: 'src/content/llm',
    label: 'LLM（语言模型）',
    linkKeys: ['hf', 'github', 'paper', 'demo', 'docs'],
    // 标签是固定枚举，写错会被 schema 拒绝
    tagChoices: TAXONOMY.llm ?? [],
    // 是否可商用也是固定枚举（schema 里是必填），左侧「商用」筛选就看它
    commercialChoices: TAXONOMY.commercial ?? [],
    modalities: ['text', 'image', 'audio', 'code'],
  },
  aigc: {
    dir: 'src/content/aigc',
    label: 'AIGC（生图 / 生视频模型）',
    linkKeys: ['hf', 'github', 'paper', 'demo', 'docs'],
    tagChoices: TAXONOMY.aigc ?? [],
    commercialChoices: TAXONOMY.commercial ?? [],
    outputs: ['image', 'video'],
  },
  projects: {
    dir: 'src/content/projects',
    label: '社区项目',
    // 页面上的卡片只展示 HuggingFace 与 GitHub，所以这里也只问这两个
    linkKeys: ['github', 'hf'],
    tagChoices: [],
  },
  deploy: {
    dir: 'src/content/deploy',
    label: '部署方式（和 LLM 相关）',
    linkKeys: ['github', 'hf', 'paper', 'docs'],
    tagChoices: [],
    kinds: TAXONOMY.deployKinds ?? [],
  },
};

if (!stdin.isTTY) {
  console.error('这个脚本需要在终端里交互运行（当前 stdin 不是终端，没法提问）。');
  console.error('要批量生成条目，请 import scripts/lib/entry-file.mjs 里的 buildEntryFile()。');
  process.exit(2);
}

const rl = createInterface({ input: stdin, output: stdout });
// stdin 一旦结束，等待中的 question 永远不会 resolve，Node 会静默退出并丢掉后续输出。
// 用这个 promise 把它变成一条明确的报错。
const eof = new Promise((_, reject) => rl.once('close', () => reject(new Error('STDIN_CLOSED'))));

async function ask(question, { def = '', required = false, choices = null, validate: check = null } = {}) {
  for (;;) {
    const hint = choices ? `（${choices.join(' / ')}）` : '';
    const suffix = def ? ` [${def}]` : '';
    let raw;
    try {
      raw = await Promise.race([rl.question(`${question}${hint}${suffix}: `), eof]);
    } catch {
      console.error('\n输入流已结束，无法继续。');
      process.exit(2);
    }
    const answer = (raw ?? '').trim() || def;
    if (required && !answer) {
      console.log('  ↳ 必填，请再输一次');
      continue;
    }
    if (answer && choices && !choices.includes(answer)) {
      console.log(`  ↳ 只能是 ${choices.join(' / ')} 之一`);
      continue;
    }
    if (answer && check) {
      const err = check(answer);
      if (err) {
        console.log(`  ↳ ${err}`);
        continue;
      }
    }
    return answer;
  }
}

const today = () => new Date().toISOString().slice(0, 10);
const isDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? null : '日期格式必须是 YYYY-MM-DD');
const splitList = (v) =>
  v
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);

async function listSlugs(dir) {
  try {
    const files = await readdir(path.join(ROOT, dir));
    return files.filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}

async function main() {
  console.log('新增收录条目 —— 直接回车用默认值，Ctrl+C 放弃\n');

  let [collection, title, slugArg] = process.argv.slice(2).filter((a) => a !== '--dry-run');

  if (!collection) {
    collection = await ask('集合', { required: true, choices: Object.keys(COLLECTIONS) });
  }
  if (!COLLECTIONS[collection]) {
    console.error(`未知集合 "${collection}"，只能是 ${Object.keys(COLLECTIONS).join(' / ')}`);
    process.exit(1);
  }
  const meta = COLLECTIONS[collection];

  title = title || (await ask('名称（模型名 / 项目名）', { required: true }));
  const slug = slugArg || slugify(title) || (await ask('文件名 slug（用于 URL）', { required: true }));
  if (/[\u4e00-\u9fa5]/.test(slug)) {
    console.log(`  ↳ 注意：slug 含中文，URL 会被百分号编码，建议改成英文（当前：${slug}）`);
  }

  const org = await ask('发布方（机构 / 团队）', { required: true });
  const family = await ask('所属（家族 / 公司，例如 Qwen / Meta / DeepSeek）', { def: '' });
  const released = await ask('首次公开发布日期', { def: today(), validate: isDate });
  const added = await ask('收录日期', { def: today(), validate: isDate });
  const summary = await ask('一句话简介', {
    required: true,
    validate: (v) => (v.length >= 10 ? null : '至少 10 个字：说清"是什么 + 凭什么值得看"'),
  });
  const tags = meta.tagChoices.length
    ? splitList(
        await ask(`标签（固定可选：${meta.tagChoices.join(' / ')}，逗号分隔）`, { def: '' })
      ).filter((t) => {
        const ok = meta.tagChoices.includes(t);
        if (!ok) console.log(`  ↳ 忽略非法标签 "${t}"（不在枚举里，否则构建会失败）`);
        return ok;
      })
    : [];
  const license = await ask('许可证', { def: '' });
  // LLM / AIGC 的 commercial 是 schema 必填项，漏了构建会失败，所以在这里就问清楚
  const commercial = meta.commercialChoices?.length
    ? await ask('是否可商用', { required: true, choices: meta.commercialChoices })
    : '';

  console.log('\n链接（至少填一个）：');
  const links = {};
  for (const key of meta.linkKeys) {
    const url = await ask(`  ${key}`, { def: '' });
    if (url) links[key] = url;
  }

  const extra = [];
  if (family) extra.push(['family', yamlStr(family)]);
  if (commercial) extra.push(['commercial', yamlStr(commercial)]);

  if (collection === 'llm') {
    const params = await ask('参数量', { def: '' });
    const context = await ask('上下文长度', { def: '' });
    const vram = await ask('硬件要求', { def: '' });
    const modalities = splitList(await ask('模态（逗号分隔）', { def: 'text' })).filter((m) =>
      meta.modalities.includes(m)
    );
    if (params) extra.push(['params', yamlStr(params)]);
    if (context) extra.push(['context', yamlStr(context)]);
    if (vram) extra.push(['vram', yamlStr(vram)]);
    extra.push(['modalities', `[${modalities.map(yamlStr).join(', ')}]`]);
  }

  if (collection === 'aigc') {
    const output = await ask('输出类型', { required: true, choices: meta.outputs, def: 'image' });
    const architecture = await ask('架构', { def: '' });
    const params = await ask('参数量', { def: '' });
    const vram = await ask('推荐显存', { def: '' });
    extra.push(['output', yamlStr(output)]);
    if (architecture) extra.push(['architecture', yamlStr(architecture)]);
    if (params) extra.push(['params', yamlStr(params)]);
    if (vram) extra.push(['vram', yamlStr(vram)]);
  }

  if (collection === 'projects') {
    const shape = await ask('项目形态（例如 推理加速 / KV cache 压缩）', { def: '' });
    if (shape) extra.push(['params', yamlStr(shape)]);
  }

  if (collection === 'deploy') {
    const kind = await ask('方案类型', { required: true, choices: meta.kinds });
    const supports = splitList(await ask('支持什么（逗号分隔）', { def: '' }));
    const pain = await ask('上手难点', { def: '' });
    extra.push(['kind', yamlStr(kind)]);
    if (supports.length) extra.push(['supports', `[${supports.map(yamlStr).join(', ')}]`]);
    if (pain) extra.push(['pain', yamlStr(pain)]);
  }

  // 模型可以关联部署方式（schema 里是 reference，写错 slug 会直接构建失败，所以这里先过滤）
  if (collection !== 'deploy') {
    const deploySlugs = await listSlugs(COLLECTIONS.deploy.dir);
    if (deploySlugs.length) {
      const refs = splitList(await ask('关联的部署方式（可选，逗号分隔）', { def: '' }));
      const bad = refs.filter((r) => !deploySlugs.includes(r));
      if (bad.length) console.log(`  ↳ 这些 slug 在 src/content/deploy 里不存在，已忽略：${bad.join(', ')}`);
      const good = refs.filter((r) => deploySlugs.includes(r));
      if (good.length) extra.push(['deploys', `[${good.map(yamlStr).join(', ')}]`]);
    }
  }

  const fields = { title, org, released, added, summary, tags, license, extra, links };
  const problem = validate(fields);
  if (problem) {
    console.error(`\n校验失败：${problem}`);
    process.exit(1);
  }

  const content = buildEntryFile({
    ...fields,
    // 模型页的正文已经精简掉了，只有社区项目与部署方式还写正文
    withBody: collection === 'projects' || collection === 'deploy',
  });
  const file = path.join(ROOT, meta.dir, `${slug}.md`);

  if (DRY_RUN) {
    console.log(`\n[dry-run] 将会写入 ${file}\n`);
    console.log(content);
  } else {
    await mkdir(path.join(ROOT, meta.dir), { recursive: true });
    await writeFile(file, content, { flag: 'wx' }).catch((err) => {
      if (err.code === 'EEXIST') {
        console.error(`\n${file} 已存在。换一个 slug，或直接编辑原文件。`);
        process.exit(1);
      }
      throw err;
    });
    console.log(`\n已创建 ${file}\n下一步：pnpm dev 看效果，然后 git commit && git push。`);
  }

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});