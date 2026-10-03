---
title: DFlash
org: z-lab
released: 2026-01-04
added: 2026-10-03
summary: 用块扩散起草、自回归校验的投机解码方案：草稿一次出一块 token，接受率与加速比明显好于经典小模型 drafter，本地长文生成提速的热门路线。
tags: []
license: MIT
params: 投机解码
links:
  github: https://github.com/z-lab/dflash
  docs: https://dflash.z-lab.ai
---

## 它解决什么

经典投机解码用一个小模型当 drafter：起草质量差、接受率低，长上下文场景加速比上不去。
DFlash 把 drafter 换成块扩散模型——一次并行生成一整块候选 token，再由大模型一步验证，
在同等显存预算下把验证命中率提上去，长文与 Agent 多轮场景的延迟收益最明显。

## 什么时候用它

- 本地跑长上下文推理，decode 是主要瓶颈 → 投机解码是几乎免费的加速。
- 想跟进「扩散做 drafter」这条 2026 年的主线 → 它是该路线的代表实现之一。

## 上手难点

- 需要额外一份扩散 drafter 权重与对应集成，显存预算要留出来。
- 加速比高度依赖任务分布：短回答、强格式约束场景收益会缩水。
