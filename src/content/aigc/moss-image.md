---
title: "MOSS-Image"
org: "复旦大学 OpenMOSS"
family: "MOSS-Image"
released: 2026-10-11
added: 2026-10-25
summary: "复旦 OpenMOSS 的 5B 单流 DiT 文生图（SFT 版），强项是中英复杂文字渲染与 JSON 布局控制（还能增删物体）；Apache-2.0，未 SFT 的基座另有一条。"
tags: [DiT]
license: "Apache-2.0"
commercial: 可商用
output: image
architecture: "单流 DiT（42 层，Qwen3.5-9B 文本编码器 + FLUX.2 VAE，Muon 优化器训练）"
params: "5B"
links:
  hf: "https://huggingface.co/OpenMOSS-Team/MOSS-Image-SFT"
  github: "https://github.com/OpenMOSS/MOSS-Image"
  paper: "https://arxiv.org/abs/2610.23374"
  demo: "https://huggingface.co/spaces/OpenMOSS-Team/MOSS-Image"
---
