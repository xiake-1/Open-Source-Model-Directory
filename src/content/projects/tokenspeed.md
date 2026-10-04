---
title: TokenSpeed
org: LightSeek Foundation
released: 2026-05-06
added: 2026-10-04
summary: 面向 agentic 负载的推理引擎：把控制面（C++ 有限状态机，请求生命周期与 KV 归属在编译期受类型约束）与执行面（Python）拆开，内核做成可插拔注册表，目标是对齐 TensorRT-LLM 的性能与 vLLM 的易用性。
tags: []
license: MIT
params: 推理引擎 / Agent 负载
links:
  github: https://github.com/lightseekorg/tokenspeed
  docs: https://lightseek.org/tokenspeed/
---

## 它解决什么

agent 负载的特征是长会话、前缀高度复用、并发里夹着工具调用，和「大 batch 离线吞吐」不是一回事。
TokenSpeed 为此把引擎拆成两层：控制面是 C++ 的有限状态机，请求生命周期、KV cache 归属与
overlap 时序都在编译期受类型系统约束；执行面是 Python，保持研究者改得动的开发速度。
内核被当作一等子系统：可插拔、有统一注册表，README 提到其中包含 Blackwell 上较快的
MLA（Multi-head Latent Attention）实现之一。

它由非营利的 LightSeek 基金会维护（NVIDIA、AMD 等厂商参与），并已进入 PyTorch 生态图谱。

## 什么时候用它

- 生产环境的 agent / 长会话负载，需要前缀复用与并发下的稳定延迟。
- 想跟进新模型的 day-0 支持：README 的 news 里列了 Qwen3.8、Kimi K3、GLM 5.3 Flash 等在发布当天可用。
- 在意引擎中立性（非商业公司主导）与内核可替换性。

## 上手难点

- 硬件门槛偏新：公开的性能对比集中在 B200 / GB300 这一代。
- C++ 控制面 + Python 执行面的组合要按官方 recipes 配，自造集成容易踩生命周期规则。
- 生态仍在扩张期，遇到问题主要靠官方文档与社区。