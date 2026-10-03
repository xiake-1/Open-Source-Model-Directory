// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 站点域名：canonical、sitemap、RSS、robots.txt 全部取自它，改这一处即可。
// 取值优先级（部署到 Cloudflare Pages 时不用改代码）：
//   1. SITE_URL        —— 你自己在 Pages 环境变量里设的正式域名（绑自定义域名后推荐用这个）
//   2. CF_PAGES_URL    —— Cloudflare Pages 构建时自动注入，本仓库默认就靠它
//   3. 下面的兜底值     —— 本地构建 / 其他平台使用
const FALLBACK_SITE = 'https://open-source-model-directory.2472217240.workers.dev';
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
  integrations: [
    sitemap({
      // 退役的旧地址（meta refresh 兜底页）不进 sitemap，注意只排除这几条精确路径
      filter: (page) =>
        !['/llm/', '/aigc/', '/deploy/', '/tags/', '/recent/'].includes(new URL(page).pathname),
    }),
  ],
  markdown: {
    shikiConfig: { theme: 'github-dark' },
  },
  // dev server 的文件监视器会递归整个项目根目录，而这些目录跟站点无关：
  //   docs/          —— 写文档时编辑器 / 工具会做「原子写」（先建 `.<名字>.<pid>.<uuid>.tmpdir/` 再改名），
  //                     监视器刚好 watch 到那个随即消失的临时目录就会抛 EBUSY 并把 astro dev 带崩
  //                     （UnhandledRejection → 进程退出）。docs 本来就不参与构建，直接排除。
  //   _verify/       —— 收录流水线的缓存与报告，脚本随时重写。
  //   _acl-recovery/ —— DSH 沙箱修文件权限时建的临时报告目录。
  //   .wrangler/ dist/ —— 构建与部署产物。
  vite: {
    // glob loader（`astro/loaders`）会 import picomatch，而它是 CJS；
    // astro sync / build 的临时 Vite server 把 `ssr: { external: [] }` 写死，
    // 于是 picomatch 被原样内联进 ESM 的 module runner，报 “require is not defined”。
    // 内容配置是在 `astro` 环境里加载的，这里按 Vite 8 的环境级写法把它交回 Node 原生加载。
    environments: {
      astro: {
        optimizeDeps: { include: ['picomatch'] },
      },
    },
    server: {
      watch: {
        ignored: [
          '**/docs/**',
          '**/*.tmpdir/**',
          '**/_verify/**',
          '**/_acl-recovery/**',
          '**/.wrangler/**',
          '**/dist/**',
        ],
      },
    },
  },
});