---
title: "Matrix-Game 4.0"
org: "昆仑万维 Skywork"
family: "Matrix-Game"
released: 2026-10-12
added: 2026-10-18
summary: "Matrix-Game 第四代：世界状态交给可执行游戏引擎、Coding Agent 写新规则，模型只把低模代理重渲染成成品画面；中世纪城堡 / 古埃及 / 城市竞速三个场景各一份 5B 因果 DiT。"
tags: [DiT]
license: "Apache-2.0"
commercial: 可商用
output: video
architecture: "因果 DiT（蒸馏到 1–2 步去噪、滚动 KV 缓存 + 按相机位姿检索的空间记忆）；游戏引擎维护世界状态并出低模代理，模型只做重渲染，共享 Wan2.2-Fun-5B-Control 的 VAE 与 umT5"
params: "5B（单场景权重）"
vram: "单张消费级显卡常驻（官方演示 RTX 5090，文本编码器 + DiT + VAE 同卡）"
links:
  hf: "https://huggingface.co/Skywork/Matrix-Game-4.0"
  github: "https://github.com/SkyworkAI/Matrix-Game"
---
