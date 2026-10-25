---
title: "Hy-Nomas"
org: "腾讯混元"
family: "Hunyuan"
released: 2026-10-21
added: 2026-10-25
summary: "腾讯混元的可交互世界生成模型：一段一段把世界生成出来，文本指令与相机轨迹随时改，跨段 KV 缓存续写同一个世界，另配 280 例的 Hy-Nomas-Bench；Apache-2.0。"
tags: [MMDiT]
license: "Apache-2.0"
commercial: 可商用
output: video
architecture: "分段自回归双流 MMDiT（54 块）+ Qwen 文本编码器 + 微调过的 PixelUMM 视频解码器，跨段持久 KV 缓存；蒸馏版 4 步去噪、704×1280 / 24fps"
params: "8.6B"
links:
  hf: "https://huggingface.co/tencent/Hy-Nomas"
  github: "https://github.com/Tencent-Hunyuan/Hy-Nomas"
  demo: "https://hy-nomas.hy.tencent.com/"
---
