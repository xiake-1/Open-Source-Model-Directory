---
title: HunyuanVideo
org: 腾讯混元
released: 2024-12-03
added: 2026-10-02
summary: 13B 开源视频生成模型，发布时是参数规模最大的开放权重视频模型，运动幅度和镜头感明显强于同期开源方案。
tags: [视频生成, DiT, 中文, 大参数, 非商用]
license: Tencent Hunyuan Community License
output: video
architecture: DiT (13B)
vram: BF16 需 60~80G；量化后 24G 可跑短片段
deploys: [comfyui]
links:
  github: https://github.com/Tencent/HunyuanVideo
  hf: https://huggingface.co/tencent/HunyuanVideo
  paper: https://arxiv.org/abs/2412.03603
---

## 为什么值得看

开源视频生成长期停留在"能动能看"的水平，HunyuanVideo 是第一个在
**镜头运动、物理一致性、文本对齐**上接近闭源产品体验的开放权重模型，
而且官方配套放出了完整的推理代码和显存优化方案。

## 部署要点

- 13B 视频 DiT 对显存极不友好：官方给了 CPU offload 和 FP8 两套方案，24G 卡能跑但很慢。
- 生成时长与显存线性相关，先在低分辨率和短时长上跑通流程，再往上加。
- 许可证是腾讯社区许可，商用有额外条件，务必读原文。
- 中文提示词支持是它的优势，同期的英文模型在中文场景经常跑偏。

## 配套方案

[ComfyUI](/deploy/comfyui/) 已有官方与社区节点，是本地体验的最短路径。