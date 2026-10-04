/**
 * 标签体系：列表页左侧竖向栏的唯一定义处。
 * 标签本身写在内容文件的 `tags` 字段里（schema 用枚举强校验），这里只负责"怎么分组展示"。
 * 顺序即侧栏里的显示顺序；某个分组下没有任何条目时，侧栏会自动隐藏它。
 *
 * 注意：这些常量放在 lib 里而不是 content.config.ts —— 页面代码一律从 lib 取值，
 * 避免构建期去求值内容配置文件。
 */

export const LLM_TAGS = ['MoE', 'Dense', '纯文本', '可识别图像'] as const;
export const LLM_TAG_HELP = 'tags 只能是 MoE / Dense / 纯文本 / 可识别图像';

/**
 * AIGC 的「架构」只分生成的骨架，不细分到具体实现：
 *   DiT      扩散 Transformer（含线性扩散、Rectified Flow、单流/双流等变体）
 *   MMDiT    多模态扩散 Transformer（文本与图像 token 走同一主干）
 *   自回归   以「下一个 token」为目标的统一多模态生成（含 MoE 主干）
 *   离散扩散 以离散视觉 token 做并行去噪 / 掩码扩散的那一路
 * 更细的写法（LoRA、蒸馏、专家数）写在 `architecture` 自由文本里。
 */
export const AIGC_TAGS = ['DiT', 'MMDiT', '自回归', '离散扩散'] as const;
export const AIGC_TAG_HELP = 'tags 只能是 DiT / MMDiT / 自回归 / 离散扩散';

/**
 * 部署方式的方案大类（取代旧的 推理引擎 / 量化 / 微调 / 服务化 分类）。
 * 列表页按**条目数从少到多**排大类；条数相同时按这里的顺序。
 * 大类内条目按 `stars`（GitHub star 热度）从高到低排。
 */
export const DEPLOY_KINDS = ['一体化本地运行工具', '支撑性生态', '通用本地 AI 平台', '推理框架 / 服务引擎'] as const;

/** 是否可商用：LLM / AIGC 内容里 commercial 字段的取值，固定枚举 */
export const COMMERCIAL_VALUES = ['可商用', '有条件可商用', '不可商用'] as const;
export const COMMERCIAL_HELP = 'commercial 只能是 可商用 / 有条件可商用 / 不可商用';

/**
 * 派生筛选面的分组名（`facetGroups()` 生成的就是这几个）：
 * 「所属」在列表页会被单独拎出来做成一张下拉卡片（`FamilyFilter.astro`），
 * 其余分组一起待在「筛选」下拉里。分组名都从这里取，避免页面里再写一遍字符串。
 */
export const FAMILY_GROUP_LABEL = '所属';
export const CONTEXT_GROUP_LABEL = '上下文';
export const SIZE_GROUP_LABEL = '参数量';
export const COMMERCIAL_GROUP_LABEL = '商用';
/** 「热度」：按 HuggingFace 下载量分档，不来自内容字段，来自 `src/data/hf-downloads.json` 快照 */
export const POPULARITY_GROUP_LABEL = '热度';

/** 有热度这一说的只有两个集合：社区项目与部署方式没有 HF 下载量，不参与热度分档 */
export type PopularityCollection = 'llm' | 'aigc';

export interface PopularityBucket {
  /** 档位名：低 / 中 / 高 */
  level: string;
  /** 这一档的下限（HF 近 30 天下载量），算 `downloads >= min`；最低档就是 0 */
  min: number;
  /** 区间文案，例如 `≥100万`。侧栏标签与首页热门榜的口径行都用它拼，别再手写一遍 */
  range: string;
}

/** 侧栏「筛选」里这一档怎么写：`高 ≥100万` */
export function popularityLabel(bucket: PopularityBucket): string {
  return `${bucket.level} ${bucket.range}`;
}

/**
 * LLM 的热度分档：低 <10万 / 中 10万-100万 / 高 ≥100万。
 * 阈值取整（10 万 / 100 万）而不是分位数：分位数每月都会飘，文档和用户都对不上账。
 */
