---
title: MTPLX
org: youssofal
released: 2026-05-02
added: 2026-10-04
summary: 用模型自带的 MTP 头做投机解码的 Mac 运行时：模型自己起草多个 token、一次批量前向验证、再按带残差修正的拒绝采样提交，README 实测约为普通解码的 2×（16GB M4 Mac mini 1.6×、M5 Max 2.24×）。
tags: []
license: Apache-2.0
params: 推理加速 / 投机解码
links:
  github: https://github.com/youssofal/MTPLX
  docs: https://mtplx.com
---

## 它解决什么

投机解码通常要再挂一个草稿模型，既占内存又可能改变输出分布。MTPLX 走的是另一条路：
用模型**自带的** multi-token prediction 头起草若干 token，一次批量前向完成验证，
再通过精确拒绝采样（带残差修正，采样温度取模型原生设置）提交——不需要第二个草稿模型，
也不走会悄悄改变输出的贪心捷径。README 给出的实测是普通解码的约 2 倍：
16GB M4 Mac mini 1.6×、M5 Max 2.24×，并附了每行数字对应的机器与版本。

## 什么时候用它

- 在 Apple Silicon（M1 或更新、macOS 14+）上跑它列出的模型家族：
  Qwen 3.8 Flash Next（125B-A6B）、Qwen 3.8 27B、Ternary Bonsai 2 27B，以及 Qwen 3.6 / 3.5、Gemma 4。
- 给 coding agent 当本地后端：README 记录了 OpenCode 单请求 125.8 tok/s
  （MTP 深度 3、18k prompt 大部分命中缓存）。
- 不确定该选哪档量化 / 解码深度 → app 会先测你的机器再给推荐。

## 上手难点

- 依赖模型自带 MTP 头，所以只覆盖 README 列出的几族模型，换模型等于换支持范围。
- 显存门槛偏高：Flash Next 的 Bare Speed 建议 96GB 统一内存、Optimized Speed 建议 128GB 以上。
- 图像请求从 2.12.0 起才走编译后的验证器，且官方说明这部分尚未重跑采样对照实验。