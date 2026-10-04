---
title: mlx-serve
org: ddalcu
released: 2026-02-17
added: 2026-10-04
summary: Apple Silicon 上的原生推理服务（Zig 后端 + macOS menu-bar app）：一个服务器同时跑 MLX 与 GGUF，对外提供 OpenAI、Anthropic、Ollama 三套兼容 API，除文本外还能生成图像、视频、音乐、语音与 3D。
tags: []
license: MIT（README 徽章与对比表声明；GitHub 未识别出许可文件）
params: 推理服务 / Apple Silicon
links:
  github: https://github.com/ddalcu/mlx-serve
  docs: https://mlxserve.com/
---

## 它解决什么

Mac 上的本地推理常常要在「MLX 权重」和「GGUF 权重」之间二选一，客户端协议也各有各的方言。
mlx-serve 用一个 Zig 写的原生服务器把两边都收进来：MLX 格式与任意 GGUF（内嵌 llama.cpp 路线）
都能跑，同一端口同时说 OpenAI、Anthropic 与 Ollama 三套 API——同一个 `http://localhost:11234`
可以直接接 Claude Code、OpenAI SDK、Cursor、Continue 或 [Open WebUI](/deploy/open-webui/)，
原来连 Ollama 的工具也能不改配置转过来。除文本外，它还用 MLX 生成图像、视频、音乐、
语音（含声音克隆）与 3D，并附一个 menu-bar app 管模型与参数。

## 什么时候用它

- Mac 上想要「装完即用」的本地端点，客户端不改代码就能接。
- 同时有 MLX 与 GGUF 权重，不想维护两套服务。
- 想要一个 GUI 管下载、聊天、agent 模式与 MCP 工具调用，又不想装 Python / Electron 运行时。

## 上手难点

- 仅 macOS 26.2+ 的 Apple Silicon；从源码构建需要 Xcode 26.2+ 与 Homebrew（脚本会拉 Metal Toolchain）。
- 多模态生成能力依赖对应模型是否齐备，不是所有模型都能出图 / 出视频。
- **许可要确认**：README 徽章与对比表写 MIT，但 GitHub 未识别出许可文件，商用前核一眼。