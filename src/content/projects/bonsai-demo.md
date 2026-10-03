---
title: Bonsai 2 27B Demo
org: PrismML
released: 2026-03-25
added: 2026-10-03
summary: PrismML 的 Bonsai 2 27B 本地部署演示：三值（ternary）权重的完整 27B 级思考模型，5.9 GB、262K 上下文，带视觉与原生 tool calling，一条 setup 脚本在 Mac / Windows / Linux 上跑起来。
tags: []
license: Apache-2.0
params: 本地部署演示
links:
  github: https://github.com/PrismML-Eng/Bonsai-demo
  hf: "https://huggingface.co/prism-ml/Ternary-Bonsai-2-27B-gguf"
  docs: https://prismml.com/
---

## 它解决什么

27B 的思考模型想在本地跑，通常要在量化损失与硬件门槛之间选一个。
Bonsai 2 27B 把权重本身训成三值（ternary）：5.9 GB 的 `PTQ1_0` 打包保留 98.2% 的 FP16 智能量，
完整 262K 上下文，视觉输入与原生 tool calling 都有。
这个仓库把「下权重、装运行时、起服务、开 UI」压成一条 setup 脚本。

## 什么时候用它

- 想在 Mac（MLX）/ Windows / Linux（CUDA、Vulkan、ROCm）上一条命令跑 27B → 直接用它。
- 想要带工具调用、代码解释器、视觉的本地 Agent 演示 → 可选的 Open WebUI 那套开箱即用。

## 上手难点

- 模型必须配 PrismML 的 llama.cpp fork 跑（`PQ2_0` / `PTQ1_0` 是 fork 专属打包），原版 llama.cpp 加载不了。
- 262K 全上下文只建议内存宽裕的机器开，脚本默认按设备内存自动缩小。
