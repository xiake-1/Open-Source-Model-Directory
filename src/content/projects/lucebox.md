---
title: Lucebox
org: Luce
released: 2026-04-03
added: 2026-10-03
summary: 面向消费级 GPU 与异构硬件的投机推理服务器：投机解码 + 投机预填充 + 单 megakernel 调度，RTX 3090 / AMD R9700 这类卡上把 decode 延迟打下来。
tags: []
license: Apache-2.0
params: 投机推理服务器
links:
  github: https://github.com/Luce-Org/lucebox
  docs: https://www.lucebox.com
---

## 它解决什么

消费级 GPU 跑 70B～1T 级模型时，decode 阶段被显存带宽卡死，vLLM 的默认路径吃不满这张卡。
Lucebox 把投机解码、投机预填充与自定义 CUDA/ROCm 内核打包成一个服务，
用单一 megakernel 减少启动开销，在 RTX 3090、R9700 这类「非数据中心」卡上给出接近翻倍的有效 token/s。

## 什么时候用它

- 手里是二手 3090 / 消费级 AMD 卡，想要最大本地吞吐 → 它就是为这类卡调的。
- 已经用 vLLM 但 decode 延迟不满意 → 先拿它做 A/B，再决定要不要迁移。

## 上手难点

- 内核按特定显卡架构手写，新卡型支持要看 roadmap，别假设所有卡都行。
- 投机路径的接受率随任务变化，短请求场景收益有限，要自己实测。
