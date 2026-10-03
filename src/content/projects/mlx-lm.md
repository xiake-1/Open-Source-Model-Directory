---
title: MLX-LM
org: MLX (Apple) 社区
released: 2025-03-11
added: 2026-10-03
summary: 基于 Apple MLX 框架的 LLM 运行工具包：命令行聊天、微调、LoRA 训练、量化转换一条龙，Apple Silicon 本地玩法的核心入口。
tags: []
license: MIT
params: 本地推理 / 微调工具包（MLX）
links:
  github: https://github.com/ml-explore/mlx-lm
---

## 它解决什么

在 Mac 上用 LLM 之前，社区散落在 HF 镜像、mlx-examples、各种量化脚本里。
MLX-LM 把「下载 → 量化 → 聊天 → LoRA 微调」收进同一套命令行工具，
模型直接消费 HuggingFace 上的权重，统一量化格式让不同模型可以互换。

## 什么时候用它

- 想在 MacBook / Mac Studio 上快速验证开源模型 → 一条命令起服务或进 REPL。
- 本地做小规模 LoRA 微调，不想租 GPU → 统一内存架构下 8B～70B 都可行。
- 起常驻服务的需求交给 [omlx](/projects/omlx/) 或 [vllm-mlx](/projects/vllm-mlx/)，这里偏开发侧。

## 上手难点

- 只跑 Apple Silicon；跨平台需求看 [llama.cpp](/deploy/llama-cpp/) 生态。
- 微调路径的超参文档偏薄，复现论文配置要自己读源码。
