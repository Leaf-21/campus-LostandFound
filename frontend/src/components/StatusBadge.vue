<script setup lang="ts">
import { computed } from 'vue'
import type { ApplicationStatus, PostStatus, PostType } from '@/types'
import { APPLICATION_STATUS_LABEL, postStatusLabel, STATUS_COLOR } from '@/utils/constants'

const props = defineProps<{
  /** OPEN/PROCESSING/... 或 PENDING/ACCEPTED/... */
  status: string
  /** post：信息状态（文案随 postType 变化）；application：申请状态 */
  variant: 'post' | 'application'
  postType?: PostType
}>()

const label = computed(() => {
  if (props.variant === 'post') {
    return postStatusLabel(props.status as PostStatus, props.postType)
  }
  return APPLICATION_STATUS_LABEL[props.status as ApplicationStatus] ?? props.status
})

const color = computed(() => STATUS_COLOR[props.status] ?? 'var(--color-text-secondary)')
</script>

<template>
  <span class="status-badge" :style="{ color }">
    <span class="status-badge__dot" :style="{ backgroundColor: color }"></span>
    {{ label }}
  </span>
</template>

<style lang="scss" scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 1px 10px;
  border: 1px solid color-mix(in srgb, currentColor 40%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 7%, #ffffff);
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  white-space: nowrap;
}

.status-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
