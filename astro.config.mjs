// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 站点域名：canonical、sitemap、RSS、robots.txt 全部取自它，改这一处即可。
// 取值优先级（部署到 Cloudflare Pages 时不用改代码）：
//   1. SITE_URL        —— 你自己在 Pages 环境变量里设的正式域名（绑自定义域名后推荐用这个）
//   2. CF_PAGES_URL    —— Cloudflare Pages 构建时自动注入，本仓库默认就靠它
//   3. 下面的兜底值     —— 本地构建 / 其他平台使用
const FALLBACK_SITE = 'https://open-source-model-directory.pages.dev';
const FROM_ENV = process.env.SITE_URL || process.env.CF_PAGES_URL;
export const SITE = (FROM_ENV || FALLBACK_SITE).replace(/\/+$/, '');

// Workers Builds 不会注入部署地址（只有 WORKERS_CI / WORKERS_CI_BRANCH），
// 所以第一次部署后请把 SITE_URL 补上，否则 canonical / sitemap / RSS 会停在兜底域名上。
if (process.env.WORKERS_CI && !process.env.SITE_URL) {
  console.warn(
    `\n[site] 提示：本次构建没有拿到 SITE_URL，canonical / sitemap / RSS 将使用 ${FALLBACK_SITE}\n` +
      `[site] 拿到部署地址后，在 Cloudflare → 该 Worker → Settings → Build → Variables and Secrets 添加\n` +
      `[site]   SITE_URL = https://你的域名\n` +
      `[site] 然后 Retry deployment 即可。\n`
  );
}

export default defineConfig({
  site: SITE,
  // 纯静态输出，不需要任何 adapter —— Cloudflare Pages 直接托管 dist/
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-dark' },
  },
});