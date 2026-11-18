<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PackagePlus, Search, ShieldCheck } from 'lucide-vue-next'
import HeroSection from '@/components/HeroSection.vue'
import CategoryGrid from '@/components/CategoryGrid.vue'
import PostGrid from '@/components/PostGrid.vue'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import { getPosts } from '@/api/posts'
import { useCategoryStore } from '@/stores/categories'
import { errorMessage } from '@/utils/format'
import type { Post } from '@/types'

const router = useRouter()
const categoryStore = useCategoryStore()

const latest = ref<Post[]>([])
const latestLoading = ref(true)
const latestError = ref('')

async function loadLatest() {
  latestLoading.value = true
  latestError.value = ''
  try {
    const res = await getPosts({ page: 1, pageSize: 8 })
    latest.value = res.items
  } catch (e) {
    latestError.value = errorMessage(e)
  } finally {
    latestLoading.value = false
  }
}

onMounted(() => {
  void categoryStore.fetch()
  void loadLatest()
})
</script>

<template>
  <div class="home-page">
    <HeroSection />

    <div class="page-container">
      <!-- 分类入口 -->
      <section class="section">
        <div class="section-head">
          <div>
            <h2>按分类查找</h2>
            <p class="section-sub">选择物品分类，快速浏览相关寻物与招领信息</p>
          </div>
        </div>
        <LoadingSkeleton
          v-if="categoryStore.loading && !categoryStore.loaded"
          variant="cards"
          :count="6"
        />
        <ErrorState
          v-else-if="categoryStore.error"
          :message="categoryStore.error"
          @retry="categoryStore.fetch(true)"
        />
        <CategoryGrid v-else :categories="categoryStore.items" />
      </section>

      <!-- 最新信息 -->
      <section class="section">
        <div class="section-head">
          <div>
            <h2>最新发布</h2>
            <p class="section-sub">看看同学们最近发布的信息</p>
          </div>
          <router-link to="/posts" class="section-more">查看全部 →</router-link>
        </div>
        <LoadingSkeleton v-if="latestLoading" variant="cards" :count="6" />
        <ErrorState v-else-if="latestError" :message="latestError" @retry="loadLatest" />
        <EmptyState
          v-else-if="!latest.length"
          title="暂时还没有信息"
          description="成为第一个发布的人吧，帮助同学找回失物，或发布你捡到的物品。"
          action-text="发布信息"
          @action="router.push('/publish')"
        />
        <PostGrid v-else :posts="latest" />
      </section>

      <!-- 平台说明与安全提示 -->
      <section class="section home-guide">
        <div class="guide-grid">
          <div class="guide-card">
            <span class="guide-card__icon"><Search :size="22" /></span>
            <h3>三步找回失物</h3>
            <ol>
              <li>进入「寻找物品」，搜索或筛选目标信息</li>
              <li>查看详情，提交认领申请或提供线索</li>
              <li>等待发布者确认，完成物品交接</li>
            </ol>
          </div>
          <div class="guide-card">
            <span class="guide-card__icon"><PackagePlus :size="22" /></span>
            <h3>发布与互助</h3>
            <ol>
              <li>发布寻物启事或招领信息，描述越详细越容易找到</li>
              <li>收到申请后及时处理，接受后完成交接确认</li>
              <li>好心的你，也可以为失主提供线索</li>
            </ol>
          </div>
          <div class="guide-card guide-card--tips">
            <span class="guide-card__icon"><ShieldCheck :size="22" /></span>
            <h3>互助安全提示</h3>
            <ul>
              <li>线下交接请选择公共场合，尽量结伴前往</li>
              <li>不要向陌生人透露身份证号、完整学号等敏感信息</li>
              <li>涉及酬谢请保持谨慎，平台不介入任何交易</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.section-more {
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.guide-card {
  padding: 24px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);

  h3 {
    font-size: 16px;
    margin: 14px 0 10px;
  }

  ol,
  ul {
    padding-left: 18px;

    li {
      font-size: 13px;
      color: var(--color-text-secondary);
      line-height: 1.9;
    }
  }
}

.guide-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.guide-card--tips {
  .guide-card__icon {
    background: var(--color-accent-light);
    color: var(--color-accent);
  }
}

@media (max-width: 900px) {
  .guide-grid {
    grid-template-columns: 1fr;
  }
}
</style>
