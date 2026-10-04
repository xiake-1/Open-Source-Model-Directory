---
title: AngelSlim
org: 腾讯混元 AI Infra 团队
released: 2025-07-04
added: 2026-10-04
summary: 腾讯混元的模型压缩工具箱：把量化（INT8 / FP8 / INT4 / NVFP4 / 1.25–2bit）、稀疏注意力、投机解码（Eagle3、DFly、D-Flare）与蒸馏 / QAD 收进同一个框架，并附带压缩权重与文档。
tags: []
license: License for AngelSlim（腾讯自定义许可；GitHub 未识别出标准许可）
params: 模型压缩 / 量化与投机解码
links:
  github: https://github.com/Tencent/AngelSlim
  docs: https://angelslim.readthedocs.io/
---

## 它解决什么

把大模型压到能落地的尺寸，通常要在量化、稀疏、蒸馏、投机解码之间反复换工具。
AngelSlim 把这些算法收进一个框架：量化覆盖 INT8 / FP8 / INT4 / NVFP4 与自研的
Sherry（1.25bit）、TEQUILA（三值）等；推理侧有 Stem 稀疏注意力与 Eagle3 / DFly / D-Flare 等
投机解码方案；训练侧有蒸馏与量化感知蒸馏。它的更新记录里给了不少「压完还能用」的实例，
例如把模型从 1.5TB 压到 214GiB、单卡量化 Qwen3-235B / DeepSeek-R1，
并会把部分 kernel 反哺上游（STQ1_0 已向 llama.cpp 提 PR）。

## 什么时候用它

- 目标是把某个大模型塞进单卡、一体机或边缘设备 → 先在它的量化与压缩算法里挑一条路径。
- 已经在用 [vLLM](/deploy/vllm/) / [llama.cpp](/deploy/llama-cpp/) → 量化权重与部分 kernel 能直接对接。
- 需要投机解码的训练侧支持（drafter 训练、验证深度剪枝等）。

## 上手难点

- 算法多、迭代快，要按具体 feature 的文档挑，不能指望「一键压缩」适用于所有模型。
- 压缩收益与精度损失强相关：官方给的掉点数字都绑定特定模型与任务，换模型必须自己评。
- **许可要看清**：代码走腾讯自定义的「License for AngelSlim」而非标准开源许可，商用前请读原文。