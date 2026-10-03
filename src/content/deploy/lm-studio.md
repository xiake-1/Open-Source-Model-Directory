---
title: LM Studio
org: Element Labs（LM Studio）
released: 2023-09-15
added: 2026-10-03
summary: 桌面版"一键本地 LLM"：应用内下载模型、聊天、起本地 OpenAI 兼容服务，运行时是 llama.cpp 加 Apple MLX 双引擎。
tags: [本地部署, 桌面端, 易用, 跨平台, 快速上手]
license: 应用闭源（lms CLI / SDK 为 MIT）
kind: 一体化本地运行工具
stars: 5331
supports: [应用内下载模型, 内置聊天界面, 本地 OpenAI 兼容服务, llama.cpp + MLX 双引擎, lms CLI / Python / JS SDK]
pain: 应用本体闭源，深度定制要走 CLI 或 SDK；star 热度按官方 CLI 仓库（lms）计
links:
  github: https://github.com/lmstudio-ai/lms
  docs: https://lmstudio.ai/docs
---

## 它解决什么

本地模型的上手门槛是"下权重、选量化、起服务"三件事。LM Studio 把它们装进一个桌面应用：
在应用里挑模型自动下载，点开就能聊天，再点一下就是一个本地 OpenAI 兼容服务。
运行时是 llama.cpp 加 Apple MLX 双引擎，Mac 和 Windows 都能跑，官方还把它做成
"本地优先"的 agent 形态（Bionic）。

## 什么时候用它

- 想在桌面直接"打开就用"本地模型、不想碰终端 → 首选。
- Apple Silicon 开发机，想吃满统一内存 → MLX 引擎是它的差异化优势。
- 应用要接本地模型 → 官方的 lms CLI 与 Python / JS SDK 都是开源的。

## 上手难点

- 应用本体闭源，深度定制空间比直接用引擎小，需要定制就用 lms CLI。
- 模型目录比 Ollama 薄，个别变体要自己找 GGUF 导入。
- 多用户高并发不是它的场景，那是 [vLLM](/deploy/vllm/) / [SGLang](/deploy/sglang/) 的活。
