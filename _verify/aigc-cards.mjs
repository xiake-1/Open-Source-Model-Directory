/**
 * 批量抓取 HF 模型卡的 README 摘要（前 N 字符），用来人工写一句话简介时核对事实。
 * 用法：node _verify/aigc-cards.mjs repo1 repo2 ...   （仓库 ID 空格分隔）
 * 输出：终端打印 + _verify/aigc-cards.txt
 */
import fs from 'node:fs/promises';

const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
const { setGlobalDispatcher, ProxyAgent } = await import('undici').catch(() => ({}));
if (PROXY && setGlobalDispatcher && ProxyAgent) setGlobalDispatcher(new ProxyAgent(PROXY));

const LIMIT = Number(process.env.CARD_CHARS || 1100);
const repos = process.argv.slice(2);
const out = [];

for (const repo of repos) {
  let text = '';
  for (const file of ['README.md', 'model_index.json', 'config.json']) {
    if (file !== 'README.md') continue;
    try {
      const res = await fetch(`https://huggingface.co/${repo}/raw/main/${file}`, {
        headers: { 'user-agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      text = await res.text();
      break;
    } catch (err) {
      text = `!! ${err.message}`;
    }
  }
  // 去掉 YAML frontmatter，压缩空白
  const body = text.replace(/^---[\s\S]*?\n---\n/, '').replace(/\n{2,}/g, '\n').trim().slice(0, LIMIT);
  out.push(`\n########## ${repo} ##########\n${body}`);
  console.log(out[out.length - 1]);
}

await fs.writeFile('_verify/aigc-cards.txt', out.join('\n'), 'utf8');
console.log(`\nDONE ${repos.length} repos -> _verify/aigc-cards.txt`);