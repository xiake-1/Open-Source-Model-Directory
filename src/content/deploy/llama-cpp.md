---
title: llama.cpp
org: ggml-org（Georgi Gerganov 等）
released: 2023-03-10
added: 2026-10-02
summary: 纯 C/C++ 的推理实现，把大模型塞进 CPU、Mac 统一内存和各种边缘设备，GGUF 量化格式的事实标准。
tags: [量化, 本地部署, CPU 可跑, 跨平台, 边缘设备]
license: MIT
kind: 推理框架 / 服务引擎
stars: 130185
supports: [GGUF, CPU / Metal / CUDA / Vulkan, 1.5~8bit 量化, 无 Python 依赖]
pain: 上游更新极快，围绕它做的二方封装经常与主干不兼容
links:
  github: https://github.com/ggml-org/llama.cpp
---

## 它解决什么

不想买 GPU 也想跑模型？llama.cpp 的答案是：**把量化做到极致，然后让 CPU 也能推理**。
它定义了 GGUF 格式，Q4_K_M 这类量化档位如今是全网通用的语言。

在很多边缘场景（工控机、Mac、树莓派、离线设备）里，它是唯一能跑通的方案。

## 什么时候用它

- 目标机器没有 NVIDIA 卡（Mac / 纯 CPU / 国产硬件）→ 基本只有它。
- 需要单文件、零依赖、可离线分发的推理程序 → 它的二进制可以直接拷走。
- 想跑 GGUF 量化模型（社区量化版本最多）→ 它就是这些权重的原生运行时。

## 上手难点

- 量化档位选择是门手艺：Q4_K_M 通常是质量/体积的甜点，Q2/Q3 掉点明显。
- 上游几乎每天合并 PR，第三方 GUI 和服务化封装（很多"一键包"）常常落后主干几周。
- 高并发服务不是它的强项，超过单机并发阈值就该校准到 [vLLM](/deploy/vllm/) 这类引擎。
- 想省掉编译和参数调整，直接用 [Ollama](/deploy/ollama/)，底层就是它。