import { http } from './http'
import { mockGetMe, mockLogin, mockRegister, useMock } from '@/mock'
import type { LoginInput, LoginResult, RegisterInput, RegisterResult, User } from '@/types'

/** 用户登录 */
export function login(payload: LoginInput): Promise<LoginResult> {
  if (useMock()) return mockLogin(payload)
  return http.post<LoginResult>('/auth/login', payload)
}

/** 用户注册 */
export function register(payload: RegisterInput): Promise<RegisterResult> {
  if (useMock()) return mockRegister(payload)
  return http.post<RegisterResult>('/auth/register', payload)
}

/** 获取当前登录用户 */
export function getMe(): Promise<User> {
  if (useMock()) return mockGetMe()
  return http.get<User>('/auth/me')
}
