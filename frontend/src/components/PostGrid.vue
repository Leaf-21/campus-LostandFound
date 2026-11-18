<script setup lang="ts">
import type { Post } from '@/types'
import PostCard from './PostCard.vue'

defineProps<{ posts: Post[] }>()
</script>

<template>
  <div class="post-grid">
    <PostCard v-for="post in posts" :key="post.id" :post="post" />
  </div>
</template>

<style lang="scss" scoped>
.post-grid {
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
</style>
