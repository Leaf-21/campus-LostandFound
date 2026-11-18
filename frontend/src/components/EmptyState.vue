<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

defineProps<{
  title: string
  description?: string
  /** 下一步行动按钮文案（空状态必须给出可执行的下一步） */
  actionText?: string
}>()

defineEmits<{ (e: 'action'): void }>()
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__icon"><Inbox :size="38" /></div>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p v-if="description" class="empty-state__desc">{{ description }}</p>
    <el-button v-if="actionText" type="primary" round @click="$emit('action')">
      {{ actionText }}
    </el-button>
  </div>
</template>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 56px 24px;
  border-radius: var(--radius-card);
  background: #fff;
  border: 1px dashed var(--color-border-strong);
}

.empty-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  margin-bottom: 16px;
}

.empty-state__title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-state__desc {
  font-size: var(--fs-helper);
  color: var(--color-text-secondary);
  max-width: 380px;
  line-height: 1.7;
  margin-bottom: 18px;
}
</style>
