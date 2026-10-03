---
title: KVMem
org: kvmem 社区
released: 2026-10-01
added: 2026-10-02
summary: 给 llama.cpp 加一层可压缩的 KV cache 记忆，把长对话的历史从"全量缓存"变成"按需检索"，显存占用随对话长度基本走平。
tags: []
license: MIT
params: 推理加速 / KV cache
links:
  github: https://github.com/kvmem/kvmem-llama.cpp
---

## 它解决什么

llama.cpp 的默认行为是"对话越长，KV cache 越大"，
长会话最后往往是被显存而不是被模型能力卡住。

KVMem 在 llama.cpp 上挂了一层记忆管理：老的 KV 块压缩后落盘，
需要时再取回来重算，长对话的显存曲线因此变成平的。

## 什么时候用它

- 在本机跑长会话 / Agent 循环，显存先到顶 → 收益最明显。
- 已经用 llama.cpp 起服务，不想换推理引擎 → 它是补丁式的，接入成本低。

## 上手难点

- 压缩会引入信息损失，需要自己调"保留最近多少 token 不压缩"。
- 项目还很新，与 llama.cpp 主干的版本对齐要自己盯 release。