# `_verify/` 目录：收录流水线与验证脚本

这个目录是**工具**，不是站点内容；只有 `dom/` 下那三个 jsdom 套件在每次改完站点后值得跑一遍。
其余脚本是 2026-10 那两轮「把 2025-01 以来的开源 LLM 补全」以及 AIGC 那一轮留下的，
用来把字段对着 HuggingFace 的真实数据核一遍 —— 想再加一批模型时可以整条流水线重跑。

## 收录流水线（按顺序）

| 脚本 | 作用 |
| --- | --- |
| `plans.mjs` | **清单源数据**（人工定稿）：slug / 型号名 / 机构 / 家族 / 官方发布日 / 简介 / 是否可商用 / 上下文 / 显存 / 上游仓库 ID。带 `verified: true` 的条目表示许可已按原文核过，`generate.mjs` 会据此直接由许可推 `commercial` |
| `hf-fetch.mjs` | 按机构从 HF API 拉模型仓库元数据（仓库创建日、likes、下载量）落盘到 `_verify/hf/*.json`。**必须用 `limit=1000` 一次拉全**：`page=` 与 `before=` 游标都会静默重复返回同一批 |
| `gap-check.mjs` | 把候选池与已收录对比，列出「够得着标准但站里没有」的仓库（毛清单，供人工筛） |
| `gap-candidates.mjs` | 在毛清单上套定稿口径（≥4B、排除专用模型 / 基线 / 量化 / 第三方改编）→ `gap-candidates.md`，人工过一遍 |
| `generate-batch.mjs` | 读 `batch-list.mjs`，从 HF 补 `released` / `params` / 许可证并追加进 `plans.mjs`（`--apply` 才写） |
| `hf-config.mjs` | 单个仓库的 `config.json` 关键字段（专家数 / 上下文 / 模型类型）与真实参数量，用来核对存疑型号 |
| `hf-license.mjs` / `hf-licenses-all.mjs` / `hf-license-inline.mjs` | 抓仓库里的 LICENSE：关键词体检 / 标题落盘到 `licenses.json` / 判断是否夹带了 Apache-2.0、MIT 全文。可用 `LIC_REPOS='owner/a,...'` 只抓指定仓库 |
| `hf-downloads.mjs` | **生成站点的热度快照** `src/data/hf-downloads.json`：按每个条目的 `links.hf` 拉一次近 30 天下载量与 likes。构建期不联网，只读这份快照，所以想刷新列表页左侧的「热度」分档就跑它（`--dry` 只看覆盖率） |
| `generate.mjs` | **读 `plans.mjs` 生成 `src/content/llm/*.md`**：补参数量、许可、专家数，与 `released` 交叉核验后打印告警 |
| `license-policy.mjs` | `license` → `commercial` 的判定（口径见 `docs/项目结构/项目说明.md` 的「商用怎么判」），两个 generate 共用 |
| `params-check.mjs` / `params-fix.mjs` | 检查（可选 `--apply` 修正）既有条目的 `params` 与 HF 实测参数量是否偏差 ≥5B |
| `cross-check.mjs` | 与 `final.json`（上一轮带证据链的核实结果）交叉核对关键字段 |
| `docs-list.mjs` | 重新生成 `docs/项目模型/` 下三份收录清单（LLM / AIGC / 社区项目），并打印「官方发布日 vs HF 仓库创建日」差值 ≥3 天的条目 |
| `dist-check.mjs` / `expect.mjs` / `stats.mjs` | 打印站点数据分布（家族 / 商用 / 上下文 / 按月条数）与筛选测试需要的期望值 |
| `context-audit.mjs` / `summary-check.mjs` / `commercial-audit.mjs` | 三张体检表：上下文是否都人工核定、简介与字段是否自洽、`license` 与 `commercial` 是否矛盾 |
| `fix-titles.mjs` | 批量补录后把「原始仓库名当标题」的条目改成正式写法 |
| `enrich.json` / `licenses.json` / `hf/*.json` | 上面几步的缓存，重跑不必再打 API |
| `aigc-plans.mjs` | **AIGC 清单源数据**（人工定稿）：slug / 型号名 / 机构 / 家族 / 官方发布日 / 简介 / output / 架构 / 参数量 / 是否可商用 / 链接 / `repo` |
| `aigc-repos.mjs` | AIGC 要逐个核对的 HF 仓库 ID 清单，与 plans 里的 `repo` 一一对应 |
| `aigc-fetch.mjs` | 按机构拉一遍 AIGC 相关仓库元数据到 `_verify/hf-aigc/*.json`（找线索用，AIGC 的机构比 LLM 分散得多） |
| `aigc-cards.mjs` | 抓指定仓库的模型卡前 N 字（`CARD_CHARS` 可调），写一句话简介时核对事实 |
| `aigc-verify.mjs` | 按 `aigc-repos.mjs` 逐个拉 createdAt / 许可标识 / safetensors 真实参数量 → `aigc-enrich.json` |
| `aigc-generate.mjs` | **读 `aigc-plans.mjs` 生成 `src/content/aigc/*.md`**：自校验枚举 / 简介字数 / 链接 / slug，并对齐 HF 元数据 |
| `aigc-enrich.json` / `hf-aigc/*.json` | AIGC 流水线的缓存 |
| `gh-fetch.mjs` | **社区项目栏的候选搜索**：按关键词在 GitHub 搜 2025-01 之后创建的仓库（star 排序），全量落盘 `_verify/gh-search.json`；只找线索，条目人工写 |
| `gh-status.mjs` | **已收录条目的 GitHub 巡检**（`gh-fetch.mjs` 的对照面）：按每条 `links.github` 拉一次 `/repos/{owner}/{repo}`，挑出归档 / 停更 / 改名 / star 变了 / 许可不一致 / 404 → `_verify/gh-status.json`，只打印需要人工看的那些。默认**直连**（`--proxy` 走系统代理、`--releases` 追加最新 release、`--stale <天>` 改停更阈值）；未认证 60 次/小时，按出口 IP 算 |

