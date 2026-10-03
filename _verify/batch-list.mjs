/**
 * 第二批补录候选（2026-10）：只补「大尺寸与主流版本」，不收专用模型。
 * 这里是人工从 _verify/gap-candidates.md 里筛过一遍的清单；
 * 用 `node _verify/generate-batch.mjs [--apply]` 合并进 plans.mjs（会自动跳过已收录的仓库）。
 *
 * 只需写 repo / family / org / summary / context / modalities / deploys（title 可选），
 * 其余字段（title、released、params、license、tags）由脚本从 HuggingFace 推导。
 */
export const batch = [
  // ---------------- Qwen ----------------
  { repo: 'Qwen/Qwen3.8-Flash-Next', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3.8 代的轻量旗舰，125B 激活 6B，把 Max 的能力压到单机可部署的体量。', context: '1M', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'Qwen/Qwen3.6-35B-A3B', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3.6 代的中量级 MoE，35B 激活 3B，多模态输入本地就能跑。', context: '256K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'Qwen/Qwen3.5-9B', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3.5 代的 9B 稠密版，单张 24G 卡可跑的多模态助手。', context: '256K', modalities: ['text', 'image'], deploys: ['vllm', 'llama-cpp', 'ollama'] },
  { repo: 'Qwen/Qwen3.5-4B', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3.5 代的 4B 稠密版，端侧与轻量部署的主力尺寸。', context: '256K', modalities: ['text', 'image'], deploys: ['llama-cpp', 'ollama'] },
  { repo: 'Qwen/Qwen3-VL-32B-Instruct', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3-VL 的 32B 指令版，视觉 agent 与长文档理解在单机尺寸里最强的一档。', context: '256K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'Qwen/Qwen3-VL-8B-Thinking', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3-VL 8B 的思考版，用长思维链做图像推理与界面定位。', context: '256K', modalities: ['text', 'image'], deploys: ['vllm', 'llama-cpp'] },
  { repo: 'Qwen/Qwen3-VL-4B-Instruct', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3-VL 的 4B 版本，消费级显卡就能跑截图理解与 OCR。', context: '256K', modalities: ['text', 'image'], deploys: ['llama-cpp', 'ollama'] },
  { repo: 'Qwen/Qwen3-VL-4B-Thinking', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3-VL 4B 的思考版，小尺寸上也保留视觉推理链。', context: '256K', modalities: ['text', 'image'], deploys: ['llama-cpp', 'ollama'] },
  { repo: 'Qwen/Qwen3-VL-30B-A3B-Instruct', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3-VL 的 30B 激活 3B 版本，多模态吞吐与成本最平衡的一档。', context: '256K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'Qwen/Qwen3-VL-30B-A3B-Thinking', family: 'Qwen', org: '阿里通义千问', summary: '同 30B-A3B 的思考版，把视觉推理链接进低激活的 MoE。', context: '256K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'Qwen/Qwen3-VL-235B-A22B-Thinking', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3-VL 旗舰的思考版，长视频与复杂图表推理的开源上限。', context: '256K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'Qwen/Qwen3-Omni-30B-A3B-Thinking', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3-Omni 的思考版，文本 / 图像 / 音频统一进一个模型并带推理链。', context: '128K', modalities: ['text', 'image', 'audio'], deploys: ['vllm'] },
  { repo: 'Qwen/Qwen3-235B-A22B-Thinking-2507', family: 'Qwen', org: '阿里通义千问', summary: '235B 旗舰的 2507 思考版，长思维链质量比 4 月首发版明显提升。', context: '256K', deploys: ['vllm', 'sglang'] },
  { repo: 'Qwen/Qwen3-30B-A3B-Instruct-2507', family: 'Qwen', org: '阿里通义千问', summary: '30B-A3B 的 2507 指令版，上下文扩到 256K，本地部署的主流选择。', context: '256K', deploys: ['vllm', 'llama-cpp'] },
  { repo: 'Qwen/Qwen3-30B-A3B-Thinking-2507', family: 'Qwen', org: '阿里通义千问', summary: '30B-A3B 的 2507 思考版，小激活量下保留完整推理链。', context: '256K', deploys: ['vllm', 'llama-cpp'] },
  { repo: 'Qwen/Qwen3-4B-Instruct-2507', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3 的 4B 指令版，4B 尺寸里通用的本地助手首选。', context: '256K', deploys: ['llama-cpp', 'ollama'] },
  { repo: 'Qwen/Qwen3-4B-Thinking-2507', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3 4B 的思考版，端侧也能跑推理链。', context: '256K', deploys: ['llama-cpp', 'ollama'] },
  { repo: 'Qwen/Qwen3-32B', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3 的 32B 稠密版，4 月首发批里的旗舰尺寸。', context: '128K', deploys: ['vllm', 'llama-cpp'] },
  { repo: 'Qwen/Qwen3-14B', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3 的 14B 稠密版，单卡可跑且思考 / 非思考双模式。', context: '128K', deploys: ['vllm', 'llama-cpp', 'ollama'] },
  { repo: 'Qwen/Qwen3-8B', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3 的 8B 稠密版，下载量最大的开源尺寸之一。', context: '128K', deploys: ['vllm', 'llama-cpp', 'ollama'] },
  { repo: 'Qwen/Qwen3-4B', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen3 的 4B 稠密版，手机与开发板级别的部署选择。', context: '128K', deploys: ['llama-cpp', 'ollama'] },
  { repo: 'Qwen/Qwen2.5-Omni-7B', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen2.5 时代的端到端全模态模型，文本 / 图像 / 音频 / 视频一个模型吃下。', context: '32K', modalities: ['text', 'image', 'audio'], deploys: ['vllm'] },
  { repo: 'Qwen/Qwen2.5-VL-7B-Instruct', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen2.5-VL 的 7B 版本，文档解析与视觉定位在本地尺寸里口碑最好。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm', 'llama-cpp'] },
  { repo: 'Qwen/Qwen2.5-VL-32B-Instruct', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen2.5-VL 补上的 32B 中量级尺寸，效果逼近 72B 而显存要求低一半。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'Qwen/Qwen2.5-VL-3B-Instruct', family: 'Qwen', org: '阿里通义千问', summary: 'Qwen2.5-VL 的 3B 版本，端侧做 OCR 与界面理解最省资源的一档。', context: '128K', modalities: ['text', 'image'], deploys: ['llama-cpp', 'ollama'] },

  // ---------------- Google ----------------
  { repo: 'google/gemma-3-4b-it', family: 'Google', org: 'Google DeepMind', summary: 'Gemma 3 的 4B 多模态版本，笔记本与单张消费卡就能跑。', context: '128K', modalities: ['text', 'image'], deploys: ['llama-cpp', 'ollama'] },
  { repo: 'google/gemma-4-31B', family: 'Google', org: 'Google DeepMind', title: 'Gemma 4 31B（基座）', summary: 'Gemma 4 旗舰的预训练基座，方便团队自己做后训练与领域适配。', context: '256K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'google/gemma-4-26B-A4B', family: 'Google', org: 'Google DeepMind', title: 'Gemma 4 26B A4B（基座）', summary: 'Gemma 4 的 26B 激活 4B MoE 基座，为二次训练与蒸馏准备。', context: '256K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'google/gemma-4-E4B-it', family: 'Google', org: 'Google DeepMind', summary: 'Gemma 4 的端侧档，运行时只加载约 4B 有效参数，手机就能跑多模态。', context: '128K', modalities: ['text', 'image', 'audio'], deploys: ['llama-cpp', 'ollama'] },

  // ---------------- Microsoft ----------------
  { repo: 'microsoft/Phi-4-reasoning-plus', family: 'Phi', org: 'Microsoft', summary: 'Phi-4-reasoning 的加强版，用更多 RL 换更长的推理链与更高数学成绩。', context: '32K', deploys: ['vllm', 'llama-cpp'] },
  { repo: 'microsoft/Phi-4-mini-reasoning', family: 'Phi', org: 'Microsoft', summary: '把推理能力压到 3.8B 的版本，端侧做数学与逻辑题。', context: '128K', deploys: ['vllm', 'llama-cpp', 'ollama'] },
  { repo: 'microsoft/Phi-4-mini-flash-reasoning', family: 'Phi', org: 'Microsoft', summary: 'Decoder 与扩散混合的推理小模型，解码速度比同尺寸自回归模型快数倍。', context: '64K', deploys: ['vllm'] },
  { repo: 'microsoft/Phi-4-reasoning-vision-15B', family: 'Phi', org: 'Microsoft', summary: 'Phi-4 的视觉推理版本，看图做题与图表理解在 15B 尺寸里表现突出。', context: '32K', modalities: ['text', 'image'], deploys: ['vllm'] },

  // ---------------- NVIDIA（只收自研 Nemotron） ----------------
  { repo: 'nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16', family: 'Nemotron', org: 'NVIDIA', summary: 'Nemotron 3 Nano 的 BF16 权重版，混合 Mamba-Transformer 的 30B 激活 3B。', context: '1M', deploys: ['vllm', 'sglang'] },
  { repo: 'nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16', family: 'Nemotron', org: 'NVIDIA', summary: 'Nemotron 3 Super 的 BF16 权重版，LatentMoE 加多 token 预测的旗舰档。', context: '1M', deploys: ['vllm', 'sglang'] },
  { repo: 'nvidia/NVIDIA-Nemotron-Nano-12B-v2', family: 'Nemotron', org: 'NVIDIA', summary: 'Nemotron Nano 的 12B 视觉版，混合 Mamba 架构加图像输入。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'nvidia/NVIDIA-Nemotron-Nano-9B-v2-Japanese', family: 'Nemotron', org: 'NVIDIA', summary: 'Nemotron Nano 9B 的日语特化版，面向日本企业的本地化部署。', context: '128K', deploys: ['vllm'] },
  { repo: 'nvidia/Nemotron-Cascade-2-30B-A3B', family: 'Nemotron', org: 'NVIDIA', summary: '级联式推理的 30B 实验模型，把简单问题交给小模型、难题再上大模型。', context: '128K', deploys: ['vllm'] },
  { repo: 'nvidia/Nemotron-Labs-Diffusion-14B', family: 'Nemotron', org: 'NVIDIA', summary: '扩散式文本生成模型，同一份权重支持自回归 / 扩散 / 自推测三种解码。', context: '128K', deploys: ['vllm'] },
  { repo: 'nvidia/NVIDIA-Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16', family: 'Nemotron', org: 'NVIDIA', summary: 'Nemotron 3 的全模态 Nano：文本 / 图像 / 音频输入且带推理模式。', context: '128K', modalities: ['text', 'image', 'audio'], deploys: ['vllm'] },

  // ---------------- Meta ----------------
  { repo: 'meta-llama/Llama-4-Scout-17B-16E', family: 'Meta', org: 'Meta', title: 'Llama 4 Scout（基座）', summary: 'Llama 4 Scout 的预训练基座，为自建后训练与蒸馏提供起点。', context: '10M', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },

  // ---------------- Mistral ----------------
  { repo: 'mistralai/Mistral-Small-24B-Instruct-2501', family: 'Mistral', org: 'Mistral AI', summary: 'Mistral Small 3 的首发版本，24B 稠密以低延迟见长，Apache-2.0 可商用。', context: '32K', deploys: ['vllm', 'llama-cpp', 'ollama'] },
  { repo: 'mistralai/Mistral-Small-4-119B-2603', family: 'Mistral', org: 'Mistral AI', summary: 'Mistral Small 4 代：119B 激活 7B 的 MoE，把旗舰能力压到单机可跑。', context: '256K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'mistralai/Mistral-Medium-3.5-128B', family: 'Mistral', org: 'Mistral AI', summary: 'Mistral Medium 首次放权重，128B 稠密面向企业私有化部署。', context: '256K', deploys: ['vllm', 'sglang'] },
  { repo: 'mistralai/Devstral-Small-2-24B-Instruct-2512', family: 'Mistral', org: 'Mistral AI', summary: 'Devstral 第二代的 24B 版本，SWE 类仓库任务成绩在同尺寸领先。', context: '128K', deploys: ['vllm', 'llama-cpp'] },
  { repo: 'mistralai/Devstral-2-123B-Instruct-2512', family: 'Mistral', org: 'Mistral AI', summary: 'Devstral 2 的大尺寸版本，123B 面向长程编码 agent。', context: '256K', deploys: ['vllm', 'sglang'] },
  { repo: 'mistralai/Ministral-3-14B-Instruct-2512', family: 'Mistral', org: 'Mistral AI', summary: 'Ministral 3 的 14B 指令版，单卡可跑的多模态小模型。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm', 'llama-cpp'] },
  { repo: 'mistralai/Ministral-3-14B-Reasoning-2512', family: 'Mistral', org: 'Mistral AI', summary: 'Ministral 3 的 14B 思考版，小尺寸上做多步推理。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm', 'llama-cpp'] },
  { repo: 'mistralai/Magistral-Small-2509', family: 'Mistral', org: 'Mistral AI', summary: 'Magistral Small 的 2509 版本，多语言推理与可追溯推理轨迹。', context: '128K', deploys: ['vllm', 'llama-cpp'] },

  // ---------------- IBM ----------------
  { repo: 'ibm-granite/granite-3.2-8b-instruct', family: 'IBM', org: 'IBM', summary: 'Granite 3.2 的 8B 版本，第一次把 thinking 开关带进企业小模型。', context: '128K', deploys: ['vllm', 'llama-cpp', 'ollama'] },
  { repo: 'ibm-granite/granite-3.3-8b-instruct', family: 'IBM', org: 'IBM', summary: 'Granite 3.3 的 8B 版本，工具调用与 RAG 场景专门加强。', context: '128K', deploys: ['vllm', 'llama-cpp', 'ollama'] },
  { repo: 'ibm-granite/granite-4.1-30b', family: 'IBM', org: 'IBM', summary: 'Granite 4.1 的 30B 版本，企业级长上下文与 agent 能力的主力档。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'ibm-granite/granite-4.2-8b', family: 'IBM', org: 'IBM', summary: 'Granite 4.2 的 8B 版本，强化代码与推理的小尺寸企业模型。', context: '128K', deploys: ['vllm', 'llama-cpp', 'ollama'] },
  { repo: 'ibm-granite/granite-vision-4.1-4b', family: 'IBM', org: 'IBM', summary: 'Granite 4.1 的视觉版本，4B 做文档与图表理解。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm', 'llama-cpp'] },

  // ---------------- Ai2 ----------------
  { repo: 'allenai/Olmo-3-7B-Instruct', family: 'OLMo', org: 'Allen AI (Ai2)', summary: 'OLMo 3 7B 的指令版，连同 Dolma 3 数据与训练代码一起公开。', context: '64K', deploys: ['vllm', 'llama-cpp'] },
  { repo: 'allenai/Olmo-3-7B-Think', family: 'OLMo', org: 'Allen AI (Ai2)', summary: 'OLMo 3 7B 的思考版，可复现的推理模型训练流程。', context: '64K', deploys: ['vllm', 'llama-cpp'] },
  { repo: 'allenai/Olmo-3.1-32B-Think', family: 'OLMo', org: 'Allen AI (Ai2)', summary: 'OLMo 3.1 的 32B 思考版，完全开源路线上的旗舰推理尺寸。', context: '64K', deploys: ['vllm', 'sglang'] },
  { repo: 'allenai/Olmo-3-1125-32B', family: 'OLMo', org: 'Allen AI (Ai2)', title: 'OLMo 3 32B（1125 基座）', summary: 'OLMo 3 的 32B 基座（11 月 25 日版），用于复现与二次训练。', context: '64K', deploys: ['vllm', 'sglang'] },

  // ---------------- DeepSeek ----------------
  { repo: 'deepseek-ai/DeepSeek-V3-0324', family: 'DeepSeek', org: 'DeepSeek 深度求索', summary: 'V3 的 3 月升级版，推理与前端代码明显变强，仍是 MIT 的 671B MoE。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'deepseek-ai/DeepSeek-R1-0528', family: 'DeepSeek', org: 'DeepSeek 深度求索', summary: 'R1 的 5 月更新版，把思考深度与代码能力再推一档，MIT 许可。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'deepseek-ai/DeepSeek-V3.1-Terminus', family: 'DeepSeek', org: 'DeepSeek 深度求索', summary: 'V3.1 的 Terminus 版，把中英语言一致性与 agent 稳定性修了一轮。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'deepseek-ai/DeepSeek-V3.2-Speciale', family: 'DeepSeek', org: 'DeepSeek 深度求索', summary: 'V3.2 的长思考特化版，把推理链拉到极限而不追求吞吐。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'deepseek-ai/DeepSeek-V4-Pro-0813', family: 'DeepSeek', org: 'DeepSeek 深度求索', summary: 'V4-Pro 的 8 月更新版，长程 agent 与仓库级任务继续加强。', context: '1M', deploys: ['vllm', 'sglang'] },
  { repo: 'deepseek-ai/DeepSeek-V4-Flash-Vision-Exp', family: 'DeepSeek', org: 'DeepSeek 深度求索', summary: 'V4-Flash 的视觉实验版，第一次给这条线接上图像输入。', context: '1M', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'deepseek-ai/DeepSeek-R1-Zero', family: 'DeepSeek', org: 'DeepSeek 深度求索', summary: '不做 SFT、纯强化学习训出来的 R1-Zero，是整套推理路线的原始实验样本。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'deepseek-ai/Janus-Pro-7B', family: 'DeepSeek', org: 'DeepSeek 深度求索', summary: '把图像理解与图像生成解耦到两条路径的统一模型，7B 就能双向做。', context: '32K', modalities: ['text', 'image'], deploys: ['vllm'] },

  // ---------------- 智谱 GLM ----------------
  { repo: 'zai-org/GLM-4-32B-0414', family: 'GLM', org: '智谱 Z.ai', summary: 'GLM-4 的 32B 稠密版，0414 批次的基座模型，MIT 许可。', context: '32K', deploys: ['vllm', 'llama-cpp'] },
  { repo: 'zai-org/GLM-Z1-Rumination-32B-0414', family: 'GLM', org: '智谱 Z.ai', summary: 'GLM-Z1 的沉思版本，先想清楚再答，面向复杂研究型问题。', context: '32K', deploys: ['vllm'] },
  { repo: 'zai-org/GLM-4.1V-9B-Thinking', family: 'GLM', org: '智谱 Z.ai', summary: 'GLM-4.1V 的 9B 视觉思考版，小尺寸做图表与界面推理。', context: '64K', modalities: ['text', 'image'], deploys: ['vllm', 'llama-cpp'] },
  { repo: 'zai-org/GLM-4.6V-Flash', family: 'GLM', org: '智谱 Z.ai', summary: 'GLM-4.6V 的快速视觉版，低延迟跑截图理解与文档问答。', context: '200K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },

  // ---------------- MiniMax ----------------
  { repo: 'MiniMaxAI/MiniMax-M2.1', family: 'MiniMax', org: 'MiniMax', summary: 'M2 代的第一次迭代，编码与工具调用稳定性提升。', context: '200K', deploys: ['vllm', 'sglang'] },
  { repo: 'MiniMaxAI/MiniMax-M2.7', family: 'MiniMax', org: 'MiniMax', summary: 'M2 代的第三次迭代，激活仍只 10B，面向长程 agent 调用。', context: '200K', deploys: ['vllm', 'sglang'] },

  // ---------------- 腾讯混元 ----------------
  { repo: 'tencent/Hy3-preview', family: 'Hunyuan', org: '腾讯混元', summary: '混元第三代开源基座的预览版，为 Hy3 正式版做能力探路。', context: '256K', deploys: ['vllm', 'sglang'] },
  { repo: 'tencent/Hunyuan-7B-Instruct', family: 'Hunyuan', org: '腾讯混元', summary: '混元稠密系列的 7B 指令版，端侧与高并发场景的开源选择。', context: '128K', deploys: ['vllm', 'llama-cpp', 'ollama'] },
  { repo: 'tencent/Youtu-VL-4B-Instruct', family: 'Hunyuan', org: '腾讯混元', summary: '腾讯优图的 4B 视觉语言模型，端侧做图像问答与 OCR。', context: '128K', modalities: ['text', 'image'], deploys: ['llama-cpp', 'ollama'] },

  // ---------------- 蚂蚁 inclusionAI ----------------
  { repo: 'inclusionAI/Ling-mini-2.0', family: 'Ling', org: '蚂蚁集团 inclusionAI', summary: '百灵的 16B 激活 1.4B 迷你 MoE，端侧高并发场景的开源选择。', context: '128K', deploys: ['vllm', 'llama-cpp'] },
  { repo: 'inclusionAI/Ring-mini-2.0', family: 'Ling', org: '蚂蚁集团 inclusionAI', summary: 'Ring-mini 的 2.0 版本，小激活量下做推理链。', context: '128K', deploys: ['vllm', 'llama-cpp'] },
  { repo: 'inclusionAI/Ling-2.5-1T', family: 'Ling', org: '蚂蚁集团 inclusionAI', summary: '百灵 2.5 代的万亿参数基座，激活 50B 级别，MIT 许可。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'inclusionAI/Ring-2.5-1T', family: 'Ling', org: '蚂蚁集团 inclusionAI', summary: 'Ring 2.5 代的万亿推理模型，长思维链强化学习路线。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'inclusionAI/Ling-2.6-1T', family: 'Ling', org: '蚂蚁集团 inclusionAI', summary: '百灵 2.6 代的万亿基座，训练数据与配方继续公开。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'inclusionAI/Ling-2.6-flash', family: 'Ling', org: '蚂蚁集团 inclusionAI', summary: 'Ling 2.6 的快速版，低延迟面向在线 agent。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'inclusionAI/Ring-2.6-1T', family: 'Ling', org: '蚂蚁集团 inclusionAI', summary: 'Ring 2.6 代的万亿推理模型，本轮推理能力最强的开源尺寸之一。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'inclusionAI/Ling-3.0-tiny', family: 'Ling', org: '蚂蚁集团 inclusionAI', summary: '百灵第三代的迷你版，把 MoE 压到端侧可跑的量级。', context: '128K', deploys: ['llama-cpp', 'ollama'] },
  { repo: 'inclusionAI/Ling-3.0-flash-VL', family: 'Ling', org: '蚂蚁集团 inclusionAI', summary: 'Ling 3.0 的视觉版本，在快速档上补上图像输入。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm'] },
  { repo: 'inclusionAI/LLaDA2.0-mini', family: 'Ling', org: '蚂蚁集团 inclusionAI', summary: '扩散式语言模型 LLaDA 2.0 的迷你版，16B 激活 1B，非自回归生成路线。', context: '32K', deploys: ['vllm'] },

  // ---------------- 上海 AI Lab / 阶跃 / 百度 / 字节 ----------------
  { repo: 'internlm/internlm3-8b-instruct', family: 'InternLM', org: '上海 AI Lab', summary: 'InternLM3 的 8B 指令版，上海 AI Lab 通用对话模型的开源主力。', context: '128K', deploys: ['vllm', 'llama-cpp', 'ollama'] },
  { repo: 'internlm/Intern-S1-Pro', family: 'InternLM', org: '上海 AI Lab', summary: 'Intern-S1 的科学推理加强版，面向专业学科的长链推理。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'internlm/Intern-S2-Preview', family: 'InternLM', org: '上海 AI Lab', summary: 'Intern-S2 科学模型的预览版，同期放出 397B 级权重供试跑。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'internlm/Atria-Dawn-Preview', family: 'InternLM', org: '上海 AI Lab', summary: '上海 AI Lab 的 Atria 系列预览版，面向代码与工具使用的通用模型。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'stepfun-ai/Step3-VL-10B', family: 'Step', org: '阶跃星辰 StepFun', summary: 'Step 3 的 10B 视觉版本，小尺寸做图文理解与推理。', context: '64K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'baidu/ERNIE-4.5-21B-A3B-Thinking', family: 'ERNIE', org: '百度', summary: 'ERNIE 4.5 的 21B 思考版，激活 3B 做推理链。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'baidu/ERNIE-4.5-VL-28B-A3B-PT', family: 'ERNIE', org: '百度', summary: 'ERNIE 4.5 的中量级视觉模型，28B 激活 3B 做多模态理解。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'baidu/ERNIE-4.5-VL-28B-A3B-Thinking', family: 'ERNIE', org: '百度', summary: '同 28B-A3B 的视觉思考版，把推理链接进多模态输入。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'ByteDance-Seed/BAGEL-7B-MoT', family: 'Seed', org: '字节跳动 Seed', summary: '字节的统一多模态模型，7B 同时做图像理解与图像生成。', context: '32K', modalities: ['text', 'image'], deploys: ['vllm'] },

  // ---------------- 其它机构 ----------------
  { repo: 'xai-org/grok-2', family: 'Grok', org: 'xAI', summary: 'xAI 首次放出的开放权重模型，Grok-2 的 269B MoE 权重公开下载。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'upstage/Solar-Open2-250B', family: 'Solar', org: 'Upstage', summary: '韩国自主 AI 项目的第二代成果，250B MoE 从零训练。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'utter-project/EuroLLM-22B-Instruct-2512', family: 'EuroLLM', org: 'Unbabel / 欧盟项目', summary: '欧盟资助的 EuroLLM 22B 版本，覆盖全部官方语言的开源模型。', context: '32K', deploys: ['vllm', 'sglang'] },
  { repo: 'swiss-ai/Apertus-v1.5-8B', family: 'Apertus', org: 'Swiss AI Initiative', summary: 'Apertus 1.5 代的 8B 版本，把多模态输入加进瑞士国家级开源模型。', context: '64K', modalities: ['text', 'image'], deploys: ['vllm', 'llama-cpp'] },
  { repo: 'swiss-ai/Apertus-v1.5-70B', family: 'Apertus', org: 'Swiss AI Initiative', summary: 'Apertus 1.5 的 70B 版本，权重与训练配方继续全公开。', context: '64K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'swiss-ai/Apertus-8B-Instruct-2509', family: 'Apertus', org: 'Swiss AI Initiative', summary: 'Apertus 的 8B 指令版，端侧可跑的多语言开源模型。', context: '64K', deploys: ['vllm', 'llama-cpp', 'ollama'] },
  { repo: 'LGAI-EXAONE/K-EXAONE-2.0-750B-A37B', family: 'EXAONE', org: 'LG AI Research', summary: 'LG 与韩国政府合作的第二代旗舰，750B 激活 37B，韩语能力最强档。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'LGAI-EXAONE/EXAONE-4.5-33B', family: 'EXAONE', org: 'LG AI Research', summary: 'EXAONE 4.5 的 33B 多模态版本，LG 首个公开的视觉语言模型。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'LGAI-EXAONE/EXAONE-Deep-32B', family: 'EXAONE', org: 'LG AI Research', summary: 'EXAONE Deep 的 32B 推理模型，数学与代码在同尺寸领先，仅限研究用途。', context: '32K', deploys: ['vllm', 'sglang'] },
  { repo: 'CohereLabs/aya-vision-32b', family: 'Aya', org: 'Cohere Labs', summary: 'Aya Vision 的 32B 版本，覆盖 23 种语言的多模态开源模型。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm', 'sglang'] },
  { repo: 'CohereLabs/aya-vision-8b', family: 'Aya', org: 'Cohere Labs', summary: 'Aya Vision 的 8B 版本，端侧做多语言图文理解。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm', 'llama-cpp'] },
  { repo: 'CohereLabs/command-a-reasoning-08-2025', family: 'Command', org: 'Cohere', summary: 'Command A 的推理版本，企业场景下的长思维链与工具调用。', context: '256K', deploys: ['vllm', 'sglang'] },
  { repo: 'CohereLabs/c4ai-command-a-03-2025', family: 'Command', org: 'Cohere', summary: 'Command A 的 111B 开放权重版，256K 上下文面向企业 agent，非商业许可。', context: '256K', deploys: ['vllm', 'sglang'] },
  { repo: 'CohereLabs/North-Micro-Vision-Instruct', family: 'Command', org: 'Cohere', summary: 'North 系列的微型视觉指令模型，端侧做文档与界面理解。', context: '128K', modalities: ['text', 'image'], deploys: ['vllm', 'llama-cpp'] },
  { repo: 'RekaAI/reka-flash-3', family: 'Reka', org: 'Reka AI', summary: 'Reka 从零训练的 21B 通用推理模型，小尺寸里对标 o1-mini 的一档。', context: '128K', deploys: ['vllm', 'sglang'] },
  { repo: 'RekaAI/reka-edge-2603', family: 'Reka', org: 'Reka AI', summary: 'Reka 面向机器人与边缘设备的视觉模型，2603 批次。', context: '32K', modalities: ['text', 'image'], deploys: ['vllm'] },
  { repo: 'Zyphra/ZAYA1-8B', family: 'ZAYA', org: 'Zyphra', summary: '全流程在 AMD GPU 上训练的 8B MoE（激活 0.6B），证明非 NVIDIA 路线可行。', context: '128K', deploys: ['vllm', 'llama-cpp'] },
  { repo: 'apple/FastVLM-7B', family: 'FastVLM', org: 'Apple', summary: 'Apple 的快速视觉语言模型，7B 以低延迟做端侧图像理解。', context: '32K', modalities: ['text', 'image'], deploys: ['vllm'] },
  { repo: 'apple/DiffuCoder-7B-cpGRPO', family: 'DiffuCoder', org: 'Apple', summary: '扩散式代码生成模型，7B 用非自回归解码做代码补全。', context: '32K', deploys: ['vllm'] },
  { repo: 'apple/LensVLM-9B', family: 'LensVLM', org: 'Apple', summary: 'Apple 的镜头式视觉模型，9B 面向端侧细粒度图像问答。', context: '32K', modalities: ['text', 'image'], deploys: ['vllm'] },
];