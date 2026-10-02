---
title: FLUX.1 [schnell]
org: Black Forest Labs
released: 2024-08-01
added: 2026-10-02
summary: 与 [dev] 同架构但采用 Apache-2.0、4 步即可出图的版本，是"可商用 + 秒级出图"的实用解。
tags: [图像生成, DiT, 商用友好, 快速出图, 蒸馏]
license: Apache-2.0
output: image
architecture: DiT (12B, 时序蒸馏)
vram: 16G 舒适；量化后 8G 可跑
deploys: [comfyui]
links:
  hf: https://huggingface.co/black-forest-labs/FLUX.1-schnell
  github: https://github.com/black-forest-labs/flux
---

## 为什么值得看

schnell 是 [dev] 的**时序蒸馏**版本：1~4 步就能出图，速度快一个数量级，
许可证换成了干净的 Apache-2.0。做批量出图、实时应用、或者要商用的场景，
它通常比 [dev] 更合适——质量差距远小于速度差距。

## 部署要点

- 步数 1~4，guidance 固定 0（蒸馏模型不吃 CFG），照着默认值用就行。
- 蒸馏模型的通病是多样性下降，同一提示词出图趋同，需要靠随机种子和提示词变体补。
- 和 [FLUX.1 dev](/aigc/flux-1-dev/) 共用一套 ComfyUI 工作流，换权重即可切换。

## 配套方案

[ComfyUI](/deploy/comfyui/)；想批量出图可配合服务化的队列工具。