export const LLM_POPULARITY_BUCKETS: PopularityBucket[] = [
  { level: '低', min: 0, range: '<10万' },
  { level: '中', min: 100_000, range: '10万-100万' },
  { level: '高', min: 1_000_000, range: '≥100万' },
];

/**
 * AIGC 的热度分档：低 <10万 / 中 10万-50万 / 高 ≥50万。
 * 生图 / 生视频的下载量整体比 LLM 低一档（权重文件大、跑起来门槛高），
 * 所以「高」的门槛只到 50 万 —— 拿 LLM 那把尺子量，整个 AIGC 几乎没有「高」。
 */
export const AIGC_POPULARITY_BUCKETS: PopularityBucket[] = [
  { level: '低', min: 0, range: '<10万' },
  { level: '中', min: 100_000, range: '10万-50万' },
  { level: '高', min: 500_000, range: '≥50万' },
];

/** 哪个集合用哪套分档 —— 分档函数都从这里取，别再各写一份阈值 */
export const POPULARITY_BUCKETS: Record<PopularityCollection, PopularityBucket[]> = {
  llm: LLM_POPULARITY_BUCKETS,
  aigc: AIGC_POPULARITY_BUCKETS,
};

/** 下载量落到这个集合的哪一档；没有下载量数据（仓库没取到）时返回 undefined —— 不参与热度筛选 */
export function popularityTagOf(downloads: number | undefined, collection: PopularityCollection): string | undefined {
  if (typeof downloads !== 'number' || !Number.isFinite(downloads) || downloads < 0) return undefined;
  const buckets = POPULARITY_BUCKETS[collection];
  for (let i = buckets.length - 1; i >= 0; i--) {
    if (downloads >= buckets[i].min) return popularityLabel(buckets[i]);
  }
  return undefined;
}

/** 这个集合「高」那一档的区间文案（`≥100万` / `≥50万`），首页热门榜的口径行用它 */
export function highPopularityRange(collection: PopularityCollection): string {
  const buckets = POPULARITY_BUCKETS[collection];
  return buckets[buckets.length - 1].range;
}

/**
 * 这条模型算不算「高」热度 —— 首页「近期热门」按它挑，门槛两个集合不同。
 * 没有下载量数据的一律不算（宁可少收，也不让没数据的条目挂上"高"）。
 */
export function isHighPopularity(collection: PopularityCollection, downloads?: number): boolean {
  if (typeof downloads !== 'number' || !Number.isFinite(downloads)) return false;
  const buckets = POPULARITY_BUCKETS[collection];
  return downloads >= buckets[buckets.length - 1].min;
}

/**
 * 参数量分档：标签文案自带区间，卡片胶囊上单独看也能懂。
 * 边界按「低 0-100B / 中 100-500B / 高 500B 以上」：正好 100B 算中、正好 500B 算高。
 */
export const SIZE_BUCKETS = [
  { label: '低 ≤100B', max: 100 },
  { label: '中 100-500B', max: 500 },
  { label: '高 ≥500B', max: Infinity },
] as const;

/**
 * 上下文长度分档：标签文案自带区间，卡片 / 侧栏上单独看也能懂。
 * 边界口径：0-128K 是低（正好 128K 算中），128K-512K 是中（512K 仍是中），>512K 才是高。
 */
export const CONTEXT_BUCKET_LABELS = ['低 0-128K', '中 128K-512K', '高 >512K'] as const;

/** 上下文长度（K 为单位的数值）落到哪一档；正好 128K 算中、512K 仍是中、>512K 才是高 */
export function contextBucketOf(k: number): string {
  if (k < 128) return CONTEXT_BUCKET_LABELS[0];
  if (k <= 512) return CONTEXT_BUCKET_LABELS[1];
  return CONTEXT_BUCKET_LABELS[2];
}

export interface TagGroup {
  /** 分组名 */
  label: string;
  /** 该组下的标签，顺序即显示顺序 */
  tags: string[];
  /**
   * 分组标题后面那句小字注释（例如「热度」标注口径是 HF 下载量）。
   * 只有需要解释"这一组按什么算出来"的分组才写。
   */
  note?: string;
}

/** LLM 开源模型：结构 + 类型 */
export const LLM_TAG_GROUPS: TagGroup[] = [
  { label: '结构', tags: ['MoE', 'Dense'] },
  { label: '类型', tags: ['纯文本', '可识别图像'] },
];

