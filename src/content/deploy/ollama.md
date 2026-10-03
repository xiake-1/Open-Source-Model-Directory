---
title: Ollama
org: Ollama
released: 2023-07-24
added: 2026-10-02
summary: 把"下载模型 + 量化 + 起服务"压成一条命令的工具，底层基于 llama.cpp，适合快速验证和个人本地使用。
tags: [服务化, 本地部署, 易用, 快速上手, 桌面端]
license: MIT
kind: 一体化本地运行工具
stars: 182078
supports: [一行命令拉模型, Modelfile 自定义, OpenAI 兼容 API, GGUF, 跨平台]
pain: 默认参数偏保守，性能调优空间小；服务端能力弱于专业推理引擎
links:
  github: https://github.com/ollama/ollama
  docs: https://ollama.com/docs
---

## 它解决什么

自部署最大的摩擦不是推理，而是**环境**：装依赖、下权重、写配置、起服务。
Ollama 把这些收敛成 `ollama run <model>` 一条命令，
并且给了 Modelfile 来固化 system prompt 和参数——相当于模型的 Dockerfile。

## 什么时候用它

- 个人本地使用、原型验证、给非工程同事演示 → 最省时间。
- 想在自己的应用里快速接一个本地模型，需要 OpenAI 兼容接口 → 直接可用。
- 做 Agent 原型时把模型跑在笔记本上 → 它的资源占用比较友好。

## 上手难点

- 默认参数（上下文长度、并行数）偏保守，长上下文场景必须手动改，否则会被静默截断。
- 它是"好用优先"的封装，吞吐和并发能力明显弱于 [vLLM](/deploy/vllm/) / [SGLang](/deploy/sglang/)。
- 底层版本滞后于 [llama.cpp](/deploy/llama-cpp/) 主干，新模型支持会晚几周到几个月。
- 别拿它做多用户生产服务——那是另一个量级的需求。