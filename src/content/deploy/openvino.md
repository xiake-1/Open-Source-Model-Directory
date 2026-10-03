---
title: OpenVINO
org: Intel
released: 2018-10-15
added: 2026-10-03
summary: Intel 官方推理优化工具包，把模型优化部署到 Intel CPU / GPU / NPU，本地 LLM 在 Intel 平台上的官方路线。
tags: [推理框架, Intel, CPU, NPU, 本地部署]
license: Apache-2.0
kind: 推理框架 / 服务引擎
stars: 10944
supports: [Intel CPU / iGPU / Arc GPU / NPU, LLM 推理（OpenVINO GenAI）, 模型优化与量化, 多后端统一 API]
pain: 绑定 Intel 平台；LLM 侧生态薄于 vLLM / llama.cpp
links:
  github: https://github.com/openvinotoolkit/openvino
  docs: https://docs.openvino.ai
---

## 它解决什么

Intel 机器上跑模型，官方答案就是 OpenVINO：它把模型优化（算子融合、
量化）成 Intel 硬件友好的形态，统一覆盖 CPU、核显、Arc 独显和 NPU。
LLM 场景有专门的 OpenVINO GenAI 组件，仓库 topics 明确带 `llm-inference`。

## 什么时候用它

- 全是 Intel 硬件的本地部署（笔记本、工作站、带 NPU 的机型）→ 官方路线。
- 要 NPU 参与推理 → 主流开源引擎里支持 Intel NPU 的基本只有它。
- 已有 OpenVINO 技术栈（视觉模型在用）想扩展 LLM → 统一 API 省事。

## 上手难点

- 平台锁定 Intel，混用 NVIDIA 环境要两套。
- LLM 支持的模型范围与吞吐不及 vLLM / llama.cpp 主线。
- 文档按"Intel 生态"组织，纯 LLM 用户上手曲线偏陡。
