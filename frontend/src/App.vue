<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const route = useRoute()

// blank 布局用于登录/注册/404 等无导航页面
const layoutComponent = computed(() =>
  route.meta.layout === 'blank' ? 'div' : DefaultLayout
)
</script>

<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>
