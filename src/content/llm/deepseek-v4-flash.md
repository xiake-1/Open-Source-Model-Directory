---
title: "DeepSeek-V4-Flash"
org: "DeepSeek 深度求索"
family: "DeepSeek"
released: 2026-04-22
added: 2026-10-03
summary: "284B 只激活 13B，1M 上下文下的单 token 推理成本只有上一代的一成，MIT 许可。"
tags: ["MoE", "纯文本"]
license: "MIT"
commercial: 可商用
params: "291B (激活 13B)"
context: "1M"
vram: "FP4+FP8 混合精度，数十卡级别可全量部署"
modalities: [text]
deploys: [vllm, sglang]
links:
  hf: "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash"
  paper: "https://arxiv.org/abs/2606.19348"
  demo: "https://chat.deepseek.com"
---
