<script setup lang="ts">
import type { Component } from 'vue'
import { BookOpen, IdCard, Package, Shapes, Shirt, Smartphone } from 'lucide-vue-next'
import type { Category } from '@/types'

defineProps<{ categories: Category[] }>()

/** 分类图标映射（未命中时使用 Shapes 兜底） */
const ICONS: Record<string, Component> = {
  数码产品: Smartphone,
  证件卡类: IdCard,
  书籍文具: BookOpen,
  生活用品: Package,
  衣物配饰: Shirt,
  其他: Shapes
}
</script>

<template>
  <div class="category-grid">
    <router-link
      v-for="c in categories"
      :key="c.id"
      class="category-card"
      :to="{ path: '/posts', query: { categoryId: c.id } }"
    >
      <span class="category-card__icon">
        <component :is="ICONS[c.name] ?? Shapes" :size="24" />
      </span>
      <span class="category-card__name">{{ c.name }}</span>
    </router-link>
  </div>
</template>

<style lang="scss" scoped>
.category-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 22px 12px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  color: var(--color-text);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: var(--color-primary);
    box-shadow: var(--shadow-card-hover);
    color: var(--color-primary);
  }
}

.category-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.category-card__name {
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 900px) {
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 420px) {
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .category-card {
    padding: 16px 8px;
    gap: 8px;
  }

  .category-card__icon {
    width: 44px;
    height: 44px;
  }
}
</style>
