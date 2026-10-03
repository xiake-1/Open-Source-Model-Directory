---
title: vllm-metal
org: vLLM 社区（Apple Silicon 方向）
released: 2025-12-12
added: 2026-10-03
summary: vLLM 的 Apple Silicon 社区硬件插件：Metal 后端对齐 vLLM 主接口，Mac 上用 vLLM 工作流（量化、OpenAI API、批处理）不用换框架。
tags: []
license: Apache-2.0
params: 硬件后端（Apple Silicon）
deploys: [vllm]
links:
  github: https://github.com/vllm-project/vllm-metal
  docs: https://docs.vllm.ai/projects/vllm-metal
---

## 它解决什么

vLLM 主干的硬件后端以 CUDA 为主，Apple Silicon 用户过去只能走 MLX 生态或 llama.cpp。
vllm-metal 作为 vLLM 官方的社区插件把推理路径搬到 Metal：同一套启动参数、
同一套量化选项、同一个 OpenAI 兼容 API，Mac 机房与 GPU 机房的运维脚本可以共用。

## 什么时候用它

- 团队已按 vLLM 建了部署流程，只是部分节点是 Mac Studio → 换插件不换流程。
- 评估 [omlx](/projects/omlx/) 这类独立实现时，这里是「vLLM 正统」的对照基准。

## 上手难点

- Metal 后端成熟度低于 CUDA 主干，新算子支持有滞后，冷门模型结构可能缺内核。
- 插件、vLLM 主干、MLX 三方版本要对齐，升级节奏以插件 release 为准。
