---
title: TurboQuant
org: 0xSero
released: 2026-03-25
added: 2026-10-04
summary: KV cache 的量化压缩实现（3-bit key / 2-bit value，Triton kernel + vLLM 集成）：把长上下文的 KV 占用压下来换成可用 token 容量，README 在单张 RTX 5090 上记录释放 30GB KV、token 容量翻倍。
tags: []
license: GPL-3.0
params: KV cache 压缩
links:
  github: https://github.com/0xSero/turboquant
---

## 它解决什么

长上下文推理里，KV cache 往往和权重一起把显存吃光，能塞多少 token 直接取决于 KV 占用。
TurboQuant 是论文方法的工程实现（ICLR 2026，arXiv:2504.19874）：对 KV cache 做
3-bit key / 2-bit value 量化，用 Triton kernel 落地并接入 [vLLM](/deploy/vllm/)。
README 记录了两组实测：单张 RTX 5090 上 KV 释放 30GB、最大 token 容量从 457k 提到 914k（2×），
prefill / decode 还略有提升；8× RTX 3090 上按上下文长度列出 KV 占用约 30.9% 的节省。

## 什么时候用它

- 显存吃紧、又想拉长上下文的本地推理 → 换 KV 量化通常比换硬件便宜。
- 模型是「少量 full-attention 层 + 大量线性注意力层」的混合结构 → 它正好只压 full-attention 部分。
- 已经用 [vLLM](/deploy/vllm/) 起服务，愿意跟着改 KV cache 配置。

## 上手难点

- 收益与模型结构强相关：线性注意力 / Mamba 混合模型的不可压缩状态会限制效果，MoE 受益更小。
- 量化必然有精度取舍；README 用 needle 类测试自证，但关键任务仍要自己复验。
- 属于跟进论文的实现，与 vLLM 版本耦合较紧，升级时要一起验证。