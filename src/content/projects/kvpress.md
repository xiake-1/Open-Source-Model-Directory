---
title: kvpress
org: NVIDIA 社区
released: 2026-07-22
added: 2026-10-02
summary: 把常用的 KV cache 压缩策略（淘汰、量化、低秩）收成一套统一接口，方便对比哪种压缩在自己的任务上掉点最少。
tags: []
license: Apache-2.0
params: KV cache 压缩
links:
  github: https://github.com/NVIDIA/kvpress
---

## 它解决什么

"压缩 KV cache"的论文很多，但每篇的实现方式都不一样，
想在自己的模型和任务上比较它们，成本高得离谱。

kvpress 把这些方法统一成同一套调用方式，换一个参数就能换策略。

## 什么时候用它

- 想给长上下文推理省显存，但不确定该用哪种压缩 → 先用它做对比实验。
- 做研究复现，需要一个干净的基线 → 省掉重写实现的功夫。