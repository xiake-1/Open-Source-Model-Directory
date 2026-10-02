import type { APIRoute } from 'astro';
import { allEntries, COLLECTION_LABELS } from '../lib/entries';
import { formatDate } from '../lib/format';

/**
 * 站内搜索索引：静态 JSON，前端首次输入时才拉取。
 * 条目上千条也不必担心首页体积 —— 只有搜索时才请求这个文件。
 */
export const GET: APIRoute = async () => {
  const entries = await allEntries();
  const compact = entries.map((e) => ({
    t: e.title,
    o: e.org,
    h: e.href,
    c: COLLECTION_LABELS[e.collection],
    s: e.summary,
    g: e.tags,
    d: formatDate(e.released),
    // 正文去掉 Markdown 记号后截断，让搜索能命中正文里的关键词
    b: (e.body ?? '').replace(/[#*`>|\-\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400),
  }));
  return new Response(JSON.stringify(compact), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};