import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types'

/** 前端统一业务异常：message 为可直接展示给用户的中文提示 */
export class ApiError extends Error {
  status?: number
  code?: number
  fieldErrors?: { field: string; reason: string }[]

  constructor(
    message: string,
    status?: number,
    code?: number,
    fieldErrors?: { field: string; reason: string }[]
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

/** Token 仅存 sessionStorage（docs/00 安全规则），不存明文密码 */
const TOKEN_KEY = 'campus_lf_token'

export const tokenStore = {
  get(): string | null {
    return sessionStorage.getItem(TOKEN_KEY)
  },
  set(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token)
  },
  clear() {
    sessionStorage.removeItem(TOKEN_KEY)
  }
}

const BUSINESS_CODE_MESSAGES: Record<number, string> = {
  40001: '请求参数不正确，请检查填写内容',
  40002: '图片类型或大小不符合要求',
  40101: '登录状态已失效，请重新登录',
  40301: '没有权限执行该操作',
  40401: '内容不存在或已被删除',
  40901: '当前状态不允许该操作，请刷新后重试',
  40902: '您已经提交过申请，请等待发布者处理',
  40903: '该信息已由其他申请处理',
  40904: '该账号已被注册',
  50000: '服务器开小差了，请稍后重试'
}

const STATUS_MESSAGES: Record<number, string> = {
  400: '请求参数不正确，请检查填写内容',
  401: '登录状态已失效，请重新登录',
  403: '没有权限执行该操作',
  404: '内容不存在或已被删除',
  409: '操作冲突，请刷新后重试',
  413: '图片大小超出限制（单张不超过 5MB）',
  415: '图片格式不支持（仅支持 JPG/PNG/WEBP）',
  500: '服务器开小差了，请稍后重试'
}

function toApiError(status?: number, body?: ApiResponse<unknown>): ApiError {
  let message = ''
  if (body?.message) message = body.message
  else if (body?.code && BUSINESS_CODE_MESSAGES[body.code]) message = BUSINESS_CODE_MESSAGES[body.code]
  else if (status && STATUS_MESSAGES[status]) message = STATUS_MESSAGES[status]
  if (!message) message = '网络异常，请稍后重试'

  const data = body?.data as { fieldErrors?: { field: string; reason: string }[] } | null
  return new ApiError(message, status, body?.code, data?.fieldErrors)
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 15000
})

instance.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

instance.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status
    const body = error.response?.data
    if (status === 401) {
      // 401 统一清理登录态并引导重新登录（docs/05 全局约定）
      tokenStore.clear()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      }
    }
    return Promise.reject(toApiError(status, body))
  }
)

/** 解包统一响应：code=0 返回 data，否则抛出 ApiError */
async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const body = await promise
  if (body.code !== 0) {
    throw new ApiError(body.message || '操作失败', undefined, body.code)
  }
  return body.data
}

/** 统一请求入口：业务 API 模块只负责路径与类型 */
export const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return unwrap(instance.get<ApiResponse<T>, ApiResponse<T>>(url, config))
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return unwrap(instance.post<ApiResponse<T>, ApiResponse<T>>(url, data, config))
  },
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return unwrap(instance.patch<ApiResponse<T>, ApiResponse<T>>(url, data, config))
  }
}
