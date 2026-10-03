---
title: DeepSpec
org: DeepSeek
released: 2026-06-26
added: 2026-10-03
summary: DeepSeek 开源的投机解码全栈代码库：训练 drafter、评估接受率与端到端加速比都在一套接口里，复现与改进投机解码方案的干净基线。
tags: []
license: MIT
params: 投机解码研究基线
links:
  github: https://github.com/deepseek-ai/DeepSpec
---

## 它解决什么

投机解码的论文各写各的：drafter 训练配方、验证调度、评估口径都不一致，
跨论文比较基本靠猜。DeepSpec 把「训练 → 集成 → 评测」统一成同一套代码与指标，
支持多种 drafter 结构，让「哪种投机方案在我的模型上掉点最少」变成一次实验而不是三个月工程。

## 什么时候用它

- 要给生产模型挑投机解码方案 → 用它做统一评测，再落地到 [vLLM](/deploy/vllm/) 或 [Lucebox](/projects/lucebox/)。
- 研究复现 → 它是当前公开仓库里口径最完整的那份。

## 上手难点

- 它研究的是加速机制，不是开箱即用的推理服务，接进线上要自己写集成层。
- 训练 drafter 需要对应模型的训练基础设施，纯评测路径对硬件要求低得多。
