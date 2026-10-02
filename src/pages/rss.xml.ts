import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { allEntries, COLLECTION_LABELS } from '../lib/entries';
import { SITE_TITLE, SITE_DESC } from '../lib/site';

export async function GET(context: APIContext) {
  const entries = await allEntries();
  return rss({
    title: SITE_TITLE,
    description: SITE_DESC,
    site: context.site ?? 'https://example.com',
    // 用"收录时间"而不是发布时间：订阅者关心的是"这个站又更新了什么"
    items: entries
      .slice()
      .sort((a, b) => b.added.getTime() - a.added.getTime())
      .slice(0, 50)
      .map((entry) => ({
        title: `[${COLLECTION_LABELS[entry.collection]}] ${entry.title}`,
        description: entry.summary,
        link: entry.href,
        pubDate: entry.added,
        categories: entry.tags,
      })),
    customData: '<language>zh-cn</language>',
  });
}