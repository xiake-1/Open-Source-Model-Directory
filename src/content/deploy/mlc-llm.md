---
title: MLC-LLM
org: MLC-AI 社区
released: 2023-04-29
added: 2026-10-03
summary: 基于 ML 编译（TVM）的通用 LLM 部署引擎，同一套工具链把模型编译到桌面 GPU、iOS、Android、Web，跨端部署的代表作。
tags: [推理引擎, ML 编译, 跨端, 移动端, Web]
license: Apache-2.0
kind: 推理框架 / 服务引擎
stars: 23200
supports: [TVM/MLC 编译, Metal / CUDA / Vulkan, iOS / Android 端侧, WebAssembly 浏览器部署, C API]
pain: 编译期长、工具链重；桌面高并发场景不如 vLLM / llama.cpp 成熟
links:
  github: https://github.com/mlc-ai/mlc-llm
  docs: https://llm.mlc.ai/
---

## 它解决什么

"同一模型，到处跑"。MLC-LLM 用 ML 编译把模型编译到目标平台的本地可执行形态：
桌面（Metal / CUDA / Vulkan）、iOS / Android App、甚至浏览器（WASM）。
官方定位是"Universal LLM Deployment Engine with ML Compilation"，
在移动端与 Web 本地推理这条线上覆盖面最广。

## 什么时候用它

- 要把 LLM 塞进自己的 iOS / Android / Web 应用 → 它是少数能全链路覆盖的方案。
- 想研究编译式推理（算子融合、量化编译）→ 它是最完整的开源样本。
- 非 NVIDIA 桌面平台（AMD / Intel GPU、Mac）要本地推理 → 后端选择多。

## 上手难点

- 编译期长，工程接入成本高于直接 pip / brew 装的引擎。
- 桌面端吞吐与生态成熟度不及 vLLM / llama.cpp。
- 新模型适配要跑一遍编译流水线，周期以天计。
