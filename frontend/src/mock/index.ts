export * from './handlers'

/** Mock 开关：仅 API service 层使用；页面/组件不得依据本函数做业务分支（docs/06） */
export function useMock(): boolean {
  return import.meta.env.VITE_USE_MOCK === 'true'
}

/** 登录页演示账号提示：非 Mock 模式为空字符串，页面直接渲染即可 */
export const MOCK_LOGIN_HINT = useMock()
  ? '演示账号：student2026 / Passw0rd!（当前为 Mock 数据模式）'
  : ''
