---
title: nano-vllm
org: GeeeekExplorer
released: 2025-06-09
added: 2026-10-03
summary: 约 300 行 PyTorch 复现的「迷你 vLLM」：只保留 PagedAttention 与连续批处理两个核心机制，读一遍就能看懂生产推理引擎的骨架。
tags: []
license: MIT
params: 推理引擎教学实现
links:
  github: https://github.com/GeeeekExplorer/nano-vllm
---

## 它解决什么

vLLM / SGLang 这类引擎源码动辄几十万行，想搞懂「为什么 PagedAttention 能提升吞吐」往往无从下手。
nano-vllm 把实现砍到最小可运行集：块化 KV cache、采样循环、调度器都在几百行里，
每个文件对应一个概念，适合直接读代码而不是读论文。

## 什么时候用它

- 准备给团队做推理引擎内部培训 → 一个下午能读完的主教材。
- 自己魔改推理循环（改采样策略、加投机解码）想要干净的基座 → 比 fork vLLM 轻量得多。

## 上手难点

- 只覆盖 NVIDIA 上的常见 LLM 结构，量化 / 张量并行 / 多模态一概没有，不能直接上生产。
- 它是教学实现，性能与 [vLLM](/deploy/vllm/) 不在一个量级，别拿它做吞吐对比。
