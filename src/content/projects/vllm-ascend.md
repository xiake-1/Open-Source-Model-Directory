---
title: vllm-ascend
org: vLLM 社区（华为昇腾方向）
released: 2025-01-29
added: 2026-10-03
summary: vLLM 的昇腾 NPU 社区硬件插件：同一套 vLLM 接口跑在国产算力上，国产 LLM（Qwen / DeepSeek / GLM 等）私有化部署的主要通道。
tags: []
license: Apache-2.0
params: 硬件后端（昇腾 NPU）
deploys: [vllm]
links:
  github: https://github.com/vllm-project/vllm-ascend
  docs: https://docs.vllm.ai/projects/ascend
---

## 它解决什么

vLLM 的主干只覆盖 NVIDIA / 部分 AMD；昇腾 NPU 上想用同一套 API 与运维习惯，
就得靠这个社区维护的硬件插件：适配 CANN 运行时、移植 PagedAttention 等核心算子，
让「换卡不换代码」在国产算力上成立。

## 什么时候用它

- 私有化部署落点是昇腾 910 系列 → 它是当前最完整的 vLLM 方案。
- 已有 vLLM 运维经验、只做算力替换 → 启动参数与模型列表大体沿用主仓库。

## 上手难点

- 版本耦合最紧：vLLM 主干、CANN、插件三方都要对得上，升级前先查兼容性矩阵。
- 算子覆盖度落后主干，某些新模型结构要等社区移植。
