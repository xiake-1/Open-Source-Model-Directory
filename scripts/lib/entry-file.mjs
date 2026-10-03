/**
 * 条目文件的纯函数部分：不含任何交互。
 * 被 scripts/new-entry.mjs 调用，也可以直接在脚本里 import 用来批量生成条目。
 */

/** links 里允许出现的键（页面上的卡片只展示 hf / github，其余键留在详情页） */
export const LINK_KEYS = ['hf', 'github', 'paper', 'demo', 'docs'];

/** 生成文件名 slug：保留 ASCII 与中文，其余字符变连字符 */
export function slugify(input) {
  return input
    .toLowerCase()
    .replace(/['"’]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** YAML 字符串一律加双引号，省得被冒号、井号、前导短横线坑到 */
export function yamlStr(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * @param {object} fields
 * @param {string} fields.title
 * @param {string} fields.org
 * @param {string} fields.released   YYYY-MM-DD
 * @param {string} fields.added      YYYY-MM-DD
 * @param {string} fields.summary
 * @param {string[]} [fields.tags]
 * @param {string} [fields.license]
 * @param {[string, string][]} [fields.extra]  集合专属字段：[键, 已序列化的 YAML 值]
 * @param {Record<string, string>} [fields.links]
 * @param {boolean} [fields.withBody]  是否带正文骨架。LLM / AIGC 的详情页不留正文，传 false
 * @returns {string} 完整的 Markdown 文件内容
 */
export function buildEntryFile({
  title,
  org,
  released,
  added,
  summary,
  tags = [],
  license,
  extra = [],
  links = {},
  withBody = true,
}) {
  const lines = [
    '---',
    `title: ${yamlStr(title)}`,
    `org: ${yamlStr(org)}`,
    `released: ${released}`,
    `added: ${added}`,
    `summary: ${yamlStr(summary)}`,
    `tags: [${tags.map(yamlStr).join(', ')}]`,
  ];
  if (license) lines.push(`license: ${yamlStr(license)}`);
  for (const [key, value] of extra) lines.push(`${key}: ${value}`);
  lines.push('links:');
  for (const [key, url] of Object.entries(links)) lines.push(`  ${key}: ${yamlStr(url)}`);
  lines.push('---');
  if (!withBody) return lines.join('\n');
  lines.push(
    '',
    '## 为什么值得看',
    '',
    '（写清楚它解决了什么问题、和同类相比强在哪）',
    '',
    '## 上手要点',
    '',
    '- ',
    ''
  );
  return lines.join('\n');
}

/** 与 src/content.config.ts 的 schema 对齐的最小校验，返回错误信息或 null */
export function validate({ title, org, released, added, summary, links }) {
  if (!title) return 'title 必填';
  if (!org) return 'org 必填';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(released)) return 'released 必须是 YYYY-MM-DD';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(added)) return 'added 必须是 YYYY-MM-DD';
  if (!summary || summary.length < 10) return 'summary 至少 10 个字';
  if (!Object.values(links).some(Boolean)) return 'links 至少要有一个链接';
  for (const [key, url] of Object.entries(links)) {
    if (url && !/^https?:\/\//.test(url)) return `links.${key} 必须以 http(s):// 开头`;
  }
  return null;
}