两个环境坑（和 `scripts/check-links.mjs` 一样）：Node 的 `fetch` 不读 Windows 系统代理，
所以每个联网脚本都会自己把系统代理读出来并挂上 undici 的 `ProxyAgent`；
HF 的 `?full=false` 会重复返回同一批仓库，去重键要用仓库 ID。

## DOM 验证（`dom/`）

`pnpm build` 只能保证字段与 schema 正确，跑不了页内脚本；`dom/` 用 jsdom 把 `dist/` 真的跑起来：

```bash
pnpm build
cd _verify/dom && node run-all.mjs     # filter-test / search-test / smoke-test
```

`filter-test.mjs` 的期望值**不写死**，启动时从 `src/content/llm/*.md` 现算，所以增删收录后不用改它；
但**必须先 `pnpm build`**，否则它算的是新数据、读的是旧 HTML。`smoke-test.mjs` 里首页与列表页的
卡片数都从 `src/content/` 现算，收录量变化不用改。

`filter-test.mjs` 里连续点击的断言要 `await settle()`，因为页面脚本有更新排在 rAF 里。

`check-dev.mjs` 是另一路验证：它直接拉**运行中的 dev server**（默认 `http://localhost:4321/llm/models/`），
把卡片数、Qwen 条数、标题重名与 `src/content/llm/` 对一遍。用它来判断
「页面没变」到底是代码问题还是 dev server 拿着旧缓存没重启 ——
`pnpm dev` 只在启动时读一次内容集合，补录之后必须重启它。

字段口径的文档在 `docs/项目结构/项目说明.md`（收录标准 / 字段怎么取 / 商用怎么判），
改收录标准时先改那一个文件，别再往别处复制一份。