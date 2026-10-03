---
title: Strata
org: Niko1221
released: 2026-09-18
added: 2026-10-02
summary: 面向 LLM Agent 的分层记忆方案：把工具输出、反思、事实分别落到不同层，按需组装进上下文，长任务不容易"忘事"。
tags: []
license: Apache-2.0
params: Agent 记忆
links:
  github: https://github.com/Niko1221/Strata
---

## 它解决什么

Agent 跑长任务时，上下文里堆的都是工具返回的原始文本，
真正的结论被挤到中间"失忆区"。

Strata 把记忆分成几层（原始观察 / 摘要 / 长期事实），
每层有自己的写入和淘汰规则，组装 prompt 时再按相关性挑选。

## 什么时候用它

- 多步工具调用的 Agent，任务一长就丢前文 → 优先看它。
- 不想引入向量数据库，想要一套纯本地的记忆封装 → 依赖很轻。

## 上手难点

- 分层规则要按自己的任务调，默认配置偏通用。
- 和现有 Agent 框架的适配层还在变化，升级前先看 CHANGELOG。