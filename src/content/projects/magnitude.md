---
title: Magnitude
org: Magnitude AI
released: 2026-06-12
added: 2026-10-04
summary: 会在你的设备上现场编译并调优内核的推理引擎：不再吃预编译的通用 kernel，README 自称 decode 比 llama.cpp 快最多 92%（Metal）/ 19%（CUDA），并针对 agent 会话做了前缀缓存共享与内存回收。
tags: []
license: Apache-2.0
params: 推理引擎 / 内核自调优
links:
  github: https://github.com/magnitudedev/magnitude
  docs: https://magnitude.dev
---

## 它解决什么

[llama.cpp](/deploy/llama-cpp/) 这类通用引擎发的是「面向一大类硬件」的预编译内核，
而每台机器的芯片、内存带宽并不相同。Magnitude 的做法是：在模型跑起来之前，
在你的设备上编译并调优内核，让它贴合这块芯片——README 给出的数字是解码最多快 92%（Metal）、
19%（CUDA），并声称每个 agent 会话少占 27% 内存、会话停止即释放。

它还把自己定位成「接 agent 的那一端」：一次点击就能把 Pi、OpenCode、Hermes、Codex、
Claude Code 等接上本地模型，其余客户端走 OpenAI 兼容 API。

## 什么时候用它

- 在笔记本 / 台式机上给 coding agent 配本地模型 → 它主打的就是这类交互式负载（前缀缓存共享、并发会话）。
- 硬件比较杂（Apple Silicon、NVIDIA、AMD，甚至只有 CPU）→ 现场编译的内核思路对非主流组合更友好。
- 想要桌面 app + CLI 的形态，而不是自己拼服务与客户端。

## 上手难点

- 首次运行要现场编译内核，用启动时间换运行速度；冷启动体验取决于机器。
- 优化内核只覆盖「热门开放权重家族」，冷门模型拿不到同等收益。
- 偏个人机器形态（桌面 app 为主），不是集群 / 多租户服务方案。