---
title: Llama 3.3 70B Instruct
org: Meta
released: 2024-12-06
added: 2026-10-02
summary: 用 70B 的体量做出接近 405B 的效果，是目前"单机多卡能稳稳跑起来"里最成熟的一档。
tags: [Dense, 英文, 长上下文, 生态成熟, 微调友好]
license: Llama 3.3 Community License
params: 70B (Dense)
context: 128K
vram: 4bit 量化单卡 48G；BF16 需 2×80G
modalities: [text]
deploys: [vllm, llama-cpp, ollama]
links:
  hf: https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct
  github: https://github.com/meta-llama/llama-models
---

## 为什么值得看

它不是最强的，但大概是**生态最厚**的：所有推理框架、微调工具、量化方案都拿它当第一适配对象，
遇到问题最容易搜到答案。做工程选型时，"坑少"经常比"分数高"更重要。

Dense 结构（不是 MoE）也让显存估算和吞吐调优更可预测。

## 部署要点

- 70B Dense 在 BF16 下约 140G 权重，需要 2×80G 或 4×48G；4bit AWQ/GPTQ 可压到单卡 48G。
- 许可证不是标准开源协议：月活超 7 亿需要单独申请，商用前请读原文。
- 中文能力弱于国产模型，中文场景建议直接换 Qwen / GLM 系。
- 微调生态（LoRA/QLoRA）成熟，是这个模型真正的护城河。

## 配套方案

[vLLM](/deploy/vllm/) 是生产部署的默认选择；[llama.cpp](/deploy/llama-cpp/) 适合本机 GGUF 量化跑。