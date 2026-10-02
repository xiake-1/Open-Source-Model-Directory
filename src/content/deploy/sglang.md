---
title: SGLang
org: SGLang 社区（LMSYS / 上海交大等）
released: 2024-01-08
added: 2026-10-02
summary: 用 RadixAttention 做前缀缓存复用的推理引擎，多轮对话和批量同前缀请求的吞吐明显优于通用方案。
tags: [推理引擎, 前缀缓存, 高吞吐, 结构化输出, 生产可用]
license: Apache-2.0
kind: 推理引擎
supports: [RadixAttention, 前缀缓存, 结构化输出, 多卡并行, OpenAI 兼容 API]
pain: 生态与文档比 vLLM 薄，冷门模型支持滞后，出问题时要自己读源码
links:
  github: https://github.com/sgl-project/sglang
  docs: https://docs.sglang.ai
  paper: https://arxiv.org/abs/2312.07104
---

## 它解决什么

真实业务里大量请求**共享前缀**——同一个 system prompt、同一份长文档、
多轮对话的历史上下文。SGLang 用 RadixAttention 把这些前缀的 KV cache 建成基数树缓存，
命中后直接复用，省掉重复的 prefill。

在"长 system prompt + 高并发"的场景下，这个优化的收益经常比换硬件更明显。

## 什么时候用它

- 多轮对话、Agent 类应用、同一份文档被反复提问 → 收益最大。
- 需要强制 JSON / 正则约束输出 → 它的结构化输出实现比较成熟。
- 团队有能力读源码、愿意为性能多花调试时间。

## 上手难点

- 模型支持列表更新比 vLLM 慢，冷门模型可能要先等社区合并。
- 报错信息偏底层，遇到不支持的特性往往直接抛断言而非降级。
- 如果不是前缀复用场景，和 [vLLM](/deploy/vllm/) 的差距没想象中大，别为了追新而迁移。