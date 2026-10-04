---
title: llm-d
org: llm-d 社区（CNCF Sandbox）
released: 2025-04-29
added: 2026-10-04
summary: Kubernetes 上的分布式推理栈：在 vLLM / SGLang 之上提供前缀缓存与负载感知路由、分层 KV cache 卸载、prefill-decode 分离与宽专家并行，以及 SLO 感知的弹性扩缩与多租户流控。
tags: []
license: Apache-2.0
params: 分布式推理 / Kubernetes
links:
  github: https://github.com/llm-d/llm-d
  docs: https://llm-d.ai/docs/getting-started/quickstart
---

## 它解决什么

模型服务器（[vLLM](/deploy/vllm/)、[SGLang](/deploy/sglang/)）解决的是「单机把模型跑快」，
但生产流量还要解决另一层：请求该发给哪个副本、KV cache 怎么复用、大 MoE 怎么跨机拆分、
多租户下怎么不过载。llm-d 就是这一层——智能路由（前缀缓存感知 / 负载感知）、
KV cache 分层卸载到 CPU 或磁盘、prefill 与 decode 分离、宽专家并行，
以及基于实时推理信号的弹性与流控。

它是 CNCF Sandbox 项目，由 Red Hat、Google Cloud、IBM Research、CoreWeave、NVIDIA 共同发起，
架构上站在 Kubernetes 与模型服务器之间。

## 什么时候用它

- 已经在 K8s 上用 [vLLM](/deploy/vllm/) / [SGLang](/deploy/sglang/) 服务模型，
  吞吐、TTFT 或单位成本还需要再进一层。
- 要跑 DeepSeek-R1、GPT-OSS 这类大 MoE 的多机部署（prefill/decode 分离 + 宽专家并行）。
- 需要多租户下的流控与 SLO 感知扩缩，而不是手工调副本数。

## 上手难点

- 只有 Kubernetes 路线（Helm / kustomize 与官方 well-lit path），没有单机模式。
- 收益来自拓扑调优：路由策略、KV 卸载层数、PD 分离与并行度组合很多，
  官方建议从 Optimized Baseline 起步再改。
- README 的性能倍数都绑定特定硬件与拓扑（如 8×MI300X、16×16 B200），换环境要重新基准。