import { getCollection } from 'astro:content';
import hfDownloads from '../data/hf-downloads.json';
import { OUTPUT_LABELS } from './format';
import { sizeBucketOf, contextBucketOf, popularityTagOf, type ModelCollection } from './taxonomy';

export type CollectionName = 'llm' | 'aigc' | 'projects' | 'deploy';

/** 四个集合归一化之后的统一形状，列表页只认这个 */
export interface Entry {
  collection: CollectionName;
  id: string;
  href: string;
  title: string;
  org: string;
  /** 所属：Qwen / Meta / DeepSeek… */
  family?: string;
  released: Date;
  added: Date;
  summary: string;
  tags: string[];
  /**
   * 派生筛选面：所属（family）+ 上下文（context）+ 参数量（params 分档）+ 商用（commercial）。
   * 只有 LLM / AIGC 有；社区项目与部署方式不展示标签
   */
  facets: string[];
  /** 上下文分档标签：低 0-128K / 中 128K-512K / 高 >512K。用于侧栏「筛选」与卡片胶囊的匹配 */
  contextTag?: string;
  /** 上下文原文标签，例如 128K / 1M。卡片胶囊上直接展示；只做展示，不作为筛选条件 */
  contextValue?: string;
  /** 参数量分档标签：LLM 是 低 ≤100B / 中 100-500B / 高 ≥500B，AIGC 是 低 0-8B / 中 8-32B / 高 ≥32B。从 params 里抠出总参数量再按集合分档，只用于侧栏「筛选」 */
  sizeTag?: string;
  /** 参数量原文（例如 `235B (激活 22B)`），卡片胶囊上直接展示；只做展示，不作为筛选条件 */
  params?: string;
  /** 是否可商用，来自内容里的 commercial 字段（只有 LLM / AIGC 有） */
  commercial?: string;
  /** HuggingFace 近 30 天下载量，取自 `src/data/hf-downloads.json` 快照；没取到时为 undefined */
  downloads?: number;
  /** 热度分档标签：LLM 是 低 <10万 / 中 10万-100万 / 高 ≥100万，AIGC 是 低 <1万 / 中 1万-5万 / 高 ≥5万。由 downloads 分档而来 */
  popularityTag?: string;
  license?: string;
  status: 'active' | 'dead' | 'deprecated';
  featured: boolean;
  links: Record<string, string | undefined>;
  /** 卡片上展示的要点（chips）：参数量 / 架构 / 方案类型等 */
  facts: string[];
  /** 仅 deploy 集合有：方案大类，用于分组 */
  kind?: string;
  /** 仅 deploy 集合有：GitHub star 数（热度），大类内按它从高到低排 */
  stars?: number;
  /** 仅供搜索索引使用 */
  body?: string;
}

/** 顶栏只保留四项，这里描述的是各项对应的页面 */
export const COLLECTIONS: { name: CollectionName; label: string; path: string; desc: string }[] = [
  { name: 'llm', label: 'LLM', path: '/llm/models/', desc: '语言模型：开放权重、可自部署' },
  { name: 'aigc', label: 'AIGC', path: '/aigc/image/', desc: '生图 / 生视频模型' },
  { name: 'projects', label: '社区项目', path: '/llm/github/', desc: '社区围绕开源模型做的各种方案' },
  { name: 'deploy', label: '部署方式', path: '/llm/deploy/', desc: '本地部署工具：一体化 / 平台 / 引擎 / 生态' },
];

export const COLLECTION_LABELS: Record<CollectionName, string> = {
  llm: 'LLM',
  aigc: 'AIGC',
  projects: '社区项目',
  deploy: '部署方式',
};

function factsFor(collection: CollectionName, data: any): string[] {
  if (collection === 'llm') {
    // 卡片上只留参数量：上下文与显存要求不再在列表里出现（详情页仍然完整展示）
    return [data.params].filter(Boolean);
  }
  if (collection === 'aigc') {
    return [OUTPUT_LABELS[data.output] ?? data.output, data.architecture, data.params].filter(Boolean);
  }
  if (collection === 'projects') {
    return [data.params, data.license].filter(Boolean);
  }
  return [data.kind, ...(data.supports ?? [])].filter(Boolean);
}

/**
 * 上下文解析：取 context 自由文本开头的「数字 + K/M/T」。
 * 这样 `128K（原生 32K，需 YaRN 扩展）` 与 `1M` 都能得到干净的值，
 * 括号里的补充说明（YaRN、可扩展）不会混进来。
 * `value` 是原文标签（128K / 1M / 10M…），`k` 是折成 K 的数值，供分档用。
 */
