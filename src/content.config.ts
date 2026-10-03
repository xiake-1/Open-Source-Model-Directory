import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  LLM_TAGS,
  LLM_TAG_HELP,
  AIGC_TAGS,
  AIGC_TAG_HELP,
  DEPLOY_KINDS,
  COMMERCIAL_VALUES,
  COMMERCIAL_HELP,
} from './lib/taxonomy';

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

/** 四个集合共用的字段 */
const base = {
  title: z.string(),
  /** 发布方：机构 / 团队 / 个人 */
  org: z.string(),
  /** 所属（家族 / 公司）：Qwen、Meta、DeepSeek… 详情页会展示 */
  family: z.string().optional(),
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

/** LLM：语言模型。标签是固定枚举，写错直接构建失败 —— 列表左侧的筛选就靠它 */
const llm = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/llm' }),
  schema: z.object({
    ...base,
    tags: z.array(z.enum(LLM_TAGS), { message: LLM_TAG_HELP }).default([]),
    /** 是否可商用：固定枚举，左侧"商用"筛选与卡片胶囊都看它 */
    commercial: z.enum(COMMERCIAL_VALUES, { message: COMMERCIAL_HELP }),
    /** 参数量，例如 "235B (激活 22B)" */
    params: z.string().optional(),
    /** 上下文长度，例如 "128K"（详情页展示，列表卡片不展示） */
    context: z.string().optional(),
    /** 本地跑起来大概需要什么卡，例如 "单卡 80G 可跑（FP8）" */
    vram: z.string().optional(),
    modalities: z.array(z.enum(['text', 'image', 'audio', 'code'])).default(['text']),
    /** 关联的部署方式（写 deploy 集合里的文件名，不用带 .md） */
    deploys: z.array(reference('deploy')).default([]),
  }),
});

/** AIGC：生图 / 生视频模型 */
const aigc = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/aigc' }),
  schema: z.object({
    ...base,
    tags: z.array(z.enum(AIGC_TAGS), { message: AIGC_TAG_HELP }).default([]),
    /** 是否可商用：固定枚举，左侧"商用"筛选与卡片胶囊都看它 */
    commercial: z.enum(COMMERCIAL_VALUES, { message: COMMERCIAL_HELP }),
    /** 生图还是生视频，决定归到哪个子页面 */
    output: z.enum(['image', 'video']),
    /** 架构，例如 "DiT (12B)" */
    architecture: z.string().optional(),
    /** 参数量，例如 "12B" */
    params: z.string().optional(),
    /** 推荐显存，例如 "12G 可跑 fp8" */
    vram: z.string().optional(),
    deploys: z.array(reference('deploy')).default([]),
  }),
});

/** 社区项目：社区围绕开源模型做的各种方案 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    ...base,
    /** 项目形态，例如 "推理加速" / "KV cache 压缩"，卡片上作为要点展示 */
    params: z.string().optional(),
    /** 关联的部署方式 */
    deploys: z.array(reference('deploy')).default([]),
  }),
});

/** 部署方式：和 LLM 相关，按方案大类分组而不是按时间 */
const deploy = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/deploy' }),
  schema: z.object({
    ...base,
    /** 方案大类，决定在部署页里归到哪一组 */
    kind: z.enum(DEPLOY_KINDS),
    /** GitHub star 数（热度）：部署页大类内按它从高到低排；应用闭源的项目计其官方公开仓库 */
    stars: z.number().int().nonnegative().optional(),
    /** 支持什么（模型格式 / 硬件 / 特性） */
    supports: z.array(z.string()).default([]),
    /** 上手难点，写清楚能省别人几小时 */
    pain: z.string().optional(),
  }),
});

export const collections = { llm, aigc, projects, deploy };