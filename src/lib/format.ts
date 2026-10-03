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

export const STATUS_LABELS: Record<string, string> = {
  active: '可用',
  dead: '链接已失效',
  deprecated: '已停止维护',
};