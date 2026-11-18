import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getCategories } from '@/api/categories'
import { errorMessage } from '@/utils/format'
import type { Category } from '@/types'

/** 分类全局缓存：6 个固定分类，多处页面复用，避免重复请求 */
export const useCategoryStore = defineStore('categories', () => {
  const items = ref<Category[]>([])
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref('')

  async function fetch(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    error.value = ''
    try {
      items.value = await getCategories()
      loaded.value = true
    } catch (e) {
      error.value = errorMessage(e)
    } finally {
      loading.value = false
    }
  }

  function nameOf(id: string): string {
    return items.value.find((c) => c.id === id)?.name ?? '其他'
  }

  return { items, loaded, loading, error, fetch, nameOf }
})
