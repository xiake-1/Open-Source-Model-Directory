---
title: "Qwen3-235B-A22B"
org: "阿里通义千问"
family: "Qwen"
released: 2025-04-29
added: 2026-10-03
summary: "235B 的 MoE 旗舰，官方 128K 上下文（原生 32K，需 YaRN 扩展），同一个模型里同时支持深度思考与快速回答两种模式，Apache-2.0 可商用。"
tags: ["MoE", "纯文本"]
license: "Apache-2.0"
commercial: 可商用
params: "235B (激活 22B)"
context: "128K"
vram: "激活参数少，单卡 80G 可跑；量化后 48G 显存也能用"
modalities: [text]
deploys: [vllm, sglang, ollama]
links:
  hf: "https://huggingface.co/Qwen/Qwen3-235B-A22B"
  github: "https://github.com/QwenLM/Qwen3"
  demo: "https://chat.qwen.ai"
---
