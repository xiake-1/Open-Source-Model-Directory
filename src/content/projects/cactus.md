---
title: Cactus
org: Cactus Compute
released: 2025-04-23
added: 2026-10-03
summary: 面向手机、手表与机器人的全套端侧栈：量化、CUDA 级内核、运行时与推理引擎一体，把 LLM / Whisper / 扩散模型压进 4GB 内存设备。
tags: []
license: 自定义（仓库未标注 SPDX）
params: 端侧推理引擎
links:
  github: https://github.com/cactus-compute/cactus
  docs: https://cactuscompute.com
---

## 它解决什么

端侧 LLM 的「最后一公里」是硬件差异：ARM 手机、RISC-V 手表、机器人控制器各玩各的。
Cactus 把量化、算子库、调度与推理引擎做成同一套 C++ 栈，跨 Android / iOS / 嵌入式 Linux
复用同一模型文件，官方宣称在 4GB 内存设备上能实时跑多模态模型。

## 什么时候用它

- 产品形态是设备而不是服务器 → 它给的是一套可直接交付的运行时。
- 已有 llama.cpp 但被「每个平台重新调」拖住 → 用它的统一栈替换。
- 商用前先看许可：仓库未标注 SPDX，需与作者书面确认。

## 上手难点

- 文档面向其商业产品线，社区教程少，排错主要靠 issue 区。
- 深度绑定其量化格式，从 GGUF 迁移要跑一遍转换并重新验证精度。
