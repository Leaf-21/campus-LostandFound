<script setup lang="ts">
import { computed } from 'vue'
import { Search } from 'lucide-vue-next'
import type { Category, PostType, SortOrder } from '@/types'
import { postStatusLabel } from '@/utils/constants'

const props = defineProps<{
  /** 关键词输入（未提交的输入值，由父组件管理） */
  keyword: string
  /** 地点输入（未提交的输入值，由父组件管理） */
  location: string
  categories: Category[]
  categoryId: string
  status: string
  sort: SortOrder
  postType: PostType
}>()

/** 直接生效的筛选变化（分类/状态/排序） */
const emit = defineEmits<{
  (e: 'change', patch: { categoryId?: string; status?: string; sort?: SortOrder }): void
  /** 关键词/地点输入变化（父组件仅暂存，不立即请求） */
  (e: 'input-keyword', v: string): void
  (e: 'input-location', v: string): void
  /** 提交搜索（搜索按钮 / Enter / 地点失焦） */
  (e: 'search'): void
  (e: 'clear-keyword'): void
  (e: 'clear-location'): void
}>()

const statusOptions = computed(() => {
  const t = props.postType
  return [
    { value: 'OPEN', label: postStatusLabel('OPEN', t) },
    { value: 'PROCESSING', label: postStatusLabel('PROCESSING', t) },
    { value: 'RESOLVED', label: postStatusLabel('RESOLVED', t) },
    { value: 'CLOSED', label: postStatusLabel('CLOSED', t) }
  ]
})
</script>

<template>
  <div class="post-filters">
    <el-input
      :model-value="keyword"
      class="filter-search"
      placeholder="搜索标题、描述或地点…"
      clearable
      @input="(v: string | number) => emit('input-keyword', String(v))"
      @keyup.enter="emit('search')"
      @clear="emit('clear-keyword')"
    >
      <template #append>
        <el-button :icon="Search" @click="emit('search')">搜索</el-button>
      </template>
    </el-input>

    <div class="filter-row">
      <el-select
        :model-value="categoryId"
        class="filter-select"
        placeholder="全部分类"
        clearable
        @update:model-value="(v: string) => emit('change', { categoryId: v ?? '' })"
      >
        <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>

      <el-input
        :model-value="location"
        class="filter-select"
        placeholder="地点关键词，如：图书馆"
        clearable
        @input="(v: string | number) => emit('input-location', String(v))"
        @keyup.enter="emit('search')"
        @blur="emit('search')"
        @clear="emit('clear-location')"
      />

      <el-select
        :model-value="status"
        class="filter-select"
        placeholder="全部状态"
        clearable
        @update:model-value="(v: string) => emit('change', { status: v ?? '' })"
      >
        <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>

      <el-select
        :model-value="sort"
        class="filter-select filter-sort"
        @update:model-value="(v: SortOrder) => emit('change', { sort: v })"
      >
        <el-option label="最新发布" value="LATEST" />
        <el-option label="最早发布" value="OLDEST" />
      </el-select>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.post-filters {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.filter-search {
  max-width: 620px;

  :deep(.el-input-group__append) {
    .el-button {
      margin: 0;
      color: #fff;
      background: var(--color-primary);
      border-color: var(--color-primary);

      &:hover {
        background: var(--color-primary-hover);
      }
    }
  }
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  width: 190px;

  @media (max-width: 640px) {
    width: 100%;
  }
}

.filter-sort {
  width: 140px;
}
</style>
