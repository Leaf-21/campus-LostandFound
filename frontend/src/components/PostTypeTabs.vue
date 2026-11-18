<script setup lang="ts">
import { Megaphone, PackageSearch } from 'lucide-vue-next'
import type { PostType } from '@/types'
import { POST_TYPE_LABEL } from '@/utils/constants'

defineProps<{ modelValue: PostType }>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: PostType): void
  (e: 'change', v: PostType): void
}>()

function select(value: PostType) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <div class="type-tabs" role="tablist" aria-label="信息类型切换">
    <button
      type="button"
      role="tab"
      class="type-tab"
      :class="{ 'is-active': modelValue === 'LOST' }"
      :aria-selected="modelValue === 'LOST'"
      @click="select('LOST')"
    >
      <span class="type-tab__icon"><PackageSearch :size="22" /></span>
      <span class="type-tab__text">
        <strong>{{ POST_TYPE_LABEL.LOST }}</strong>
        <small>我丢失了物品</small>
      </span>
    </button>
    <button
      type="button"
      role="tab"
      class="type-tab"
      :class="{ 'is-active': modelValue === 'FOUND' }"
      :aria-selected="modelValue === 'FOUND'"
      @click="select('FOUND')"
    >
      <span class="type-tab__icon"><Megaphone :size="22" /></span>
      <span class="type-tab__text">
        <strong>{{ POST_TYPE_LABEL.FOUND }}</strong>
        <small>我捡到了物品</small>
      </span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.type-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  max-width: 560px;
}

.type-tab {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: #fff;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-card);
  cursor: pointer;
  text-align: left;
  color: var(--color-text);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: var(--color-border-strong);
    transform: translateY(-2px);
    box-shadow: var(--shadow-card);
  }

  &.is-active {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 12%, transparent);
  }
}

.type-tab__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  flex-shrink: 0;

  .is-active & {
    background: var(--color-primary);
    color: #fff;
  }
}

.type-tab__text {
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    font-size: 16px;
  }

  small {
    font-size: 12px;
    color: var(--color-text-secondary);
  }
}

@media (max-width: 640px) {
  .type-tabs {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .type-tab {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
    padding: 14px;
  }
}
</style>
