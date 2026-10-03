---
title: "Llama 4 Maverick"
org: "Meta"
family: "Meta"
released: 2025-04-05
added: 2026-10-03
summary: "Meta 第一个 MoE 开源旗舰，400B 总参数只激活 17B，原生多模态并带 1M 上下文。"
tags: ["MoE", "可识别图像"]
license: "Llama 4 Community License"
commercial: 有条件可商用
params: "400B (激活 17B)"
context: "1M"
vram: "BF16 需 8 卡 80G 级别；INT4 量化后 4×80G"
modalities: [text, image]
deploys: [vllm, sglang]
links:
  hf: "https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E-Instruct"
  demo: "https://www.llama.com"
---
