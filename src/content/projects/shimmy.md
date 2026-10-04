---
title: Shimmy
org: Michael A. Kuykendall
released: 2025-08-28
added: 2026-10-04
summary: 单个二进制的 OpenAI 兼容 GGUF 推理服务：底层是纯 Rust 的 WebGPU（WGSL）引擎，不要 Python 运行时也不要 C++ 工具链，模型规格直接从 GGUF 元数据推导。
tags: []
license: Apache-2.0
params: 推理引擎 / GGUF
links:
  github: https://github.com/Michael-A-Kuykendall/shimmy
---

## 它解决什么

把本地模型接给现有工具，通常要先装 Python 环境、编译 C++ 后端、再配一堆后端开关。
Shimmy 把这些压成一个二进制：它本体是 OpenAI 兼容的推理服务，引擎是纯 Rust 的
WebGPU（WGSL）实现（Airframe），没有 Python 运行时、没有 C++ 工具链、没有后端标志；
模型规格从 GGUF 元数据自动推导，不需要按模型写死常量。

它强调确定性：F32 累加，同模型 + 同 seed + 同参数应得同样输出；扩展上下文走 YaRN RoPE
（`SHIMMY_MAX_CTX`），对长文场景有用。

## 什么时候用它

- 想让 [Open WebUI](/deploy/open-webui/) 或其他 OpenAI 兼容客户端「指过去就能用」，
  又不想引入 Python / C++ 依赖。
- 硬件是 NVIDIA、AMD、Intel、核显或 Apple Silicon 的混合环境 → WebGPU 一份代码覆盖。
- 需要在复现性上较真（同输入应得同输出）的场景。

## 上手难点

- README 只对 12 个家族、26 个「模型 + 量化」组合做了认证测试（多为 Q4_K_M），冷门架构不保证。
- SafeTensors 目前只支持加载，原生推理仍在路线图上；主力仍是 GGUF。
- 个人维护的项目，README 里明确靠赞助支撑开发，长期可用性要自己评估。