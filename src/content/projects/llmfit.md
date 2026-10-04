---
title: llmfit
org: AlexsJones
released: 2026-02-15
added: 2026-10-04
summary: 一条命令回答「我这台机器能跑哪些开源模型」：探测 CPU / 内存 / 显卡 / 显存与统一内存，按参数量、上下文与量化格式估算占用和速度，并支持把自己实测的 tok/s 回传成基准。
tags: []
license: MIT
params: 本地选型 / 硬件匹配
links:
  github: https://github.com/AlexsJones/llmfit
---

## 它解决什么

选型是本地部署的第一道坎：模型卡上写着参数量，却很少说清「你这张卡、这点内存到底行不行」。
llmfit 先探测硬件（CPU 核数、系统内存、独显 / 核显、显存、统一内存，覆盖 NVIDIA CUDA、
Apple Silicon、AMD ROCm、Intel OneAPI），再按模型参数量、上下文长度与量化格式
（GGUF / AWQ / GPTQ / EXL2）推算内存占用与 tokens/s，给出这台机器上跑得动的候选。

它还把「估算」变成「实测」：在本机下载并服务一个模型、量出真实 tok/s 后可以直接提 PR 回传，
同硬件的其他人就能看到带 ✓ 的实测数字，而不是继续依赖估算。

## 什么时候用它

- 刚买机器 / 第一次配本地模型 → 用它定下「下载哪个尺寸、用什么量化」。
- 想把选型接进自动化流程 → 它带 TUI、Web 面板和 REST 接口（`/api/v1/system`、`/api/v1/models`）。
- 需要用它推荐的运行时落地 → 支持 [Ollama](/deploy/ollama/)、[llama.cpp](/deploy/llama-cpp/)、
  [MLX](/deploy/mlx/)、LM Studio、Docker Model Runner 等本地后端。

## 上手难点

- 估算基于参数量与量化档位，MoE、多卡与特殊上下文设置仍要自己实测确认。
- 回传基准需要先下载并真正跑一遍模型，磁盘与时间成本要自己承担。
- 它只负责选型，不负责推理服务；选定之后还要另配引擎（同类工具见 [whichllm](/projects/whichllm/)）。