function contextParse(context?: string): { value: string; k: number } | undefined {
  if (!context) return undefined;
  const m = context.match(/^\s*(\d+(?:\.\d+)?)\s*([KMT])/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  const k = m[2].toUpperCase() === 'T' ? n * 1024 * 1024 : m[2].toUpperCase() === 'M' ? n * 1024 : n;
  return { value: `${m[1]}${m[2].toUpperCase()}`, k };
}

/**
 * 参数量分档标签。params 是自由文本（`235B (激活 22B)` / `1.6T (激活 49B)`），
 * 只认**开头**那段总参数量：激活参数写在括号里，不会被当成总量。
 * 数字后面必须紧跟 B / T，`70B (Dense)` 这种也照样解析。
 * 分档**按集合分两套阈值**（LLM 100B/500B、AIGC 8B/32B，见 taxonomy），所以要传集合进来。
 */
function sizeTagOf(params: string | undefined, collection: ModelCollection): string | undefined {
  if (!params) return undefined;
  const m = params.match(/(\d+(?:\.\d+)?)\s*([BT])/i);
  if (!m) return undefined;
  const totalB = m[2].toUpperCase() === 'T' ? Number(m[1]) * 1000 : Number(m[1]);
  return sizeBucketOf(totalB, collection);
}

/**
 * 「热度」的数据源：`src/data/hf-downloads.json`（由 `_verify/hf-downloads.mjs` 生成），
 * 按 HuggingFace 仓库 ID 存下载量。**构建期不联网** —— 快照进仓库，想刷新热度就重跑那个脚本。
 */
const HF_DOWNLOAD_REPOS: Record<string, { downloads?: number }> =
  (hfDownloads as { repos?: Record<string, { downloads?: number }> }).repos ?? {};

/**
 * 从 `links.hf` 里取出仓库 ID：`https://huggingface.co/Qwen/Qwen3-8B` → `Qwen/Qwen3-8B`。
 * 只认模型仓库页 —— spaces / datasets / collections 这些不是权重仓库，也没有下载量。
 */
export function hfRepoOf(url?: string): string | undefined {
  const m = String(url ?? '').match(/^https?:\/\/huggingface\.co\/([^/?#]+)\/([^/?#]+)/);
  if (!m) return undefined;
  const kind = m[1].toLowerCase();
  if (['spaces', 'datasets', 'collections', 'papers', 'blog', 'models', 'organizations'].includes(kind)) {
    return undefined;
  }
  return `${m[1]}/${m[2]}`;
}

/** 这条条目的 HF 下载量；快照里没有（仓库已删除 / gated 没取到）就是 undefined，不进「热度」分档 */
function downloadsOf(hfLink?: string): number | undefined {
  const repo = hfRepoOf(hfLink);
  return repo ? HF_DOWNLOAD_REPOS[repo]?.downloads : undefined;
}

function normalize(collection: CollectionName, entry: { id: string; data: any; body?: string }): Entry {
  const d = entry.data;
  // 所属 / 上下文 / 参数量 / 商用 / 热度 这几组筛选面只做在"模型"页上：社区项目与部署方式不展示标签
  // （它们的 params 是「项目形态 / 方案类型」，不能被当成参数量去分档）
  const isModel = collection === 'llm' || collection === 'aigc';
  // 上下文：原文标签给卡片展示，分档标签给侧栏「筛选」
  const context = isModel ? contextParse(d.context) : undefined;
  const contextValue = context?.value;
  const contextTag = context ? contextBucketOf(context.k) : undefined;
  const sizeTag = isModel ? sizeTagOf(d.params, collection as ModelCollection) : undefined;
  // 热度：HF 下载量 → 分档标签。**LLM 与 AIGC 是两套阈值**（见 taxonomy），
  // 所以要把集合传进去；快照里没有这个仓库时保持 undefined，条目只是不出现在热度筛选里
  const downloads = isModel ? downloadsOf(d.links?.hf) : undefined;
  const popularityTag = isModel ? popularityTagOf(downloads, collection as ModelCollection) : undefined;
  return {
    collection,
    id: entry.id,
    href: `/${collection}/${entry.id}/`,
    title: d.title,
    org: d.org,
    family: d.family,
    released: d.released,
    added: d.added ?? d.released,
    summary: d.summary,
    tags: d.tags ?? [],
    facets: isModel ? [d.family, contextTag, sizeTag, d.commercial, popularityTag].filter(Boolean) : [],
    contextTag,
    contextValue,
    sizeTag,
    params: isModel ? d.params : undefined,
    commercial: d.commercial,
    downloads,
    popularityTag,
    license: d.license,
    status: d.status ?? 'active',
    featured: d.featured ?? false,
    links: d.links ?? {},
    facts: factsFor(collection, d),
    kind: d.kind,
    stars: d.stars,
    body: entry.body,
  };
}

export function toEntry(collection: CollectionName, entry: { id: string; data: any; body?: string }): Entry {
  return normalize(collection, entry);
}

/** 取全部收录条目，按发布时间倒序 */
export async function allEntries(): Promise<Entry[]> {
  const [llm, aigc, projects, deploy] = await Promise.all([
    getCollection('llm'),
    getCollection('aigc'),
    getCollection('projects'),
    getCollection('deploy'),
  ]);
  const merged: Entry[] = [
    ...llm.map((e) => normalize('llm', e as any)),
    ...aigc.map((e) => normalize('aigc', e as any)),
    ...projects.map((e) => normalize('projects', e as any)),
    ...deploy.map((e) => normalize('deploy', e as any)),
  ];
  return merged.sort((a, b) => b.released.getTime() - a.released.getTime());
}

export async function entriesOf(collection: CollectionName): Promise<Entry[]> {
  return (await allEntries()).filter((e) => e.collection === collection);
}

/** AIGC 按生图 / 生视频拆开 */
export async function aigcOf(output: 'image' | 'video'): Promise<Entry[]> {
  const [aigc, raw] = await Promise.all([entriesOf('aigc'), getCollection('aigc')]);
  const ids = new Set(raw.filter((e: any) => e.data.output === output).map((e: any) => e.id));
  return aigc.filter((e) => ids.has(e.id));
}

export function tagCounts(entries: Entry[]): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const e of entries) for (const t of e.tags) map.set(t, (map.get(t) ?? 0) + 1);
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh'));
}

export function byTag(entries: Entry[], tag: string): Entry[] {
  return entries.filter((e) => e.tags.includes(tag));
}

/** 派生筛选面（所属 / 商用）每个取值下有多少条，给侧栏角标用 */
export function facetCounts(entries: Entry[]): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const e of entries) for (const f of e.facets) map.set(f, (map.get(f) ?? 0) + 1);
  return [...map.entries()].map(([tag, count]) => ({ tag, count }));
}

