---
title: "NVIDIA-Nemotron-3.5-Bolt-74B-A9B"
org: "NVIDIA"
family: "Nemotron"
released: 2026-10-09
added: 2026-10-25
summary: "为「本地跑日常 agent 任务」搜出来的 74B 激活 9B Mamba2-Transformer 混合 MoE（带视觉编码器），256K 上下文；官方另有压到 24GB 的原生 2-bit 版本。"
tags: [MoE, 可识别图像]
license: "OpenMDW-1.1"
commercial: 可商用
params: "74B (激活 9B)"
context: "256K"
modalities: [text, image]
deploys: [vllm, llama-cpp]
links:
  hf: "https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-74B-A9B-BF16"
---
