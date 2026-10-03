---
title: MLX
org: ML Explore（Apple）
released: 2023-11-28
added: 2026-10-03
summary: Apple 官方的 Apple Silicon 数组计算框架，Mac 上本地跑 LLM 的主流底层（LM Studio 的 MLX 引擎、MLX-LM 都基于它）。
tags: [Apple Silicon, 本地部署, 推理框架, 训练]
license: MIT
kind: 支撑性生态
stars: 28637
supports: [Apple Silicon 统一内存, 懒求值计算图, 与 NumPy / PyTorch 互操作, 训练 + 推理]
pain: 只支持 Apple Silicon（和少量其他后端），NVIDIA 环境用不上
links:
  github: https://github.com/ml-explore/mlx
  docs: https://ml-explore.github.io/mlx/
---

## 它解决什么

在 Mac 上跑本地 LLM，瓶颈不是算力而是内存管理。MLX 是 Apple 官方的
数组计算框架，专门为 Apple Silicon 的统一内存设计：模型权重和 KV cache
共享同一块物理内存，避免 CPU/GPU 之间来回拷贝。基于它的上层项目
（MLX-LM、LM Studio 的 mlx-engine）让 Mac 本地推理接近消费级 NVIDIA 卡的体验。

## 什么时候用它

- 在 Apple Silicon 上做本地 LLM 推理或微调 → 这是官方推荐路线。
- 要写自己的模型加载 / 推理代码，不想被引擎框架绑死 → 直接用它。
- 生态选型：LLM 运行时看 MLX-LM，桌面一键体验看 LM Studio。

## 上手难点

- 平台锁定 Apple Silicon，团队环境混用 NVIDIA 时两边要维护两套。
- 它是计算框架不是推理服务：并发、OpenAI 兼容接口要靠上层项目补齐。
- 新模型支持跟着社区走，刚发布的模型可能要等适配。
