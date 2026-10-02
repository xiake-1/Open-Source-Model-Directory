---
title: Stable Diffusion 3.5 Large
org: Stability AI
released: 2024-10-22
added: 2026-10-02
summary: SD 系列的 MMDiT 架构大版本，8B 参数，年收入低于 100 万美元可免费商用。
tags: [图像生成, MMDiT, 可商用限制, 微调友好]
license: Stability AI Community License
output: image
architecture: MMDiT (8B)
vram: 18G 舒适；量化后 10G 可跑
deploys: [comfyui]
links:
  hf: https://huggingface.co/stabilityai/stable-diffusion-3.5-large
  github: https://github.com/Stability-AI/sd3.5
  paper: https://arxiv.org/abs/2403.03206
---

## 为什么值得看

SD 系列转向 MMDiT（多模态扩散 Transformer）后的主力开放权重版本。
相对 FLUX，它的优势在**微调生态和授权门槛**：社区 LoRA 数量多，
许可证对年收入 100 万美元以下的组织免费商用。

## 部署要点

- 许可证是"分档商用"：低于 100 万美元年收入免费，超过需向 Stability 申请企业授权，别只看"开源"两个字。
- 需要三个文本编码器（CLIP-L / CLIP-G / T5-XXL），显存和加载时间都比你预期的高。
- 提示词遵循度弱于 FLUX，长提示词容易丢信息，建议用 Danbooru 风格短标签。
- 微调（DreamBooth / LoRA）文档和脚本比 FLUX 齐全，是它现在的主要价值。

## 配套方案

[ComfyUI](/deploy/comfyui/)；训练 LoRA 用社区现成的 sd-scripts 更省事。