/** AIGC：只按模型架构分类 */
export const AIGC_TAG_GROUPS: TagGroup[] = [{ label: '架构', tags: [...AIGC_TAGS] }];

/**
 * 「热度」分组：按 HuggingFace 下载量分档（分档在 `entries.ts` 里由快照算出来）。
 * **LLM 与 AIGC 用两套阈值**，所以要把集合传进来 —— 列表页显示的是自己那套标签，
 * 拿错集合会让「高 ≥50万」出现在 LLM 页上。
 * 它排在**所有标签分组之前**（列表页把它放在「架构 / 结构」上面），
 * 因为它回答的是"这条值不值得点开"，比结构/类型更靠前。
 * 没有任何条目取到下载量时返回空标签数组，调用方的 `visibleGroups()` 会把整组丢掉。
 */
export function popularityGroup(
  collection: PopularityCollection,
  entries: { popularityTag?: string }[]
): TagGroup {
  const used = new Set(entries.map((e) => e.popularityTag).filter((t): t is string => Boolean(t)));
  return {
    label: POPULARITY_GROUP_LABEL,
    tags: POPULARITY_BUCKETS[collection].map(popularityLabel).filter((label) => used.has(label)),
    note: 'HF 下载量',
  };
}

/** 挑出分组里真正有内容的标签，返回可直接渲染的侧栏结构（分组上的 note 也要带着走） */
export function visibleGroups(groups: TagGroup[], used: Set<string>): TagGroup[] {
  return groups
    .map((g) => ({ ...g, tags: g.tags.filter((t) => used.has(t)) }))
    .filter((g) => g.tags.length > 0);
}

/**
 * 派生筛选面：**所属**（Qwen / Meta…）、**上下文**（128K / 1M…）、**参数量**（低 / 中 / 高）
 * 与 **商用**。
 *
 * 它们都不是 `tags` 里的枚举，而是内容字段派生出来的（`family` / `commercial` / `context` / `params`），
 * 所以分组在构建期按实际数据生成 —— 新收录一个家族或一种上下文长度都不用改这里，侧栏自己会出现。
 * 显示顺序：所属按条数从多到少，上下文固定低 → 中 → 高，参数量固定低 → 中 → 高，
 * 商用固定按 "可商用 → 有条件 → 不可商用"。
 *
 * 列表页会把「所属」这一组单独提出来渲染成一张下拉卡片，其余留在「筛选」下拉里：
 * 家族数量随收录增长，平铺成标签会把侧栏撑得很长。
 */
export function facetGroups(
  entries: { family?: string; commercial?: string; contextTag?: string; sizeTag?: string }[]
): TagGroup[] {
  const families = new Map<string, number>();
  const contexts = new Set<string>();
  const sizes = new Set<string>();
  const commercial = new Map<string, number>();
  // contexts / sizes 收集的都是**分档标签**（不是原始值），侧栏按档展示

  for (const entry of entries) {
    if (entry.family) families.set(entry.family, (families.get(entry.family) ?? 0) + 1);
    if (entry.contextTag) contexts.add(entry.contextTag);
    if (entry.sizeTag) sizes.add(entry.sizeTag);
    if (entry.commercial) commercial.set(entry.commercial, (commercial.get(entry.commercial) ?? 0) + 1);
  }

  const byCount = (map: Map<string, number>) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'))
      .map(([key]) => key);

  const groups: TagGroup[] = [];
  if (families.size > 0) groups.push({ label: FAMILY_GROUP_LABEL, tags: byCount(families) });
  if (contexts.size > 0) {
    groups.push({ label: CONTEXT_GROUP_LABEL, tags: CONTEXT_BUCKET_LABELS.filter((l) => contexts.has(l)) });
  }
  if (sizes.size > 0) {
    groups.push({ label: SIZE_GROUP_LABEL, tags: SIZE_BUCKETS.map((b) => b.label).filter((l) => sizes.has(l)) });
  }
  if (commercial.size > 0) {
    groups.push({ label: COMMERCIAL_GROUP_LABEL, tags: COMMERCIAL_VALUES.filter((v) => commercial.has(v)) });
  }
  return groups;
}