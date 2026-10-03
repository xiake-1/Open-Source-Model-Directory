---
title: LocalAI
org: mudler（社区）
released: 2023-03-18
added: 2026-10-03
summary: 开源本地 AI 引擎：一个 OpenAI 兼容服务里跑 LLM、视觉、语音、图像、视频，官方口径"无 GPU 也能跑"，Docker 一键起。
tags: [本地部署, 多模态, OpenAI 兼容, Docker, CPU 可跑]
license: MIT
kind: 通用本地 AI 平台
stars: 49370
supports: [LLM / 视觉 / 语音 / 图像 / 视频, OpenAI 兼容 API, Docker 部署, 无 GPU 运行, 后端可换（llama.cpp 等）]
pain: 多模态质量依赖所选模型与后端；配置面比单模态工具宽
links:
  github: https://github.com/mudler/LocalAI
  docs: https://localai.io
---

## 它解决什么

很多本地部署需求不只是聊天：还要语音转写、看图、出图。LocalAI 把这些
塞进一个 OpenAI 兼容的本地服务——官方定位是"Run any model — LLMs, vision,
voice, image, video — on any hardware. No GPU required."，
模型和后端（llama.cpp 等）都通过配置换，Docker 一拉就有统一 API。

## 什么时候用它

- 要一个"什么都能接"的本地 AI 网关，前端只维护一个 endpoint → 它最省事。
- 纯 CPU 机器也想上多模态 → 官方主打场景。
- 想用 OpenAI SDK 不动代码地迁移到本地 → 接口兼容。

## 上手难点

- 多模态效果天花板由所选模型决定，"能跑"和"好用"之间还有距离。
- 配置项多（模型、后端、端点），调不通时排查链比单模态工具长。
- 高吞吐服务仍建议拆给 vLLM 这类专业引擎。
