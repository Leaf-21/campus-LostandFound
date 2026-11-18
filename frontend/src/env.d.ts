/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 基础地址，例如 http://localhost:3000/api/v1 */
  readonly VITE_API_BASE_URL: string
  /** true = 使用 Mock 数据；false = 请求真实后端 */
  readonly VITE_USE_MOCK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
