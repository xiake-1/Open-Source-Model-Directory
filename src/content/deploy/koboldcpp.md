---
title: KoboldCpp
org: Kobold AI 社区（LostRuins）
released: 2025-04-11
added: 2026-10-03
summary: 单文件 C++ 的 GGUF 推理器，自带 Web 界面与 OpenAI 兼容 API，采样参数控制极细，创意写作与角色扮演社区的主力。
tags: [推理引擎, 单文件, Web 界面, GGUF, 角色扮演]
license: MIT
kind: 推理框架 / 服务引擎
stars: 11691
supports: [GGUF, 内置 Web UI, OpenAI 兼容 API, 细粒度采样参数, 跨平台单文件二进制]
pain: 文档以社区 wiki 为主，参数多而杂；面向单人创作场景，不做高并发
links:
  github: https://github.com/LostRuins/koboldcpp
---

## 它解决什么

llama.cpp 解决"跑起来"，KoboldCpp 解决"按创作口味跑"：它把大量
采样与生成控制（频率惩罚、连续换行惩罚、正则强制等）暴露到界面和 API，
并自带一个零依赖的 Web 界面。在小说生成、角色扮演这类重采样调参的社区里，
它是事实标准（KoboldAI 生态的客户端都指向它做 GGUF 后端）。

## 什么时候用它

- 本地跑创意写作 / 角色扮演，需要精细采样控制 → 比 Ollama 可控得多。
- 要一个"下载一个 exe 就能用"的本地服务 + Web 界面 → 它最轻。
- 给现有 OpenAI 客户端换个本地后端 → API 兼容。

## 上手难点

- 参数多且默认值偏"创作向"，拿它当通用 API 网关要用习惯。
- 单人场景设计，并发与吞吐不是它的指标。
- 文档分散在社区仓库与 wiki，企业级支持谈不上。
