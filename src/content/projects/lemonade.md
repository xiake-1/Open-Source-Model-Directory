---
title: Lemonade
org: lemonade-sdk
released: 2025-05-15
added: 2026-10-04
summary: 把本机 GPU / NPU 变成一个本地 AI 服务：同一端口对外提供 OpenAI、Anthropic 与 Ollama 三套兼容 API，覆盖对话、编码、语音与图像生成，含 AMD 工程师针对 Ryzen AI / Radeon 的优化。
tags: []
license: Apache-2.0
params: 一体化本地平台 / NPU 服务化
links:
  github: https://github.com/lemonade-sdk/lemonade
  docs: https://lemonade-server.ai/
---

## 它解决什么

本地跑模型最麻烦的往往不是模型本身，而是「怎么让现成应用连上它」。
Lemonade 装成一个本地服务，同时说 OpenAI、Anthropic 与 Ollama 三种 API，
于是一批现成客户端不用改代码就能接过来；能力上不只对话，还覆盖编码、语音与图像生成。

它有两种形态：**Lemonade Server** 是常驻服务；**Embeddable Lemonade** 是可嵌进自家应用的
可移植二进制，能跟着用户的 PC 自动选后端。项目由社区共建，AMD 工程师参与优化
Ryzen AI、Radeon 与 Strix Halo 这类带 NPU 的机器。

## 什么时候用它

- 想给 [Open WebUI](/deploy/open-webui/)、[LM Studio](/deploy/lm-studio/) 之外的客户端
  换个更省资源的本地后端，或同时兼容多种客户端协议。
- 手上有 Ryzen AI / Radeon PC → 值得试 NPU 路径，而不是只堆 GPU。
- 需要在自家应用里内置本地多模态能力 → 直接用可嵌入形态。

## 上手难点

- 发行形态很多（Windows .msi、.deb / .rpm / Snap / Docker / macOS pkg、源码），
  选错平台包或后端会白折腾。
- 多模态能力随模型与驱动而异，不是装完就全都能跑。
- NPU 路径与厂商驱动绑定较紧，老硬件上多数还是回落到 GPU / CPU。