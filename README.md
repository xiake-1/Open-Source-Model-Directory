# 开源模型雷达 · open-model-radar

收录**新发布的开源模型**与**部署 / 加速方案**的静态索引站。只存官方链接 + 时间点 + 一句话简介，
分 LLM、AIGC、部署方案三个板块，按发布时间线排列。

技术栈：**Astro 7（纯静态输出）+ Markdown 内容集合 + Zod 强校验**。
没有数据库、没有后端、没有运行时依赖 —— 整站就是一堆 Markdown 文件加一个构建步骤。

---

## 本地跑起来

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # 产出 dist/（纯静态，可直接托管）
pnpm preview    # 本地预览构建产物
```

用 npm 也一样：`npm install && npm run dev`。

## 目录结构

```
src/
  content.config.ts          # 三个集合的 schema（字段写错 → 构建直接失败）
  content/
    llm/*.md                 # 语言模型，一个条目一个文件
    aigc/*.md                # 图像 / 视频 / 音频 / 3D 生成模型
    deploy/*.md              # 推理引擎、量化、微调、服务化工具
  lib/
    entries.ts               # 三个集合归一化成同一种形状，列表页只认它
    format.ts                # 日期、标签文案
    site.ts                  # 站名、站点描述、仓库地址
  layouts/BaseLayout.astro   # 外壳：导航、搜索框、相对时间脚本
  components/
    EntryCard.astro          # 单条卡片
    EntryList.astro          # 卡片列表
    EntryTimeline.astro      # 按月分组的时间线
  pages/
    index.astro              # 首页：统计 + 最近发布 + 热门标签
    [collection]/index.astro # /llm/ /aigc/ /deploy/ 三个板块列表
    [collection]/[slug].astro# 条目详情页
    recent.astro             # /recent/ 最近 30 天发布 + 收录
    tags/index.astro         # 标签云
    tags/[tag].astro         # 标签页
    search.json.ts           # 站内搜索索引（前端首次输入时才拉取）
    rss.xml.ts               # RSS 订阅
    robots.txt.ts            # 由 astro.config 的 site 生成
    404.astro
scripts/
  new-entry.mjs              # 交互式新增条目
  check-links.mjs            # 死链检查
public/
  favicon.svg
  _headers                   # Cloudflare Pages 响应头（安全头 + 缓存）
```

## 怎么加一条收录

**方式一：用脚本（推荐）**

```bash
pnpm new llm "Qwen3-235B-A22B"          # 逐项询问，自动生成文件
pnpm new aigc "FLUX.2" flux-2 --dry-run # 只打印不写文件
```

脚本的校验规则和 `src/content.config.ts` 完全一致，所以不会出现"写完才发现字段不对"。

**方式二：手写 Markdown**

在对应目录新建 `模型名.md`，frontmatter 至少要这样：

```yaml
---
title: "Qwen3-235B-A22B"
org: "阿里通义千问"
released: 2025-04-29      # 官方首次公开发布
added: 2026-10-02         # 你收录进来的时间
summary: "一句话：是什么 + 凭什么值得看，至少 10 个字"
tags: ["MoE", "中文"]
license: "Apache-2.0"
params: "235B (激活 22B)"  # llm 专用
modalities: ["text"]       # llm 专用
deploys: ["vllm", "sglang"] # 关联 deploy 集合的文件名（不带 .md）
links:
  hf: "https://huggingface.co/Qwen/Qwen3-235B-A22B"
  github: "https://github.com/QwenLM/Qwen3"
---
正文写实测和踩坑记录，会渲染到详情页，也会进搜索索引。
```

### 字段说明

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | ✅ | 模型名 / 项目名 |
| `org` | ✅ | 发布方：机构、团队或个人 |
| `released` | ✅ | **官方首次公开发布**时间，时间线排序依据 |
| `added` | ➖ | 你收录的时间，不填等于 `released` |
| `summary` | ✅ | 一句话，少于 10 字构建失败 |
| `tags` | ➖ | 标签数组，决定标签页和"相关条目" |
| `links` | ✅ | `hf` / `github` / `paper` / `demo` / `docs`，**至少一个**，必须是完整 URL |
| `license` | ➖ | 许可证，商用前必看 |
| `status` | ➖ | `active`（默认）/ `dead`（链接失效）/ `deprecated`（停止维护） |
| `featured` | ➖ | 预留给以后做首页精选 |
| `params` `context` `vram` `modalities` `deploys` | ➖ | 仅 `llm` |
| `output` | ✅（aigc） | `image` / `video` / `audio` / `3d` |
| `architecture` `vram` `deploys` | ➖ | 仅 `aigc` |
| `kind` | ✅（deploy） | `推理引擎` / `量化` / `微调` / `服务化` / `分布式` / `工具链` |
| `supports` `pain` | ➖ | 仅 `deploy`：支持什么、上手难点 |

> **两条时间必须分开**：`released` 是"官方什么时候发的"，`added` 是"你什么时候记进来的"。
> 首页和 `/recent/` 会分别统计"最近 30 天发布"和"最近 30 天收录"，
> 这样才能区分"真的出了新东西"和"我在补录老模型"。

---

## 部署到 Cloudflare Pages

1. **推到 GitHub**（公开或私有仓库都行，Pages 支持私有仓库）。
2. Cloudflare Dashboard → **Workers & Pages** → Create → Pages → **Connect to Git**，选中仓库。
3. 构建配置：
   - Framework preset：`Astro`
   - Build command：`pnpm build`（用 npm 就是 `npm run build`）
   - Build output directory：`dist`
4. 环境变量里加一个 `NODE_VERSION = 22`（Astro 7 需要 Node ≥ 20.19 / ≥ 22.12）。
5. 保存并部署 → 拿到 `你的项目.pages.dev`。
6. 绑定自定义域名：Pages 项目 → Custom domains → 添加；DNS 也托管在 Cloudflare 的话一键完成并自动签发 HTTPS。
7. **最后别忘了改域名**：把 `astro.config.mjs` 里的 `site` 改成真实域名再重新部署 ——
   canonical、sitemap、RSS 里的链接都取自它。

之后每次 `git push` 自动构建上线，开 PR 还会自动生成预览环境。免费额度：带宽不限、500 次构建/月。

其它平台同样能用：Netlify / Vercel / GitHub Pages 都只需把 `dist/` 当静态目录发布，
但它们都没有"带宽不限"这一条，且 Vercel Hobby / Netlify Free 条款禁止商业用途。

---

## 自动化（都是可选项，需要哪个加哪个）

**死链检查**（链接型站点最大的腐烂源）：

```bash
pnpm check:links           # 检查全部
pnpm check:links --only llm
```

仓库里已经带了一个每周一跑的 GitHub Action（`.github/workflows/link-check.yml`），
失败会直接让 Action 变红，也就是替你发一封提醒邮件。
发现链接坏了**不要删条目**：把 `status` 改成 `dead`，历史记录本身有价值。

**自动发现新模型**：`huggingface.co/api/models?sort=createdAt&direction=-1` 能按发布时间倒序拉到新模型，
GitHub Search API 也能按 `created` 排序找新的部署项目。建议的做法是：
让脚本生成草稿 frontmatter 到临时目录并**开一个 PR**，你只负责"批准 / 丢弃"。
**不要让它直接提交到主干** —— 自动抓来的条目九成是微调小模型、fork 和空仓库，质量崩一次就没人再来了。
另外这类抓取要放在 GitHub Actions 里跑，本机直连 HuggingFace 经常超时。

**全文搜索**：现在的搜索是自己在 `search.json` 上做的（标题 / 组织 / 标签 / 简介 / 正文前 400 字）。
如果想要完整的全文检索，加 `pagefind`：`pnpm add -D pagefind`，构建脚本改成
`astro build && pagefind --site dist`，再在页面里引入它自带的 UI。

**用户投稿**：目前完全靠 PR。真需要网页投稿表单时，加 Cloudflare D1（免费 5 GB）+
一个 Pages Function 就够了，不用动现有结构。

---

## 关于示例条目

仓库里带了 14 条示例（4 个 LLM、5 个 AIGC、5 个部署方案），目的是让你打开就能看到完整效果。

**这些条目的链接是官方的，但部分 `released` 日期和参数是按印象填的，请核对后替换或删除。**
把它们当模板用：`cp` 一份改字段，比对着 schema 从零写快得多。

## 两个环境相关的设置

- `pnpm-workspace.yaml` 里设了 `nodeLinker: hoisted`：生成扁平的真实目录 node_modules，
  而不是 pnpm 默认的符号链接布局。原因是符号链接在部分受限 / 沙箱化的 Windows 环境里会导致
  Node 的模块解析失败。想换回 pnpm 默认行为，删掉这一行重新 `pnpm install` 即可。
- 该文件里还有 `allowBuilds: esbuild: false`：esbuild 的 postinstall 只是校验二进制，
  关掉它在受限环境里就不会因为无法 fork 子进程而安装失败。npm 用户不受影响。

## 许可

站点代码随意使用；收录内容的链接、模型与代码版权归各自原作者所有。