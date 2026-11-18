<script setup lang="ts">
import { PackageSearch } from 'lucide-vue-next'
</script>

<template>
  <div class="nf-page">
    <div class="nf-card">
      <span class="nf-icon"><PackageSearch :size="46" /></span>
      <h1 class="nf-code">404</h1>
      <p class="nf-title">页面走丢了</p>
      <p class="nf-desc">你访问的页面不存在或已被移除，就像失物一样暂时找不到啦。</p>
      <div class="nf-actions">
        <router-link to="/">
          <el-button type="primary" round>回到首页</el-button>
        </router-link>
        <router-link to="/posts">
          <el-button round>去信息广场</el-button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.nf-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  background: var(--color-bg);
}

.nf-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 440px;
}

.nf-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.nf-code {
  margin-top: 22px;
  font-size: 56px;
  font-weight: 800;
  line-height: 1;
  color: var(--color-primary);
}

.nf-title {
  margin-top: 10px;
  font-size: 20px;
  font-weight: 700;
}

.nf-desc {
  margin-top: 8px;
  font-size: var(--fs-helper);
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.nf-actions {
  display: flex;
  gap: 12px;
  margin-top: 26px;
}
</style>
