---
title: Unsloth
org: Unsloth AI
released: 2023-11-29
added: 2026-10-03
summary: 本地微调与量化（GGUF / MLX / FP8 / NVFP4 等）的事实标准工具，量化后直接喂给 llama.cpp 或 Ollama 就能跑。
tags: [量化, 微调, GGUF, 本地部署, 训练]
license: Apache-2.0
kind: 支撑性生态
stars: 77156
supports: [GGUF / MLX / FP8 / NVFP4 量化, 4bit 快微调, 128K 上下文训练, 本地运行 UI, HF 量化工作流]
pain: 以训练/量化为主，推理服务化要走配套引擎；量化档位效果需要自己试
links:
  github: https://github.com/unslothai/unsloth
  docs: https://unsloth.ai/docs
---

## 它解决什么

社区里大量"好用的量化权重"都出自 Unsloth：它的 4bit 快微调和量化流水线
把"微调一个模型再压到能本地跑"的成本压到个人 GPU 可承受的范围。
仓库同时带一个本地 UI，可以直接运行 GGUF / MLX 权重跑推理与生成，
官方仓库描述把它定位为"本地运行与训练 LLM 和扩散模型的 UI"。

## 什么时候用它

- 要自训或改一个开源模型，再量化成本地部署 → 量化环节基本默认用它。
- 想看某模型 Q4 / Q8 量化后质量掉多少 → 它的官方量化是社区基准。
- 想在本地快速跑一个 GGUF / MLX 权重试试 → 它的 UI 可以直接用。

## 上手难点

- 它解决的是"准备权重"，生产推理还是要接 vLLM / llama.cpp 这类引擎。
- 量化档位的取舍（质量 vs 体积）没有标准答案，长上下文场景要自己验证。
- 训练侧的显存要求不低，小卡只能做小模型或 LoRA。
