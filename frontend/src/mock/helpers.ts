import dayjs from 'dayjs'
import { ApiError, tokenStore } from '@/api/http'
import type { PageResult } from '@/types'

/** 模拟网络延迟 200–400ms（docs/06 Mock 约定） */
export function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 200))
}

let seq = 0

/** 生成不透明字符串 ID（前端不得假定其格式） */
export function mockId(prefix: string): string {
  seq += 1
  return `${prefix}${Date.now().toString(36)}${seq.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`
}

/** Mock 鉴权：无 token 时抛出与真实 401 语义一致的 ApiError */
export function requireAuth(): void {
  if (!tokenStore.get()) {
    throw new ApiError('未登录或登录状态已失效，请先登录', 401, 40101)
  }
}

/** 分页工具：与后端 PageResult 语义一致 */
export function paginate<T>(items: T[], page: number, pageSize: number): PageResult<T> {
  const safePage = Math.max(1, page)
  const safeSize = Math.min(50, Math.max(1, pageSize))
  const total = items.length
  const totalPages = Math.ceil(total / safeSize)
  const start = (safePage - 1) * safeSize
  return {
    items: items.slice(start, start + safeSize),
    page: safePage,
    pageSize: safeSize,
    total,
    totalPages
  }
}

/** 当前时间（ISO 8601，含 +08:00 时区偏移） */
export function nowIso(): string {
  return dayjs().format('YYYY-MM-DDTHH:mm:ss+08:00')
}
