---
title: Qwen3-235B-A22B
org: 阿里通义千问
released: 2025-04-29
added: 2026-10-02
summary: 235B 的 MoE 旗舰，单个模型里同时支持"深度思考"和"快速回答"两种模式，Apache-2.0 可商用。
tags: [MoE, 中文, 商用友好, 推理, 长上下文]
license: Apache-2.0
params: 235B (激活 22B)
context: 128K
vram: 激活参数小，A100 80G 单卡可跑；量化后 48G 显存也能用
modalities: [text]
deploys: [vllm, sglang, ollama]
links:
  hf: https://huggingface.co/Qwen/Qwen3-235B-A22B
  github: https://github.com/QwenLM/Qwen3
  demo: https://chat.qwen.ai
---

## 为什么值得看

Qwen3 这一代把"思考模式"和"非思考模式"做进了同一个权重：同一个模型，
`enable_thinking` 打开就走长推理，关掉就是低延迟对话，不用再维护两个模型。

另一个重点是 Apache-2.0——中文能力第一梯队里，许可证最干净的一个。
对要做商业产品的人来说，这比多几个点的 benchmark 重要得多。

## 部署要点

- 235B 总参数、22B 激活，显存需求看的是总参数量（权重都要装进去），不是激活量。
- vLLM / SGLang 都原生支持，`--enable-reasoning` 之类的开关版本间改过名，以对应版本的文档为准。
- 上下文 128K，但长上下文对 KV cache 显存占用增长很快，实际用建议 32K 起步。
- 官方同时放了 30B-A3B、4B 等小号版本，按硬件挑，别硬上 235B。

## 配套方案

[SGLang](/deploy/sglang/) 在多轮对话场景下前缀缓存收益明显；想零配置先跑通就用 [Ollama](/deploy/ollama/)。