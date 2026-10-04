---
title: vLLM Semantic Router
org: vLLM 项目（vllm-project）
released: 2025-08-26
added: 2026-10-04
summary: 面向异构推理的可编程 Mixture-of-Models 路由层：按请求信号、用户偏好与应用策略挑选（或组合）模型路径，把「这个请求该走哪个模型」从应用代码里搬到基础设施层。
tags: []
license: Apache-2.0
params: 服务化 / 模型路由
links:
  github: https://github.com/vllm-project/semantic-router
  docs: https://vllm-sr.ai/docs/intro/
---

## 它解决什么

模型各有擅长，算力散在 GPU、加速卡、边缘与云上，「什么请求走什么模型」通常被硬编码进应用。
vLLM Semantic Router 把这件事做成一层路由：评估请求信号、用户偏好与策略，
为每个请求选择或组合模型路径，从而在不改应用的前提下调整质量、成本、延迟、隐私与安全。

它和 [vLLM](/deploy/vllm/) 的关系是分工：vLLM 负责把模型跑好，它负责决定跑哪个、怎么组合。

## 什么时候用它

- 已经有多套模型 / 多套硬件，需要在成本、延迟与数据边界之间按请求分流。
- 想把「该不该上大模型、要不要走推理链路」变成可配置策略，而不是在业务代码里写 if。
- 需要把请求留在某些边界内（边缘 / 私有集群 / 云）→ 路由层可以直接表达位置约束。

## 上手难点

- 它不替你跑模型，底层仍要自备 [vLLM](/deploy/vllm/) 这类推理引擎。
- 策略与信号要先想清楚，否则路由规则会变成另一坨逻辑；版本迭代快（README 的 news 从 v0.1 到 v0.3）。
- 初次接入建议先用官方文档里的基线配置跑通，再逐步加策略。