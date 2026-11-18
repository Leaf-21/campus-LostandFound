<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SlidersHorizontal } from 'lucide-vue-next'
import PostTypeTabs from '@/components/PostTypeTabs.vue'
import PostFilters from '@/components/PostFilters.vue'
import FilterChips, { type FilterChip } from '@/components/FilterChips.vue'
import PostGrid from '@/components/PostGrid.vue'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { getPosts } from '@/api/posts'
import { useCategoryStore } from '@/stores/categories'
import { errorMessage } from '@/utils/format'
import { postStatusLabel } from '@/utils/constants'
import type { PageResult, Post, PostStatus, PostType, SortOrder } from '@/types'

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()

const query = reactive({
  postType: 'LOST' as PostType,
  keyword: '',
  categoryId: '',
  location: '',
  status: '',
  sort: 'LATEST' as SortOrder,
  page: 1,
  pageSize: 12
})

/** 关键词/地点的暂存输入（提交后才进入 query 触发请求） */
const keywordInput = ref('')
const locationInput = ref('')

const result = ref<PageResult<Post> | null>(null)
const loading = ref(false)
const error = ref('')
const drawerOpen = ref(false)

function initFromRoute() {
  const q = route.query
  if (q.type === 'LOST' || q.type === 'FOUND') query.postType = q.type
  query.keyword = typeof q.keyword === 'string' ? q.keyword : ''
  query.categoryId = typeof q.categoryId === 'string' ? q.categoryId : ''
  query.location = typeof q.location === 'string' ? q.location : ''
  query.status = typeof q.status === 'string' ? q.status : ''
  if (q.sort === 'LATEST' || q.sort === 'OLDEST') query.sort = q.sort
  query.page = Number(q.page) > 0 ? Number(q.page) : 1
  keywordInput.value = query.keyword
  locationInput.value = query.location
}

function buildParams() {
  return {
    postType: query.postType,
    keyword: query.keyword.trim() || undefined,
    categoryId: query.categoryId || undefined,
    location: query.location.trim() || undefined,
    status: (query.status || undefined) as PostStatus | undefined,
    sort: query.sort,
    page: query.page,
    pageSize: query.pageSize
  }
}

