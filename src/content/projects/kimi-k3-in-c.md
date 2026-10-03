---
title: kimi-k3-in-c
org: FareedKhan-dev
released: 2026-08-01
added: 2026-10-03
summary: 把 2.78T 的 Kimi K3 跑进单 CPU + 8.24GB 内存的极端实验：纯 C99、无 BLAS 无框架无 GPU，MXFP4 量化 + AVX2 手写内核。
tags: []
license: Apache-2.0
params: CPU 极限推理实验
links:
  github: https://github.com/FareedKhan-dev/kimi-k3-in-c
---

## 它解决什么

「大 MoE 只能在数据中心跑」的默认认知，靠的是推理框架与显存假设，不是数学极限。
这个仓库把一整条推理链路（MXFP4 反量化、稀疏 MoE 路由、线性注意力内核）手写成零依赖 C，
证明 1T 级模型在消费级 CPU 内存上「能跑」——速度不快，但把下限探得很深。

## 什么时候用它

- 想知道自己的机器离「跑得动 1T 模型」还有多远 → 它是现成的探针。
- 给 CPU 推理写定制内核前想要一份干净参考实现 → 每个 kernel 都独立可读。

## 上手难点

- 这是实验仓库：没有 CLI 交互体验，加载与推理速度按小时计，别期待实用吞吐。
- 权重需要自己准备对应量化格式，构建只支持带 AVX2 的 x86。
