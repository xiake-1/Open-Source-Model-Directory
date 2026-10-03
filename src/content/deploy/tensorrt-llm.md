---
title: TensorRT-LLM
org: NVIDIA
released: 2023-08-16
added: 2026-10-03
summary: NVIDIA 官方的 GPU 推理优化引擎：用 Python API 定义 LLM，在 NVIDIA GPU（含 Blackwell）上做状态最先进的推理优化。
tags: [推理引擎, NVIDIA, CUDA, 高吞吐, 生产可用]
license: 自定义（GitHub 标注 NOASSERTION）
kind: 推理框架 / 服务引擎
stars: 14760
supports: [CUDA / Blackwell, MoE, 张量并行, Python API 建模, C++ 运行时]
pain: 绑定 NVIDIA 硬件；构建与版本链复杂，模型适配周期长于 vLLM
links:
  github: https://github.com/NVIDIA/TensorRT-LLM
  docs: https://nvidia.github.io/TensorRT-LLM
---

## 它解决什么

在 NVIDIA 卡上把吞吐挤到极限。TensorRT-LLM 把模型编译成高度优化的
kernel 组合（算子融合、in-flight batching、KV cache 管理），
官方定位是"easy-to-use Python API to define LLMs"加
"state-of-the-art optimizations"。NVIDIA 自己的推理服务（DGX /
推理云产品）底层就是它。

## 什么时候用它

- 全是 NVIDIA 卡、追求极限吞吐/成本比 → 通常比通用引擎再快一截。
- 要和 NVIDIA 官方工具链（NeMo、Triton）对齐 → 配套最顺。
- 要 C++ 运行时嵌入自己的服务 → 它提供 Python 与 C++ 两侧。

## 上手难点

- 硬件锁定 NVIDIA，混合环境或 AMD 卡用不上。
- 版本迭代快、模型支持有滞后，新模型出来通常先等 vLLM。
- 构建/环境链（容器、CUDA 版本）比 pip 装的引擎麻烦不少。
