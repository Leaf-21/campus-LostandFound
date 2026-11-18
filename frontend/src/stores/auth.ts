import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getMe, login as loginApi, register as registerApi } from '@/api/auth'
import { tokenStore } from '@/api/http'
import type { LoginInput, RegisterInput, User } from '@/types'

/** 全局登录态：Token 存 sessionStorage，刷新后通过 /auth/me 恢复用户信息 */
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(tokenStore.get())
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => !!token.value)

  async function login(payload: LoginInput) {
    const res = await loginApi(payload)
    token.value = res.accessToken
    tokenStore.set(res.accessToken)
    user.value = res.user
  }

  async function register(payload: RegisterInput) {
    return registerApi(payload)
  }

  /** 应用启动时恢复登录态；失败不打断浏览（401 已由拦截器统一清理） */
  async function fetchMe() {
    if (!token.value) return
    try {
      user.value = await getMe()
    } catch {
      token.value = null
      tokenStore.clear()
    }
  }

  function logout() {
    token.value = null
    user.value = null
    tokenStore.clear()
  }

  return { token, user, isLoggedIn, login, register, fetchMe, logout }
})
