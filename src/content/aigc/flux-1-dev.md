---
title: FLUX.1 [dev]
org: Black Forest Labs
released: 2024-08-01
added: 2026-10-02
summary: 把扩散模型重新拉回"图像质量第一梯队"的 12B DiT 模型，提示词遵循度显著强于 SDXL。
tags: [图像生成, DiT, 非商用, 高画质, 生态成熟]
license: FLUX.1 [dev] Non-Commercial License
output: image
architecture: DiT (12B)
vram: 24G 舒适；GGUF 量化后 8~12G 可跑
deploys: [comfyui]
links:
  hf: https://huggingface.co/black-forest-labs/FLUX.1-dev
  github: https://github.com/black-forest-labs/flux
---

## 为什么值得看

FLUX 这一代最实际的变化是**能听懂提示词**：画面里的文字、多个主体的位置关系、
指定构图，出图成功率比 SDXL 时代高一档。12B 的 DiT 结构也是后来一批图像/视频模型的事实参考实现。

## 注意许可证

`[dev]` 版本是**非商用**许可，输出图片不能用于商业用途。
要商用请用同门的 FLUX.1 [schnell]（Apache-2.0），或者买 BFL 的商业授权。

## 部署要点

- 24G 显存是舒适线；8~12G 靠 GGUF / NF4 量化，画质有可感知的损失。
- 推荐 20~30 步 + guidance 3.5 左右；用 schnell 的 LoRA 可以压到 4~8 步。
- 社区生态集中在 ComfyUI，工作流文件比代码更值得收藏。

## 配套方案

[ComfyUI](/deploy/comfyui/) 是这类模型的事实标准工作台。