import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** 链接块：至少要有一个链接，否则这条收录没有意义 */
const links = z
  .object({
    hf: z.string().url().optional(),
    github: z.string().url().optional(),
    paper: z.string().url().optional(),
    demo: z.string().url().optional(),
    docs: z.string().url().optional(),
  })
  .refine((v) => Object.values(v).some(Boolean), {
    message: 'links 至少要填一个链接（hf / github / paper / demo / docs）',
  });

/** 三个集合共用的字段 */
const base = {
  title: z.string(),
  /** 发布方：机构 / 团队 / 个人 */
  org: z.string(),
  /** 首次公开发布时间（时间线的排序依据） */
  released: z.coerce.date(),
  /** 你把它收录进来的时间，不填则等于 released */
  added: z.coerce.date().optional(),
  /** 一句话：它是什么 + 凭什么值得看。少于 10 个字直接构建失败 */
  summary: z.string().min(10, 'summary 太短：请写清"是什么 + 凭什么值得看"'),
  tags: z.array(z.string()).default([]),
  links,
  license: z.string().optional(),
  status: z.enum(['active', 'dead', 'deprecated']).default('active'),
  featured: z.boolean().default(false),
};

/** LLM：语言模型 */
const llm = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/llm' }),
  schema: z.object({
    ...base,
    /** 参数量，例如 "235B (激活 22B)" */
    params: z.string().optional(),
    /** 上下文长度，例如 "128K" */
    context: z.string().optional(),
    /** 本地跑起来大概需要什么卡，例如 "单卡 80G 可跑（FP8）" */
    vram: z.string().optional(),
    modalities: z.array(z.enum(['text', 'image', 'audio', 'code'])).default(['text']),
    /** 关联的部署/加速方案（写 deploy 集合里的文件名，不用带 .md） */
    deploys: z.array(reference('deploy')).default([]),
  }),
});

/** AIGC：图像 / 视频 / 音频 / 3D 生成模型 */
const aigc = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/aigc' }),
  schema: z.object({
    ...base,
    output: z.enum(['image', 'video', 'audio', '3d']),
    /** 底模，例如 "SDXL" / "DiT" */
    architecture: z.string().optional(),
    /** 推荐显存，例如 "12G 可跑 fp8" */
    vram: z.string().optional(),
    deploys: z.array(reference('deploy')).default([]),
  }),
});

/** 部署 / 加速方案 */
const deploy = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/deploy' }),
  schema: z.object({
    ...base,
    /** 方案类型，决定在部署页里归到哪一组 */
    kind: z.enum(['推理引擎', '量化', '微调', '服务化', '分布式', '工具链']),
    /** 支持什么（模型格式 / 硬件 / 特性） */
    supports: z.array(z.string()).default([]),
    /** 上手难点，写清楚能省别人几小时 */
    pain: z.string().optional(),
  }),
});

export const collections = { llm, aigc, deploy };