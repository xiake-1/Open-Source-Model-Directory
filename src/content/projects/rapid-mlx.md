---
title: Rapid-MLX
org: raullenchai
released: 2026-02-25
added: 2026-10-04
summary: Apple Silicon 上的 MLX 推理服务与 Mac app：同时提供 OpenAI 与 Anthropic 兼容端点，重点是 coding agent 的工具调用可靠性（27 个解析器 + 自动识别），带 Radix 前缀缓存与量化 KV cache。
tags: []
license: Apache-2.0（README 徽章与对比表声明；GitHub 未识别出许可文件）
params: 推理服务 / Apple Silicon
links:
  github: https://github.com/raullenchai/Rapid-MLX
  docs: https://rapidmlx.com
---

## 它解决什么

在 Mac 上给 coding agent 当后端，难点常常不是速度而是「工具调用能不能被正确解析」。
Rapid-MLX 以 MLX 为引擎，同时暴露 OpenAI（`/v1/chat/completions`、`/v1/responses`）
与 Anthropic Messages（`/v1/messages`）两套端点，内置 27 个工具调用解析模块与自动识别兜底；
另一侧是服务能力：内存里的 Radix 前缀缓存（带状态快照，关服落盘、启动恢复）与量化 KV cache。

README 自己给了对比表与「哪里更慢」的说明：在 M2 Pro 上对 Qwen3.6-35B-A3B 的 8 路并发，
聚合 decode 吞吐约 3× Ollama；但密集 12B 模型没有更快，冷 prompt 的 prefill 还不如
llama.cpp 系引擎。

## 什么时候用它

- Mac 上跑 Claude Code 这类 agent，需要 OpenAI 与 Anthropic 两套线都能接。
- 已经在用 [mlx-lm](/projects/mlx-lm/) 或 [oMLX](/projects/omlx/)，
  想要「带 GUI 的服务 + 更稳的工具调用」。
- 多轮流式会话多、希望前缀缓存跨重启复用 → 它的 KV / 前缀缓存有落盘策略。

## 上手难点

- 只在 Apple Silicon + MLX 上，GGUF / CUDA 路线不适用。
- 收益随模型与场景变化：密集小模型、冷启动 prefill 不一定占优，官方建议按自己的负载测。
- 许可需要自己核一眼：README 声明 Apache-2.0，但 GitHub 没识别出许可文件。