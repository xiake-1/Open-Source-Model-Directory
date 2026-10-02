---
title: gpt-oss-120b
org: OpenAI
released: 2025-08-05
added: 2026-10-02
summary: OpenAI 时隔六年重新放出的开放权重模型，MXFP4 原生量化后单张 80G 卡就能跑，Apache-2.0。
tags: [MoE, 商用友好, 推理, 单卡可跑, 英文]
license: Apache-2.0
params: 117B (激活 5.1B)
context: 128K
vram: 单张 H100 80G 可用（原生 MXFP4），消费级卡需进一步量化
modalities: [text]
deploys: [vllm, llama-cpp, ollama]
links:
  hf: https://huggingface.co/openai/gpt-oss-120b
  github: https://github.com/openai/gpt-oss
  paper: https://arxiv.org/abs/2508.10925
---

## 为什么值得看

少数几个"发布即带原生低精度权重"的模型：官方直接提供 MXFP4 版本，
不用等社区做量化，装进 80G 显存就能跑。

许可证是 Apache-2.0，没有 Llama 那种"月活超过 7 亿要单独授权"的附加条款。

## 部署要点

- 原生 MXFP4 是它的核心卖点：单卡 80G 直接起，这是同规模模型里最省事的一个。
- 有 `reasoning` 三档（low / medium / high），推理档位越高 token 消耗越大。
- 中文能力一般，主要面向英文与工具调用场景，别指望它替代中文模型。
- 小号版本 gpt-oss-20b 可以跑在 16G 显存的消费级卡上，适合本地实验。

## 配套方案

[llama.cpp](/deploy/llama-cpp/) 支持它的 MXFP4 权重，想在自己机器上跑优先看这个。