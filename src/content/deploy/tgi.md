---
title: TGI（Text Generation Inference）
org: Hugging Face
released: 2022-10-08
added: 2026-10-03
summary: Hugging Face 的文本生成推理服务，曾是与 vLLM 并列的两大托管推理引擎之一；仓库 2026-03 起归档、停止维护。
tags: [推理引擎, OpenAI 兼容, 已归档]
license: Apache-2.0
kind: 推理框架 / 服务引擎
stars: 10884
supports: [Flash Attention, 连续批处理, OpenAI 兼容接口, HF Inference Endpoints 同款技术栈]
pain: 仓库已归档（archived），只读维护，新项目不建议再选
status: deprecated
links:
  github: https://github.com/huggingface/text-generation-inference
  docs: https://huggingface.co/docs/text-generation-inference
---

## 它解决什么

TGI 是 Hugging Face 官方推理服务（Inference Endpoints）背后的开源引擎：
Flash Attention + 连续批处理，把 HF 模型库里的模型直接变成
OpenAI 兼容的 HTTP 服务。过去两年它和 vLLM 是托管推理的两个默认选项。

## 什么时候用它

- 存量系统已经在用 TGI → 继续维护没问题，镜像和文档都还在。
- 了解 HF Inference Endpoints 的底层机制 → 看它的实现最直接。
- **新项目不建议再选**：仓库已归档，功能冻结。

## 上手难点

- 已归档意味着安全修复与模型支持都不再跟进，长期风险明确。
- 性能上限低于当前活跃的 vLLM / TensorRT-LLM 优化路线。
- 迁移成本低（接口同为 OpenAI 兼容），没有留下的强理由。
