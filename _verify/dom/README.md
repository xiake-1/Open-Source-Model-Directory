# DOM 验证脚本

用 [jsdom](https://github.com/jsdom/jsdom) 把 `dist/` 里的**构建产物真的跑起来**，模拟勾选与点击，
验证那些构建期查不出来的行为（`pnpm build` 只能保证字段与 schema 正确，管不了页内脚本）。

| 文件 | 覆盖什么 |
| --- | --- |
| `filter-test.mjs` | 左侧三张卡片（时间 / 所属 / 筛选）的顺序与形态；「筛选」里的分组顺序（热度在最上面）与热度口径小字；所属多选、时间多选、标签单选（含热度分档），以及三者的"与"关系；hash 格式 `#months=…&family=…&tag=…`；时间线分组折叠；点外面与 Esc 收起下拉；深链接进入；旧的 `#tag=家族` 链接仍能过滤 |
| `search-test.mjs` | 顶部搜索的结果链接是否带 `target="_blank" rel="noopener"`；命中条数、空结果提示、清空输入后收起 |
| `nav-test.mjs` | 窄屏顶部导航：`<html>` 上的 `js` 类、汉堡按钮的 `aria-expanded` / `aria-controls`、四项导航与两个分组标题都在、窄屏把搜索框搬进抽屉、点击 / Esc / 跨断点（转屏、拉宽）三种收起路径、抽屉打开时锁住页面滚动、没有 JS 时导航照旧可见；顺带确认抽屉那几条关键 CSS 进了产物 |
| `smoke-test.mjs` | 没有筛选的页面（`/llm/github/`、`/llm/deploy/`）与内容为空的页面（`/aigc/*/`）不报错，卡片数符合预期；首页第一块「近期热门」的两组（两组小标题、模型榜 = **近两个月**里热度「高」的前 10、计数标签写成「10 / 40」、热度数字从高到低、条目都在新窗口打开详情页；社区项目 = 近 30 天发布的那几条、名次列留空、右列是发布日期）、"近 30 天"窗口条目直接平铺、没有月份小节与日期小标题，分区标题是链接且标题下面没有说明段落、以及正文里不再出现「新的在前」；文件末尾另有一组断言盯「热度分档 LLM 与 AIGC 各一套阈值」（AIGC 页不许出现「100万」、LLM 页不许出现「50万」） |
| `relative-time-demo.mjs` | 演示卡片右侧的「x 天前」是构建期只输出日期、浏览器里再算出来的（构建产物里没有"天前"字样） |

## 怎么跑

```bash
pnpm build            # 先生成 dist/，脚本读的是构建产物
cd _verify/dom
npm install           # 只装 jsdom；node_modules 已被根目录 .gitignore 覆盖
node run-all.mjs
```

四个套件都会打印逐条 `ok` / `FAIL`，末尾汇总，有任何失败则退出码非 0
（`nav-test.mjs` 之外都读构建产物；布局类的改动仍要人工按手机宽度看一眼）。

## 两个坑记在这里

1. **jsdom 不执行 `type="module"` 脚本**，而 Astro 会把组件的 `<script>` 打包成外部 module chunk。
   所以脚本里先正常解析页面，再把那个 chunk 的内容当普通脚本注入（该 chunk 没有 `import`/`export`，
   可以直接跑）。副作用是：**换 Astro 大版本后如果 chunk 名或产物结构变了**，
   `filter-test.mjs` / `smoke-test.mjs` 里"按 `TagFilter` 前缀找 chunk"的那行要跟着改。
2. **jsdom 没有 `matchMedia`**，而主题切换脚本会用到，所以要 `beforeParse` 补一个空实现，
   否则页面脚本会在初始化时抛错。