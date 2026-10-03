---
title: Runanywhere SDK
org: RunanywhereAI
released: 2025-07-22
added: 2026-10-03
summary: 一套「在终端设备上本地跑 AI」的生产级 SDK：C++ 核心 + iOS / Android / Flutter / Web 绑定，把 LLM、VLM 与扩散模型压进手机和手表。
tags: []
license: 自定义（仓库未标注 SPDX）
params: 端侧推理 SDK
links:
  github: https://github.com/RunanywhereAI/runanywhere-sdks
  docs: https://www.runanywhere.ai
---

## 它解决什么

端侧跑 LLM 的每个平台都要重复一遍「下模型、选量化、写解码循环」的事。
Runanywhere 把这件事收敛成一个 SDK：C++ 核心负责量化与推理，上层按平台分发 Swift / Kotlin /
React Native / Flutter 绑定，模型以 GGUF 等常见格式直接复用，多模态（语音、VLM）也走同一套接口。

## 什么时候用它

- 给 App 加「离线可用」的 LLM / 语音能力，不想自己维护 llama.cpp 上游 → 有商业支持兜底。
- 同一套模型要同时上 iOS 和 Android → 核心只维护一份。
- 评估成本时先看许可：仓库未标注 SPDX，商用前务必与作者确认条款。

## 上手难点

- 核心 C++ 库体积不小，App 包体与编译时间要留预算。
- 量化格式与性能随底层引擎版本变化，升级前先看 release notes。
