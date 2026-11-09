---
title: "SenseNova-Loop-9B-Preview"
org: "商汤 SenseNova"
family: "SenseNova"
released: 2026-10-30
added: 2026-11-09
summary: "商汤 10-30 发的循环式多模态预览版：4–27 层共享块重复执行两次（32 层权重、每次前向 56 次层执行），配双流 mHC 残差流（Sinkhorn 约束）与 3:1 线性:全注意力混合，9B 总参（推理参数 14.6B），256K 上下文，支持 MTP；Apache-2.0，技术报告 TBD。"
tags: [Dense, 可识别图像]
license: "Apache-2.0"
commercial: 可商用
params: "9B"
context: "256K"
modalities: [text, image]
deploys: [vllm, sglang]
links:
  hf: "https://huggingface.co/sensenova/SenseNova-Loop-9B-Preview"
  github: "https://github.com/OpenSenseNova/SenseNova-Loop"
---
