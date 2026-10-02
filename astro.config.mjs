// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 站点域名：canonical、sitemap、RSS、robots.txt 全部取自它，改这一处即可。
// 取值优先级（部署到 Cloudflare Pages 时不用改代码）：
//   1. SITE_URL        —— 你自己在 Pages 环境变量里设的正式域名（绑自定义域名后推荐用这个）
//   2. CF_PAGES_URL    —— Cloudflare Pages 构建时自动注入，本仓库默认就靠它
//   3. 下面的兜底值     —— 本地构建 / 其他平台使用
const FALLBACK_SITE = 'https://open-source-model-directory.pages.dev';
export const SITE = (process.env.SITE_URL || process.env.CF_PAGES_URL || FALLBACK_SITE).replace(/\/+$/, '');

export default defineConfig({
  site: SITE,
  // 纯静态输出，不需要任何 adapter —— Cloudflare Pages 直接托管 dist/
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-dark' },
  },
});