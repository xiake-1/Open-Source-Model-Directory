const DAY = 86_400_000;

/** 统一按 UTC 输出 YYYY-MM-DD，避免 YAML 日期被时区推前一天 */
export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const ub = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.floor((ub - ua) / DAY);
}

/** 构建期使用：判断"是否近期发布"，用于首页/列表页的初版标记 */
export function isRecent(date: Date, days: number, now = new Date()): boolean {
  return daysBetween(date, now) <= days;
}

export const MODALITY_LABELS: Record<string, string> = {
  text: '文本',
  image: '图像',
  audio: '音频',
  code: '代码',
};

export const OUTPUT_LABELS: Record<string, string> = {
  image: '图像生成',
  video: '视频生成',
  audio: '音频生成',
  '3d': '3D 生成',
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