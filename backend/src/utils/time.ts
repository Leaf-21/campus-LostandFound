// 时间出参统一 ISO 8601 带 +08:00 偏移（docs/00 §6、docs/13 D6）。
// DB 按 UTC 存，这里把 UTC 时刻格式化为 Asia/Shanghai 固定偏移。
const OFFSET_MS = 8 * 60 * 60 * 1000;

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

export function toIsoShanghai(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const shifted = new Date(date.getTime() + OFFSET_MS);
  return (
    `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}` +
    `T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}` +
    `.${pad(shifted.getUTCMilliseconds(), 3)}+08:00`
  );
}

/** 解析前端传来的 ISO 时间为 Date；非法返回 null */
export function parseIso(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
