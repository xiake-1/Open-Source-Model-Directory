---
title: ExLlamaV3
org: turboderp
released: 2025-04-06
added: 2026-10-03
summary: ExLlama 系列的第三代 CUDA 推理引擎：重写注意力与采样路径、引入全新量化体系，消费级显卡上 Dense / MoE 大模型吞吐的标杆之一。
tags: []
license: MIT
params: CUDA 推理引擎
links:
  github: https://github.com/turboderp-org/exllamav3
---

## 它解决什么

消费级 24G 显卡上跑 70B 级 Dense 或 MoE 大模型，瓶颈通常是 CUDA 内核效率与量化精度损失。
ExLlamaV3 重写了解码路径（CUDA Graph、split-K 注意力、自定义量化 dequant 核），
在同等显存下把 token/s 推到 llama.cpp 与 vLLM 难以企及的位置，代价是构建链路更重。

## 什么时候用它

- 单张消费级显卡追求极限本地吞吐 → 它长期是这张卡的天花板候选。
- 用 ExLlamaV2 的老用户迁移 → 量化格式与模型支持有代差，按官方迁移说明走。

## 上手难点

- 构建依赖版本敏感（CUDA / PyTorch 组合），装不上时多半是环境不匹配。
- 新模型支持节奏由社区决定，热门新模型的 day-0 支持不如 vLLM / llama.cpp。
