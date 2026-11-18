import { http } from './http'
import { mockGetCategories, useMock } from '@/mock'
import type { Category } from '@/types'

/** 获取物品分类（公开） */
export function getCategories(): Promise<Category[]> {
  if (useMock()) return mockGetCategories()
  return http.get<Category[]>('/categories')
}
