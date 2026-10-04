---
title: OpenLake
org: openlake-project
released: 2026-04-27
added: 2026-10-04
summary: 面向 GPU 工作负载的分布式存储引擎（Rust + io_uring），主打小 I/O 的高吞吐与持久化：对推理的价值主要在 KV cache 卸载——用 GPU 节点的内存与磁盘扩出 PB 级 KV 池，长 prompt 省掉重复 prefill。
tags: []
license: Apache-2.0
params: 存储引擎 / KV cache 卸载
links:
  github: https://github.com/openlake-project/openlake
  docs: https://theopenlake.com
---

## 它解决什么

长上下文与多轮会话会把 KV cache 撑得远超显存，而 GPU 空等 I/O 就是纯浪费。
OpenLake 是给 AI 基础设施用的存储引擎：GPU 节点参与组网，把本机内存与磁盘聚成可持续读写、
可持久化的 KV 池——推理引擎写入一次 KV，之后毫秒级读回，重复或很长的 prompt 因此省掉 prefill。
README 记录的案例包括管理 100TB 级 KV cache、以及把 KV 卸载到分层存储带来的吞吐提升。

除推理侧，它还面向向量索引、训练侧的 checkpoint 与随机读、以及 agent 的长上下文存储。

## 什么时候用它

- 长上下文 / 多轮 / agent 场景里 KV cache 成为瓶颈，显存里放不下又要反复重算。
- 已经在用 [vLLM](/deploy/vllm/) → 官方提供 `openlake-vllm` 连接器，
  通过 `--kv-transfer-config` 挂上即可，基本不改现有部署。
- 训练侧需要更快的 checkpoint 存取与大量小文件随机读。

## 上手难点

- 它是基础设施件，要在 GPU 节点上组集群才有意义，单机试用体会不到价值。
- KV 卸载的收益与 prompt 复用率强相关：一次性短 prompt 的场景提升有限。
- 存储端与连接器版本要一起升，接入前建议按官方 quickstart 小规模验证。