function ym(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** 按"年-月"分组（组内已经是新的在前，入参本身就是发布时间倒序） */
export function groupByMonth(entries: Entry[]): { key: string; items: Entry[] }[] {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    const key = ym(e.released);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return [...map.entries()].map(([key, items]) => ({ key, items }));
}

/** 当前自然月（按 UTC 算，和 formatDate 保持一致） */
export function currentMonthKey(now = new Date()): string {
  return ym(now);
}

export function monthKeyLabel(key: string): string {
  const [y, m] = key.split('-');
  return `${y} 年 ${Number(m)} 月`;
}

/** 左侧"时间"筛选下拉里的一项 */
export interface MonthOption {
  /** 年-月，例如 2026-02 */
  key: string;
  /** 完整文案，例如 2026 年 2 月（下拉标题与 hash 提示用这个） */
  label: string;
  /** 短文案，例如 2 月（列表里已经有年份小标题了） */
  short: string;
  /** 这个月有多少条 */
  count: number;
}

/** 时间下拉按年分的一组 */
export interface YearGroup {
  /** 年份，例如 2026 */
  year: string;
  /** 这一年总共有多少条 */
  count: number;
  /** 该年下的月份，新的在前 */
  months: MonthOption[];
}

/** 有内容的"年-月"，按年分组、年与月都是新的在前（空月份不会出现） */
export function monthGroups(entries: Entry[]): YearGroup[] {
  const groups: YearGroup[] = [];
  for (const group of groupByMonth(entries)) {
    const [year, month] = group.key.split('-');
    let bucket = groups[groups.length - 1];
    if (!bucket || bucket.year !== year) {
      bucket = { year, count: 0, months: [] };
      groups.push(bucket);
    }
    bucket.months.push({
      key: group.key,
      label: monthKeyLabel(group.key),
      short: `${Number(month)} 月`,
      count: group.items.length,
    });
    bucket.count += group.items.length;
  }
  return groups;
}

/** 本月发布的条目 */
export function inMonth(entries: Entry[], key: string): Entry[] {
  return entries.filter((e) => ym(e.released) === key);
}

/** 最近 days 个自然日内发布的条目（从当前时间往前数、含今天），首页"近期模型"用它取窗口 */
export function releasedWithinDays(entries: Entry[], days: number, now = new Date()): Entry[] {
  const cutoff = now.getTime() - days * 86_400_000;
  return entries.filter((e) => e.released.getTime() >= cutoff);
}

/** 从本月往前数 count 个自然月，新的在前 */
export function recentMonthKeys(count: number, now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 0; i < count; i++) {
    keys.push(currentMonthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
  }
  return keys;
}

/** 一列「年-月」的区间文案：同月是「2026 年 10 月」，同年跨月是「2026 年 9–10 月」，跨年是「2025 年 12 月 – 2026 年 1 月」 */
export function monthRangeLabel(keys: string[]): string {
  if (keys.length === 0) return '';
  const sorted = [...keys].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (first === last) return monthKeyLabel(first);
  const [fy, fm] = first.split('-');
  const [ly, lm] = last.split('-');
  if (fy === ly) return `${fy} 年 ${Number(fm)}–${Number(lm)} 月`;
  return `${fy} 年 ${Number(fm)} 月 – ${ly} 年 ${Number(lm)} 月`;
}