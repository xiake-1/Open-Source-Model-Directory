---
title: Strata
org: Niko1221
released: 2026-09-18
added: 2026-10-02
summary: 把 125B 的 Qwen3.8-Flash-Next（24,576 个专家、每 token 只激活 10 个）跑在一张 12G 消费卡上的本地推理栈：热专家进显存、全量专家进内存、SSD 兜底流式换入，自带 OpenAI / Anthropic 兼容接口。
tags: []
license: MIT
params: 本地推理栈 / MoE 专家分层
links:
  github: https://github.com/Niko1221/Strata
---

## 它解决什么

这类 MoE 通常要几百 G 显存的服务器，而消费卡只有 12–24G。
Strata 把整台 PC 当成一层分级存储：最常用的几千个专家常驻显卡，
全部专家放在内存里，SSD 上留一张查找表，回答时按需把专家换进显存 ——
于是 12G 显存 + 64G 内存的机器就能把 125B 当日常模型用。

## 什么时候用它

- 只有一张 12–24G 的消费卡，却想把旗舰 MoE 用作编码 / 日常助手 → 它是目前把「专家分层」做成一体化产品的那一类。
- 要接现成应用与 coding agent：起 `127.0.0.1:8080/v1`（OpenAI 兼容）、`/v1/messages`（Anthropic / Claude Code）、`/v1/responses`（Codex CLI），浏览器端还带 Chat 与显存 / 内存监视。
- 官方支持 NVIDIA RTX 20–50 与 AMD RX 7000 / 9000（12G 起）；Mac（Metal）、Intel Arc、Strix Halo 是社区维护的实验路径。

## 上手难点

- 内存决定能装哪一档：32G 只能用官方 Coder 版（砍掉一半专家，代码强、CJK 偏弱），64G 起才跑得下 IQ2_XS / IQ3_S。
- 默认一次只处理一个请求，并发要自己设 `parallel`；12G 卡上开并发会明显拖慢单条回答。
- 首次启动要下载约 80G 权重，没有 NVMe 会很难受；AMD 卡在 Windows 下暂时不能读图。
