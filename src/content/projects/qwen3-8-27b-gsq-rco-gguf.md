---
title: Qwen3.8-27B GSQ-RCO GGUF
org: ISTA-DASLab
released: 2026-08-28
added: 2026-10-03
family: Qwen
summary: ISTA DASLab 的非均匀 GGUF 量化：GSQ 学每个张量的量化网格，RCO 在尺寸预算内给每个张量分配位宽，3.5 bpw 的 IQ3_S 在 AIME25 / LiveCodeBench 上与 BF16 基座打平，11.8 GB 起在原版 llama.cpp / Ollama 里就能跑。
tags: []
license: Apache-2.0
params: 非均匀量化（GGUF）
links:
  hf: "https://huggingface.co/ISTA-DASLab/Qwen3.8-27B-GSQ-RCO-GGUF"
  github: https://github.com/IST-DASLab/GSQ
  paper: https://arxiv.org/abs/2605.00649
---

## 它解决什么

常规 GGUF 量化对所有张量用同一种量化类型，尺寸预算靠统一牺牲精度换。
GSQ-RCO 用 GSQ（Gumbel-Softmax Quantization）先学每个张量的网格分配与分组缩放，
再用 RCO（Riemannian Constrained Optimization）在总尺寸预算内逐张量挑量化类型。
产物是标准 GGUF，不需要 fork，原版 llama.cpp / Ollama / LM Studio 直接加载。

## 什么时候用它

- 想把 Qwen3.8-27B 塞进 12–24 GB 的卡：IQ2_XS 8.4 GB、IQ2_S 9.3 GB、IQ3_XXS 10.1 GB、IQ3_S 11.8 GB，各档都附实测分数。
- 想验证「训练后量化能不能逼近低比特原生训练」：IQ3_S 在 AIME25 与 LiveCodeBench 上追平 BF16，GPQA-Diamond 差 0.51 分。

## 上手难点

- 想跑多模态要再下一个 0.9 GB 的 mmproj（视觉编码器 + 投影器），各量化档通用。
- 可选的 `-mtp` 构建（投机解码用）每个文件再大 ~0.35 GB，按需选。
