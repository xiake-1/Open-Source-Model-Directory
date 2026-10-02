---
title: vLLM
org: vLLM 社区（原 UC Berkeley）
released: 2023-06-20
added: 2026-10-02
summary: 生产环境部署 LLM 的默认答案：PagedAttention 把 KV cache 碎片化问题解决掉，吞吐比朴素实现高一个量级。
tags: [推理引擎, 高吞吐, 量化, OpenAI 兼容, 生产可用]
license: Apache-2.0
kind: 推理引擎
supports: [PagedAttention, 张量并行, FP8/AWQ/GPTQ, OpenAI 兼容 API, 多模态]
pain: 版本迭代快，参数名和模型支持列表跨版本变化大，务必锁定版本再上生产
links:
  github: https://github.com/vllm-project/vllm
  docs: https://docs.vllm.ai
  paper: https://arxiv.org/abs/2309.06180
---

## 它解决什么

自回归推理的瓶颈不在算力，而在**显存里的 KV cache 管理**。
vLLM 用操作系统的虚拟内存思路做 PagedAttention，把 KV cache 分页复用，
显存浪费从 60~80% 降到个位数，同样的卡能塞下数倍的并发。

这是过去两年"自部署 LLM 成本下降"最主要的技术原因之一。

## 什么时候用它

- 要对外提供 API，且关注吞吐和并发成本 → 首选。
- 需要 OpenAI 兼容接口，让现有客户端无痛切换 → 一条命令就能起。
- 需要多卡张量并行、FP8 量化、结构化输出 → 都原生支持。

## 上手难点

- **版本管理是最大的坑**：模型支持列表、启动参数名在版本之间改动频繁，
  网上抄的命令十有八九对不上你装的版本，建议固定镜像 tag / 依赖版本。
- 启动慢（要加载权重并做显存 profiling），不适合按需冷启动的无服务器场景。
- 想要极致吞吐再考虑 [SGLang](/deploy/sglang/)；想零配置先跑通就用 [Ollama](/deploy/ollama/)。