<script setup lang="ts">
import { X } from 'lucide-vue-next'

export interface FilterChip {
  key: string
  label: string
}

defineProps<{ chips: FilterChip[] }>()

defineEmits<{
  (e: 'remove', key: string): void
  (e: 'clear'): void
}>()
</script>

<template>
  <div v-if="chips.length" class="filter-chips">
    <span class="filter-chips__label">当前筛选：</span>
    <button
      v-for="chip in chips"
      :key="chip.key"
      type="button"
      class="filter-chip"
      @click="$emit('remove', chip.key)"
    >
      {{ chip.label }}
      <X :size="13" class="filter-chip__x" />
    </button>
    <button type="button" class="filter-chip filter-chip--clear" @click="$emit('clear')">
      清空筛选
    </button>
  </div>
</template>

<style lang="scss" scoped>
.filter-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chips__label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: #fff;
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.filter-chip__x {
  opacity: 0.6;
}

.filter-chip--clear {
  border-style: dashed;
  color: var(--color-text-secondary);

  &:hover {
    border-color: var(--color-danger);
    color: var(--color-danger);
  }
}
</style>
