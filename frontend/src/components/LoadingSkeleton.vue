<script setup lang="ts">
withDefaults(
  defineProps<{
    /** cards：卡片网格骨架；detail：详情页骨架；list：行列表骨架 */
    variant?: 'cards' | 'detail' | 'list'
    count?: number
  }>(),
  { variant: 'cards', count: 6 }
)
</script>

<template>
  <!-- 卡片网格骨架（信息广场/首页） -->
  <div v-if="variant === 'cards'" class="skeleton-cards">
    <div v-for="i in count" :key="i" class="sk-card">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="image" class="sk-card__img" />
          <div class="sk-card__body">
            <el-skeleton-item variant="text" style="width: 72%" />
            <el-skeleton-item variant="text" style="width: 92%" />
            <el-skeleton-item variant="text" style="width: 45%" />
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>

  <!-- 详情页骨架 -->
  <div v-else-if="variant === 'detail'" class="skeleton-detail">
    <el-skeleton animated>
      <template #template>
        <div class="sk-detail">
          <el-skeleton-item variant="image" class="sk-detail__img" />
          <div class="sk-detail__side">
            <el-skeleton-item variant="h1" style="width: 45%" />
            <el-skeleton-item v-for="i in 3" :key="i" variant="text" style="width: 100%" />
            <el-skeleton-item variant="text" style="width: 80%" />
            <el-skeleton-item variant="button" class="sk-detail__btn" />
          </div>
        </div>
      </template>
    </el-skeleton>
  </div>

  <!-- 行列表骨架（个人中心） -->
  <div v-else class="skeleton-list">
    <div v-for="i in count" :key="i" class="sk-row">
      <el-skeleton animated>
        <template #template>
          <div class="sk-row__inner">
            <el-skeleton-item variant="circle" style="width: 40px; height: 40px" />
            <div class="sk-row__body">
              <el-skeleton-item variant="text" style="width: 55%" />
              <el-skeleton-item variant="text" style="width: 88%" />
              <el-skeleton-item variant="text" style="width: 35%" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.skeleton-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

.sk-card {
  border-radius: var(--radius-card);
  background: #fff;
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.sk-card__img {
  width: 100%;
  height: 200px;
  border-radius: 0;
}

.sk-card__body {
  padding: 14px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-detail {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 24px;
}

.sk-detail {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 32px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}

.sk-detail__img {
  width: 100%;
  height: 340px;
  border-radius: var(--radius-card);

  @media (max-width: 760px) {
    height: 220px;
  }
}

.sk-detail__side {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sk-detail__btn {
  width: 200px;
  height: 44px;
  margin-top: 8px;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sk-row {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 16px;
}

.sk-row__inner {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.sk-row__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
