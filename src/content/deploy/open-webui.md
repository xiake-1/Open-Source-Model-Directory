---
title: Open WebUI
org: Open WebUI 社区
released: 2023-10-06
added: 2026-10-03
summary: 自托管的本地 LLM Web 前端，原生对接 Ollama 与 OpenAI 兼容 API，内置 RAG 知识库与 MCP，团队共用本地模型的首选入口。
tags: [本地部署, Web 界面, RAG, 多用户, MCP]
license: Other（仓库标注 NOASSERTION）
kind: 通用本地 AI 平台
stars: 153845
supports: [Ollama / OpenAI 兼容后端, RAG 知识库, 多用户与权限, MCP, 自托管]
pain: 它只是前端与编排层，推理性能取决于后端引擎；许可不是标准 SPDX
links:
  github: https://github.com/open-webui/open-webui
  docs: https://docs.openwebui.com
---

## 它解决什么

本地模型跑起来之后，缺的往往是一个"能给人用"的入口：多用户、权限、
聊天历史、上传文档问答。Open WebUI 补齐这一层——它自己不做推理，
原生对接 Ollama 和任何 OpenAI 兼容 API，把本地引擎包装成
ChatGPT 式的 Web 界面，并内置 RAG 与 MCP。

## 什么时候用它

- 团队里几个人要共用同一台本地推理机 → 用它在前面加一层界面和账号。
- 需要"文档 + 模型"的本地知识库问答（RAG）→ 开箱即用。
- 想统一管理多个本地后端（Ollama + vLLM 等）→ 后端可配置切换。

## 上手难点

- 推理质量和吞吐完全取决于后端引擎，它解决不了 vLLM 解决不了的问题。
- 许可标记为 Other（NOASSERTION），商用前要看一眼 LICENSE 原文。
- 功能更新快，版本升级偶尔有配置迁移坑。
