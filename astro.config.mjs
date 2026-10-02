// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// TODO: 换成你自己的域名（部署到 Cloudflare Pages 前必须改，否则 sitemap/RSS 里的链接是错的）
export const SITE = 'https://example.com';

export default defineConfig({
  site: SITE,
  // 纯静态输出，不需要任何 adapter —— Cloudflare Pages 直接托管 dist/
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-dark' },
  },
});