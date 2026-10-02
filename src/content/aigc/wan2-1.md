---
title: Wan2.1
org: 阿里通义万相
released: 2025-02-25
added: 2026-10-02
summary: 14B 视频生成模型，用 Apache-2.0 开放权重，消费级显卡靠量化就能跑，把视频生成的门槛拉下来了。
tags: [视频生成, DiT, 商用友好, 中文, 消费级可跑]
license: Apache-2.0
output: video
architecture: DiT (14B / 1.3B)
vram: 1.3B 版本 8G 可跑；14B 量化后 24G 可跑
deploys: [comfyui]
links:
  github: https://github.com/Wan-Video/Wan2.1
  hf: https://huggingface.co/Wan-AI/Wan2.1-T2V-14B
---

## 为什么值得看

两个点：**Apache-2.0**（视频生成里少见的干净许可）和**同时放出 1.3B 小模型**。
1.3B 版本能在 8G 显存的消费级卡上出 480P 视频，
这是"视频生成从实验室走向个人设备"的实际转折点。

## 部署要点

- 先分清 T2V（文生视频）和 I2V（图生视频）两套权重，别下错。
- 14B 用 FP8 量化可在 24G 卡上跑；1.3B 直接用，速度很适合做原型验证。
- 生成 5 秒 720P 的时间在消费级卡上以十分钟计，批量任务要算好成本。
- 中文提示词友好，与 HunyuanVideo 是同期最值得对比的两个开源方案。

## 配套方案

[ComfyUI](/deploy/comfyui/) 的 Wan 节点已成官方推荐路径。