async function fetchList() {
  loading.value = true
  error.value = ''
  try {
    result.value = await getPosts(buildParams())
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

/** 筛选变化：页码重置为 1（页码 watcher 会触发重新请求） */
watch(
  () => [query.postType, query.keyword, query.categoryId, query.location, query.status, query.sort],
  () => {
    if (query.page !== 1) {
      query.page = 1
    } else {
      void fetchList()
    }
  }
)

watch(
  () => query.page,
  () => void fetchList()
)

/** 筛选状态同步到 URL（可分享、可回退） */
watch(
  () => ({ ...query }),
  () => {
    void router.replace({
      query: {
        type: query.postType,
        keyword: query.keyword || undefined,
        categoryId: query.categoryId || undefined,
        location: query.location || undefined,
        status: query.status || undefined,
        sort: query.sort === 'LATEST' ? undefined : query.sort,
        page: query.page > 1 ? String(query.page) : undefined
      }
    })
  }
)

/** 外部导航（首页分类入口、浏览器回退）同步到查询状态 */
watch(
  () => route.query,
  (q) => {
    const type = q.type === 'FOUND' ? 'FOUND' : q.type === 'LOST' ? 'LOST' : undefined
    const categoryId = typeof q.categoryId === 'string' ? q.categoryId : ''
    if ((type && type !== query.postType) || categoryId !== query.categoryId) {
      if (type) query.postType = type
      query.categoryId = categoryId
    }
  }
)

/* ---------- 筛选交互 ---------- */

function onFiltersChange(patch: { categoryId?: string; status?: string; sort?: SortOrder }) {
  if (patch.categoryId !== undefined) query.categoryId = patch.categoryId
  if (patch.status !== undefined) query.status = patch.status
  if (patch.sort !== undefined) query.sort = patch.sort
}

function onSearch() {
  query.keyword = keywordInput.value.trim()
  query.location = locationInput.value.trim()
}

function onClearKeyword() {
  keywordInput.value = ''
  query.keyword = ''
}

function onClearLocation() {
  locationInput.value = ''
  query.location = ''
}

const chips = computed<FilterChip[]>(() => {
  const list: FilterChip[] = []
  if (query.keyword) list.push({ key: 'keyword', label: `关键词：${query.keyword}` })
  if (query.categoryId) {
    list.push({ key: 'categoryId', label: `分类：${categoryStore.nameOf(query.categoryId)}` })
  }
  if (query.location) list.push({ key: 'location', label: `地点：${query.location}` })
  if (query.status) {
    list.push({
      key: 'status',
      label: `状态：${postStatusLabel(query.status as PostStatus, query.postType)}`
    })
  }
  return list
})

function removeChip(key: string) {
  switch (key) {
    case 'keyword':
      onClearKeyword()
      break
    case 'categoryId':
      query.categoryId = ''
      break
    case 'location':
      onClearLocation()
      break
    case 'status':
      query.status = ''
      break
  }
}

function clearAll() {
  onClearKeyword()
  onClearLocation()
  query.categoryId = ''
  query.status = ''
}

initFromRoute()

onMounted(() => {
  void categoryStore.fetch()
  void fetchList()
})
</script>

<template>
  <div class="page-container posts-page">
    <div class="posts-head">
      <h1>信息广场</h1>
      <p>浏览寻物启事与失物招领，搜索、筛选找到你关心的信息</p>
    </div>

    <PostTypeTabs v-model="query.postType" class="posts-tabs" />

    <div class="posts-filter-bar">
      <PostFilters
        class="posts-filters"
        :keyword="keywordInput"
        :location="locationInput"
        :categories="categoryStore.items"
        :category-id="query.categoryId"
        :status="query.status"
        :sort="query.sort"
        :post-type="query.postType"
        @change="onFiltersChange"
        @input-keyword="(v) => (keywordInput = v)"
        @input-location="(v) => (locationInput = v)"
        @search="onSearch"
        @clear-keyword="onClearKeyword"
        @clear-location="onClearLocation"
      />
      <el-button class="filter-drawer-btn" round @click="drawerOpen = true">
        <SlidersHorizontal :size="15" class="filter-drawer-btn__icon" />筛选
      </el-button>
    </div>

    <FilterChips :chips="chips" @remove="removeChip" @clear="clearAll" />

    <div class="posts-result">
      <p v-if="result" class="posts-count">
        共 {{ result.total }} 条结果
        <span v-if="query.status || query.categoryId || query.location || query.keyword">（当前筛选条件下）</span>
      </p>

      <LoadingSkeleton v-if="loading && !result" variant="cards" :count="6" />
      <ErrorState v-else-if="error" :message="error" @retry="fetchList" />
      <template v-else-if="result">
        <EmptyState
          v-if="!result.items.length"
          title="没有找到相关信息"
          description="试试调整关键词或清除筛选条件；如果还没有人发布，你也可以发布一条新信息。"
          action-text="清空筛选"
          @action="clearAll"
        />
        <template v-else>
          <div class="posts-grid" :class="{ 'is-refreshing': loading }">
            <PostGrid :posts="result.items" />
          </div>
          <el-pagination
            v-if="result.totalPages > 1"
            v-model:current-page="query.page"
            :page-size="query.pageSize"
            :total="result.total"
            layout="prev, pager, next, total"
            background
          />
        </template>
      </template>
    </div>

    <!-- 移动端筛选抽屉 -->
    <el-drawer
      v-model="drawerOpen"
      direction="btt"
      size="auto"
      :with-header="false"
      class="filter-drawer"
    >
      <div class="filter-drawer__body">
        <h3 class="filter-drawer__title">筛选条件</h3>
        <PostFilters
          :keyword="keywordInput"
          :location="locationInput"
          :categories="categoryStore.items"
          :category-id="query.categoryId"
          :status="query.status"
          :sort="query.sort"
          :post-type="query.postType"
          @change="onFiltersChange"
          @input-keyword="(v) => (keywordInput = v)"
          @input-location="(v) => (locationInput = v)"
          @search="onSearch"
          @clear-keyword="onClearKeyword"
          @clear-location="onClearLocation"
        />
        <el-button type="primary" round class="filter-drawer__done" @click="drawerOpen = false">
          完成
        </el-button>
      </div>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.posts-head {
  h1 {
    font-size: var(--fs-page-title);
    font-weight: 700;
  }

  p {
    margin-top: 6px;
    font-size: var(--fs-helper);
    color: var(--color-text-secondary);
  }
}

.posts-tabs {
  margin-top: 20px;
}

.posts-filter-bar {
  margin-top: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.posts-filters {
  flex: 1;
}

.filter-drawer-btn {
  display: none;
}

.posts-count {
  margin: 18px 0 14px;
  font-size: 13px;
  color: var(--color-text-secondary);

  span {
    margin-left: 4px;
  }
}

.posts-result {
  margin-top: 4px;
}

.posts-grid {
  transition: opacity 0.2s ease;

  &.is-refreshing {
    opacity: 0.55;
    pointer-events: none;
  }
}

.filter-drawer__body {
  padding: 20px 16px 28px;
}

.filter-drawer__title {
  font-size: 17px;
  margin-bottom: 16px;
}

.filter-drawer__done {
  width: 100%;
  margin-top: 18px;
}

@media (max-width: 860px) {
  .posts-filters {
    display: none;
  }

  .filter-drawer-btn {
    display: inline-flex;
  }

  .filter-drawer-btn__icon {
    margin-right: 6px;
  }
}
</style>
