import { getCollection } from 'astro:content';
import { OUTPUT_LABELS } from './format';

export type CollectionName = 'llm' | 'aigc' | 'deploy';

/** 三个集合归一化之后的统一形状，列表页只认这个 */
export interface Entry {
  collection: CollectionName;
  id: string;
  href: string;
  title: string;
  org: string;
  released: Date;
  added: Date;
  summary: string;
  tags: string[];
  license?: string;
  status: 'active' | 'dead' | 'deprecated';
  featured: boolean;
  links: Record<string, string | undefined>;
  /** 卡片上展示的要点：参数量 / 显存 / 方案类型等 */
  facts: string[];
  /** 仅 deploy 集合有：方案类型，用于分组 */
  kind?: string;
  /** 仅供搜索索引使用 */
  body?: string;
}

export const COLLECTIONS: { name: CollectionName; label: string; path: string; desc: string }[] = [
  { name: 'llm', label: 'LLM', path: '/llm/', desc: '语言模型：开源权重、可自部署' },
  { name: 'aigc', label: 'AIGC', path: '/aigc/', desc: '图像 / 视频 / 音频 / 3D 生成模型' },
  { name: 'deploy', label: '部署方案', path: '/deploy/', desc: '推理引擎、量化、微调、服务化' },
];

function factsFor(collection: CollectionName, data: any): string[] {
  if (collection === 'llm') {
    return [data.params, data.context && `上下文 ${data.context}`, data.vram].filter(Boolean);
  }
  if (collection === 'aigc') {
    return [OUTPUT_LABELS[data.output] ?? data.output, data.architecture, data.vram].filter(Boolean);
  }
  return [data.kind, ...(data.supports ?? [])].filter(Boolean);
}

function normalize(collection: CollectionName, entry: { id: string; data: any; body?: string }): Entry {
  const d = entry.data;
  return {
    collection,
    id: entry.id,
    href: `/${collection}/${entry.id}/`,
    title: d.title,
    org: d.org,
    released: d.released,
    added: d.added ?? d.released,
    summary: d.summary,
    tags: d.tags ?? [],
    license: d.license,
    status: d.status ?? 'active',
    featured: d.featured ?? false,
    links: d.links ?? {},
    facts: factsFor(collection, d),
    kind: d.kind,
    body: entry.body,
  };
}

/** 把任意集合条目转成统一形状（详情页解析关联条目时用） */
export function toEntry(collection: CollectionName, entry: { id: string; data: any; body?: string }): Entry {
  return normalize(collection, entry);
}

/** 取全部收录条目，按发布时间倒序 */
export async function allEntries(): Promise<Entry[]> {
  const [llm, aigc, deploy] = await Promise.all([
    getCollection('llm'),
    getCollection('aigc'),
    getCollection('deploy'),
  ]);
  const merged: Entry[] = [
    ...llm.map((e) => normalize('llm', e as any)),
    ...aigc.map((e) => normalize('aigc', e as any)),
    ...deploy.map((e) => normalize('deploy', e as any)),
  ];
  return merged.sort((a, b) => b.released.getTime() - a.released.getTime());
}

export async function entriesOf(collection: CollectionName): Promise<Entry[]> {
  return (await allEntries()).filter((e) => e.collection === collection);
}

/** 最近 N 天"发布"的条目 */
export function recent(entries: Entry[], days: number, now = new Date()): Entry[] {
  const limit = now.getTime() - days * 86_400_000;
  return entries.filter((e) => e.released.getTime() >= limit);
}

/** 最近 N 天"收录"的条目（看你自己更新了多少） */
export function recentlyAdded(entries: Entry[], days: number, now = new Date()): Entry[] {
  const limit = now.getTime() - days * 86_400_000;
  return entries.filter((e) => e.added.getTime() >= limit);
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

/** 按年月分组，用于列表页的时间轴 */
export function groupByMonth(entries: Entry[]): { key: string; items: Entry[] }[] {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    const key = `${e.released.getUTCFullYear()}-${String(e.released.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return [...map.entries()].map(([key, items]) => ({ key, items }));
}

export const COLLECTION_LABELS: Record<CollectionName, string> = {
  llm: 'LLM',
  aigc: 'AIGC',
  deploy: '部署方案',
};