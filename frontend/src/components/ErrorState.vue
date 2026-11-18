<script setup lang="ts">
import { AlertCircle, RefreshCw } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    message?: string
    title?: string
  }>(),
  {
    message: '网络可能开小差了，请稍后再试。',
    title: '加载出了点问题'
  }
)

defineEmits<{ (e: 'retry'): void }>()
</script>

<template>
  <div class="error-state">
    <div class="error-state__icon"><AlertCircle :size="38" /></div>
    <h3 class="error-state__title">{{ title }}</h3>
    <p class="error-state__desc">{{ message }}</p>
    <el-button type="primary" plain round @click="$emit('retry')">
      <RefreshCw :size="15" class="error-state__btn-icon" />重新加载
    </el-button>
  </div>
</template>

<style lang="scss" scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 56px 24px;
  border-radius: var(--radius-card);
  background: #fff;
  border: 1px solid var(--color-border);
}

.error-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: var(--color-danger-light);
  color: var(--color-danger);
  margin-bottom: 16px;
}

.error-state__title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 8px;
}

.error-state__desc {
  font-size: var(--fs-helper);
  color: var(--color-text-secondary);
  max-width: 380px;
  line-height: 1.7;
  margin-bottom: 18px;
}

.error-state__btn-icon {
  margin-right: 6px;
  vertical-align: -2px;
}
</style>
