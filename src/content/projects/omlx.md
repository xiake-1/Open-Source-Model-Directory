---
title: omlx
org: jundot
released: 2026-02-13
added: 2026-10-03
summary: Apple Silicon 上的本地 LLM 推理服务：连续批处理 + SSD 缓存权重，菜单栏常驻管理，Mac 上跑 DeepSeek / Qwen 这类大 MoE 的默认选择之一。
tags: []
license: Apache-2.0
params: 本地推理服务（Apple Silicon）
links:
  github: https://github.com/jundot/omlx
  docs: https://omlx.ai
---

## 它解决什么

Mac 上跑大模型长期只有「终端起 Python 服务」一条路：进程一关就没了，重启要重新加载权重。
omlx 把推理引擎做成 macOS 菜单栏常驻服务——OpenAI 兼容 API、连续批处理、
冷模型权重放在 SSD 上按需换入换出，几十 G 的 MoE 不再要求全部常驻内存。

## 什么时候用它

- 在 Apple Silicon 上做日常本地推理 / 给 Agent 提供后端 → 即开即用，不用管进程。
- 内存装不下完整权重、但又想跑 1T 级 MoE → SSD 缓存换页是它的主场。
- 想对比 [vllm-metal](/projects/vllm-metal/)：那个是 vLLM 官方社区的 Metal 插件，omlx 是独立实现、更偏消费级体验。

## 上手难点

- 只覆盖 Apple Silicon；CUDA 用户看 [ExLlamaV3](/projects/exllamav3/) 或 [nano-vllm](/projects/nano-vllm/) 那条线。
- 权重换页有 I/O 成本，频繁切换模型时首次请求会明显变慢。
