---
title: KTransformers
org: KVCache.ai
released: 2024-07-26
added: 2026-10-03
summary: CPU+GPU 混合推理框架：把 MoE 专家的激活放进 GPU、权重放内存，让消费级配置跑 DeepSeek 这类超大模型，中文社区活跃。
tags: [推理引擎, CPU+GPU 混合, MoE, 大模型, 本地部署]
license: Apache-2.0
kind: 推理框架 / 服务引擎
stars: 19557
supports: [CPU+GPU 异构推理, GGUF 专家权重, MoE 超大模型, 本地微调, OpenAI 兼容服务]
pain: 依赖多、环境搭建繁琐；模型支持清单短，冷门模型等社区补
links:
  github: https://github.com/kvcache-ai/ktransformers
  docs: https://kvcache-ai.github.io/ktransformers/
---

## 它解决什么

超大 MoE 模型（DeepSeek 671B 级）的权重放不进显存，但激活参数其实不大。
KTransformers 把"权重"留在 CPU 内存、把"激活计算"放进 GPU，
用 CPU-GPU 混合执行让 32G 显存 + 大内存的消费级配置也能跑
旗舰 MoE 模型。官方定位是"heterogeneous LLM inference/fine-tune
optimizations"的灵活框架。

## 什么时候用它

- 只有一张消费级 NVIDIA 卡 + 大内存，却想跑 DeepSeek 级 MoE → 它的招牌场景。
- 内存带宽比显存更充裕的老工作站 → 利用率高于纯 CPU 方案。
- 中文文档与教程多，社区答疑快。

## 上手难点

- 环境依赖多（CUDA、特定库版本），Windows 与 Linux 都有踩坑报告。
- 支持的模型清单远短于 vLLM / llama.cpp，新模型要等社区适配。
- 吞吐低于多卡方案，属于"跑得起来"优先的方案。
