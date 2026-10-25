---
title: "MOSS-Image-Base"
org: "复旦大学 OpenMOSS"
family: "MOSS-Image"
released: 2026-10-11
added: 2026-10-25
summary: "MOSS-Image 的基座权重（5B 单流 DiT，未 SFT）：官方建议拿它做继续训练与 LoRA，直接出图请用同批的 SFT 版；Apache-2.0。"
tags: [DiT]
license: "Apache-2.0"
commercial: 可商用
output: image
architecture: "单流 DiT（42 层，Qwen3.5-9B 文本编码器 + FLUX.2 VAE，Muon 优化器训练）；未做 SFT 的基座"
params: "5B"
links:
  hf: "https://huggingface.co/OpenMOSS-Team/MOSS-Image-Base"
  github: "https://github.com/OpenMOSS/MOSS-Image"
  paper: "https://arxiv.org/abs/2610.23374"
---
