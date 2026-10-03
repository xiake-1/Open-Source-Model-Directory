---
title: vllm-mlx
org: waybarrios
released: 2025-12-06
added: 2026-10-03
summary: 原生 MLX 实现的 OpenAI / Anthropic 兼容推理服务器：连续批处理、多模态、MCP 工具调用全支持，给 Mac 上的 Claude Code / Agent 当本地后端。
tags: []
license: Apache-2.0
params: 本地推理服务（Apple Silicon）
links:
  github: https://github.com/waybarrios/vllm-mlx
  docs: https://vllm-mlx.is-a.dev/
---

## 它解决什么

Agent 与 Claude Code 生态默认接 Anthropic / OpenAI 接口，但本地模型服务大多只暴露 OpenAI 兼容口。
vllm-mlx 直接在 MLX 上实现两套接口，外加 MCP 工具调用与多模态（视觉、语音），
让 Mac 上的本地大模型能直接当 Agent 的后端，不用中间转一层。

## 什么时候用它

- 本地跑 Agent / 编码工具，需要 Anthropic 兼容接口 → 它是少数原生支持的选择。
- 想对比 [omlx](/projects/omlx/)（菜单栏常驻、SSD 缓存）与 [vllm-metal](/projects/vllm-metal/)（vLLM 官方插件）：这个最偏「API 生态对齐」。

## 上手难点

- 社区单人维护为主，issue 响应速度取决于作者档期。
- 量化与显存管理比 omlx 粗，超大 MoE 的内存换页要自己调参数。
