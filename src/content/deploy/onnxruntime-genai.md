---
title: ONNX Runtime GenAI
org: Microsoft
released: 2023-11-13
added: 2026-10-03
summary: 微软 ONNX Runtime 的生成式 AI 扩展，把 LLM 的 ONNX 形态跑在 Windows CPU/GPU 与 Azure 上，Windows 本地部署的官方路线之一。
tags: [推理框架, ONNX, Windows, 本地部署]
license: MIT
kind: 推理框架 / 服务引擎
stars: 1132
supports: [ONNX 模型格式, Windows CPU / DirectML / CUDA, Azure 部署, C / C++ / Python API]
pain: 生态小、模型覆盖面窄；要先把模型转成 ONNX
links:
  github: https://github.com/microsoft/onnxruntime-genai
---

## 它解决什么

很多企业 Windows 环境的默认推理运行时是 ONNX Runtime（视觉、NLP 都在用）。
onnxruntime-genai 把 LLM 接进同一个运行时：统一的 C/C++/Python API、
DirectML 与 CUDA 后端、可直接上 Azure。对"不引入新运行时"的 Windows
本地部署来说，这是微软的官方路线。

## 什么时候用它

- Windows 环境、团队已有 ONNX Runtime 基建 → 加 LLM 不用换栈。
- 要 C++ 原生嵌入（桌面应用内推理）→ API 层最友好。
- 走 Azure 混合部署 → 本地与云上同一套模型格式。

## 上手难点

- 模型要转 ONNX 格式，主流模型的官方 ONNX 权重少，自己转换质量要验证。
- 社区与第三方生态远小于 llama.cpp / vLLM 阵营。
- 高吞吐服务化能力有限，适合单机嵌入场景。
