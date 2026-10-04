---
title: TurboFieldfare
org: drumih
released: 2026-07-17
added: 2026-10-04
summary: 让 26B 级 MoE 在 8GB 内存的 Mac 上跑起来：常驻只留共享核心与 KV cache，按 token 从 SSD 流式读取需要的专家，Gemma 4 26B-A4B 的权重落在磁盘而不是内存里。
tags: []
license: Apache-2.0
params: 端侧推理 / Apple Silicon
links:
  github: https://github.com/drumih/turbo-fieldfare
---

## 它解决什么

MoE 的权重很大，但每个 token 只用其中一小撮专家。TurboFieldfare 利用这一点做了内存置换：
常驻内存的只有约 1.35GB 的共享核心与 FP16 KV cache，每个 token 需要的专家现从 SSD 流式读取，
于是 Gemma 4 26B-A4B（约 14.3GB 权重落在磁盘）能在 8GB 内存的 Mac 上跑起来。

它是 Swift + Metal 写的专用运行时，不是 MLX 或 llama.cpp 的外壳；仓库里带一份
103 项实测的实验记录（kernel、缓存、I/O、prefill、decode），并给出 M2（8GB）5.1–6.3 tok/s、
M5 Pro 31–35 tok/s 的机器实测。

## 什么时候用它

- 只有 8~16GB 统一内存的 Apple Silicon Mac，却想跑 26B 级模型 → 这是「内存不够但磁盘够」的解法。
- 想研究 MoE 权重流式加载与专家缓存策略 → 实验记录本身就是一份可复现的素材。

## 上手难点

- **模型特定**：只针对 Gemma 4 26B-A4B，换模型要改运行时。
- 速度直接受 SSD 影响，读取慢的盘会拖垮 decode；首次还要下载并重打包约 15GB 权重。
- 需要 macOS 26 / Metal 4 / Swift 6.2 自行构建，官方给的速度是特定机器上的参考值，不是上限。