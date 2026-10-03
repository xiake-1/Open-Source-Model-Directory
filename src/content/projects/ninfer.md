---
title: NInfer
org: Neroued
released: 2026-06-26
added: 2026-10-03
summary: 从零写的 C++/CUDA 单卡推理引擎：一张 RTX 5090 上跑 Qwen3.5 / 3.8 的 Dense 与 MoE，MTP3 投机解码加两级 KV 缓存，CLI 与 OpenAI / Anthropic 兼容 API，并官方发布 NVFP4 / groupwise-int 工件。
tags: []
license: Apache-2.0
params: 单 GPU 推理引擎
links:
  github: https://github.com/Neroued/ninfer
  hf: "https://huggingface.co/neroued/Qwen3.8-27B-nvfp4-NInfer"
---

## 它解决什么

vLLM / SGLang 这类通用引擎要在「支持一切」与「单卡极致」之间取舍。
NInfer 反着来：一个 GPU、一个常驻模型、启动时固定 1 到 8 个活跃请求的容量，
Qwen3.5 / 3.8 的稠密与 MoE 架构写成显式 CUDA 路径，
配 MTP3 投机解码与 Device/Host State + KV 两级缓存，官方工件（NVFP4 / groupwise-int）下载即用。

## 什么时候用它

- 只有一张 RTX 5090，想要单请求 / 低并发下的最高吞吐 → 看它公开的 benchmark。
- 要 OpenAI / Anthropic 兼容接口喂给现有 Agent 客户端 → 服务端开箱即用。

## 上手难点

- 只支持 NVIDIA sm_120a（RTX 5090），CUDA 13.1 + C++20 源码构建，没有安装包。
- 架构与形状组合是显式实现的：跑别的模型要自己用权重转换工具转成 `.ninfer` 工件。
