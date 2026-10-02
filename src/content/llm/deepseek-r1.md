---
title: DeepSeek-R1
org: DeepSeek
released: 2025-01-20
added: 2026-10-02
summary: 第一个把"长思维链 + 纯强化学习"开源出来的推理模型，能力对标闭源 o1，MIT 许可可直接商用。
tags: [推理, MoE, 中文, 商用友好, 长上下文]
license: MIT
params: 671B (激活 37B)
context: 128K
vram: 全量需 8×H200 级别；社区 4bit 量化可压到 2×RTX 3090
modalities: [text]
deploys: [vllm, sglang]
links:
  hf: https://huggingface.co/deepseek-ai/DeepSeek-R1
  github: https://github.com/deepseek-ai/DeepSeek-R1
  paper: https://arxiv.org/abs/2501.12948
---

## 为什么值得看

它是"开源模型追平闭源推理能力"的那个转折点。技术上最有价值的部分是 R1-Zero：
不做 SFT，直接在 base 模型上用可验证奖励做 RL，思维链自己长出来。

对使用者更实际的意义是 **MIT 许可**——蒸馏出来的小模型（1.5B~70B 的 R1-Distill 系列）同样可以商用，
这让"本地跑一个会推理的模型"第一次变成了合规且便宜的事。

## 部署要点

- 671B MoE 全量推理需要多卡，个人基本只能走量化或蒸馏版。
- 4bit/2bit 量化版本在社区很成熟，单机双卡 24G 可以跑起来（速度不保证）。
- 只想体验推理能力，直接上 32B/14B 的 Distill 版本，单卡 24G 足够。
- 官方推荐的推理参数：temperature 0.5~0.7，不要用 greedy，否则容易陷入重复。

## 配套方案

[vLLM](/deploy/vllm/) 或 [SGLang](/deploy/sglang/) 都能跑，量大选 SGLang 的前缀缓存，首次部署选 vLLM。