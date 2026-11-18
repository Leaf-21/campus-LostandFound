import dayjs from 'dayjs'
import { ApiError } from '@/api/http'

/** 格式化 ISO 8601 时间为本地展示格式 */
export function formatDateTime(iso: string | null | undefined, pattern = 'YYYY-MM-DD HH:mm'): string {
  if (!iso) return '—'
  const d = dayjs(iso)
  return d.isValid() ? d.format(pattern) : '—'
}

/** 从任意异常中提取可展示给用户的错误信息 */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message || '操作失败，请稍后重试'
  return '网络异常，请稍后重试'
}

/** 校验 redirect 参数合法性，防止开放重定向 */
export function safeRedirect(raw: unknown): string {
  if (typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')) return raw
  return '/'
}

/** 取用户昵称首字符作为头像占位 */
export function avatarText(name?: string | null): string {
  if (!name) return '校'
  return name.trim().slice(0, 1).toUpperCase()
}
