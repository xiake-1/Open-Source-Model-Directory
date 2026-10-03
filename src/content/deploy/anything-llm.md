---
title: AnythingLLM
org: Mintplex Labs
released: 2023-06-04
added: 2026-10-03
summary: 本地优先的 AI 工作台：内置向量库与 RAG，可对接 Ollama 等本地推理后端，把"模型 + 知识库 + 应用"装进一个产品里。
tags: [本地部署, RAG, 向量库, 桌面端, 自托管]
license: MIT
kind: 通用本地 AI 平台
stars: 66679
supports: [本地向量库, RAG 知识库, Ollama 等后端接入, 桌面版 / Docker 版, agent 工作流]
pain: 推理能力依赖外接后端；功能面宽，深度调优空间有限
links:
  github: https://github.com/Mintplex-Labs/anything-llm
  docs: https://docs.anythingllm.com
---

## 它解决什么

AnythingLLM 的定位是"local-first agent experience"：把模型接入、
向量库、知识库问答、应用搭建收进一个产品。桌面版面向个人，
Docker 版面向团队自托管；推理本身不内置，接 Ollama 或
OpenAI 兼容后端即可。

## 什么时候用它

- 个人想搭"我的文档 + 本地模型"的私有助手 → 桌面版最省事。
- 团队要私有化的 RAG 问答，不想自己拼向量库 → Docker 版直接起。
- 需要一个能带 agent 工作流的轻应用层 → 内置模板可用。

## 上手难点

- 后端引擎的性能上限不归它管，大并发还是得换专业推理引擎。
- 它把很多组件打包在一起，单点出问题（模型、向量库、界面）排查面比纯引擎宽。
- 高级场景（自定义检索器、复杂权限）文档偏少。
