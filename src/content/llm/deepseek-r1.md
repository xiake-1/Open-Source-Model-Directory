---
title: "DeepSeek-R1"
org: "DeepSeek 深度求索"
family: "DeepSeek"
released: 2025-01-20
added: 2026-10-03
summary: "第一个把长思维链纯强化学习路线开源出来的推理模型，能力对标闭源 o1，MIT 许可可直接商用。"
tags: ["MoE", "纯文本"]
license: "MIT"
commercial: 可商用
params: "684B (激活 37B)"
context: "128K"
vram: "全量需 8 卡 H200 级别；4bit 量化后 2×RTX 3090 可跑"
modalities: [text]
deploys: [vllm, sglang]
links:
  hf: "https://huggingface.co/deepseek-ai/DeepSeek-R1"
  github: "https://github.com/deepseek-ai/DeepSeek-R1"
  paper: "https://arxiv.org/abs/2501.12948"
  demo: "https://chat.deepseek.com"
---
