---
title: "gpt-oss-120b"
org: "OpenAI"
family: "OpenAI"
released: 2025-08-05
added: 2026-10-03
summary: "OpenAI 时隔六年重新放出开放权重模型，MXFP4 原生量化后单张 80G 卡就能跑。"
tags: ["MoE", "纯文本"]
license: "Apache-2.0"
commercial: 可商用
params: "117B (激活 5.1B)"
context: "128K"
vram: "单张 H100 80G 可用（原生 MXFP4）"
modalities: [text]
deploys: [vllm, llama-cpp, ollama]
links:
  hf: "https://huggingface.co/openai/gpt-oss-120b"
  github: "https://github.com/openai/gpt-oss"
  paper: "https://arxiv.org/abs/2508.10925"
  demo: "https://gpt-oss.com"
---
