const DAY = 86_400_000;

/** 统一按 UTC 输出 YYYY-MM-DD，避免 YAML 日期被时区推前一天 */
export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 带 "/" 的日期，卡片时间戳用 */
export function formatDay(date: Date): string {
  return formatDate(date).replace(/-/g, '/');
}

export function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const ub = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.floor((ub - ua) / DAY);
}

export const MODALITY_LABELS: Record<string, string> = {
  text: '纯文本',
  image: '可识别图像',
  audio: '音频',
  code: '代码',
};

export const OUTPUT_LABELS: Record<string, string> = {
  image: '生图',
  video: '生视频',
};

export const LINK_LABELS: Record<string, string> = {
  hf: 'HuggingFace',
  github: 'GitHub',
  paper: '论文',
  demo: '在线体验',
  docs: '文档',
};

/**
 * 热度数字（HuggingFace 下载量）的显示写法：
 * 到 1 万就折成「8.4万 / 76.8万 / 1234万」——与热度分档的「10万 / 100万」同一口径，
 * 免得首页热门榜上写一长串「767,871」；不到 1 万给原数带千分位。
 */
export function formatDownloads(n: number): string {
  if (n >= 10_000) {
    const w = n / 10_000;
    return `${w >= 100 ? Math.round(w) : w.toFixed(1)}万`;
  }
  return n.toLocaleString('en-US');
}

export const STATUS_LABELS: Record<string, string> = {
  active: '可用',
  dead: '链接已失效',
  deprecated: '已停止维护',
};