---
title: TileRT
org: tile-ai
released: 2025-11-12
added: 2026-10-04
summary: 面向超低延迟而不是高吞吐批次的推理运行时：把算子拆成细粒度 tile 级任务，运行时动态重排计算、I/O 与通信并高度重叠，目标是让数百亿参数模型的单请求 TPOT 压到毫秒级。
tags: []
license: MIT
params: 推理引擎 / 超低延迟
links:
  github: https://github.com/tile-ai/TileRT
  docs: https://www.tilert.ai
---

## 它解决什么

常见推理系统按「大 batch 吞吐」优化，而交互式场景里真正重要的是单请求的响应速度。
TileRT 采用编译器驱动的思路：把 LLM 算子分解成 tile 级细粒度任务，
运行时把计算、I/O 与通信动态重排并高度重叠，从而减少设备空转、压低每个输出 token 的耗时。
README 的里程碑显示它在百万 token 的 agent 会话下拿到过单用户生成的高位成绩
（GLM-5.3、8× AMD MI355X、469 tok/s，用原始 FP8 权重），也被用于线上服务
（GLM-5.1-highspeed）。底层编译技术会陆续回流到 TileLang / TileScale。

## 什么时候用它

- 单请求延迟敏感的负载：交互式 AI、实时决策、长时间运行的 agent、AI 辅助编码。
- 整节点硬件：8× NVIDIA B200（CUDA 后端）或 8× AMD MI350X/MI355X（ROCm 后端），
  跑 GLM-5.x、DeepSeek-V3.2 这类模型。
- 想与 [vLLM](/deploy/vllm/) 组合：v0.1.5 起支持 PD 分离（vLLM 做 prefill、TileRT 做 decode），
  对外仍是 OpenAI 兼容端点。

## 上手难点

- 环境是**硬要求**而非下限：官方 wheel 按精确的 PyTorch / CUDA / ROCm 组合编译
  （如 `torch==2.11.0+cu130`、ROCm 7.14.0、Python 3.12），`tilert.load_backend()` 会拒绝不匹配的组合。
- 支持的模型与后端以 release 为准，README 明确其他组合未测试、不保证可用。
- 定位是延迟优先：如果你的目标是离线大批量吞吐，它不是同一类工具。