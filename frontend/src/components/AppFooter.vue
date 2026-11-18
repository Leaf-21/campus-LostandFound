<script setup lang="ts">
import { HeartHandshake, ShieldCheck } from 'lucide-vue-next'
</script>

<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="footer-col footer-col--brand">
        <div class="footer-brand">
          <span class="footer-brand__logo"><HeartHandshake :size="20" /></span>
          <span>校园失物招领</span>
        </div>
        <p class="footer-desc">
          让每一件丢失的物品都能回家。面向全校师生的互助平台，发布寻物启事、认领失物、提供线索。
        </p>
      </div>
      <div class="footer-col">
        <h4>快速入口</h4>
        <router-link to="/posts?type=LOST">寻找物品</router-link>
        <router-link to="/posts?type=FOUND">失物招领</router-link>
        <router-link to="/publish">发布信息</router-link>
      </div>
      <div class="footer-col">
        <h4><ShieldCheck :size="15" class="footer-h4-icon" />互助安全提示</h4>
        <ul class="footer-tips">
          <li>线下交接请选择公共场合，尽量结伴前往。</li>
          <li>不要向陌生人透露身份证号、完整学号等敏感信息。</li>
          <li>涉及酬谢请保持谨慎，平台不介入任何交易。</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">课程项目 · 校园失物招领平台 · 仅供学习交流使用</div>
  </footer>
</template>

<style lang="scss" scoped>
.app-footer {
  background: #ffffff;
  border-top: 1px solid var(--color-border);
}

.footer-inner {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 40px 20px 28px;
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 1.6fr;
  gap: 40px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text);
}

.footer-brand__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  color: #fff;
  background: var(--color-primary);
}

.footer-desc {
  margin-top: 12px;
  font-size: var(--fs-helper);
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.footer-col {
  h4 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 14px;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  a {
    display: block;
    margin-bottom: 10px;
    font-size: var(--fs-helper);
    color: var(--color-text-secondary);

    &:hover {
      color: var(--color-primary);
    }
  }
}

.footer-h4-icon {
  color: var(--color-primary);
}

.footer-tips {
  list-style: none;

  li {
    position: relative;
    padding-left: 14px;
    margin-bottom: 10px;
    font-size: var(--fs-helper);
    color: var(--color-text-secondary);
    line-height: 1.7;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--color-accent);
    }
  }
}

.footer-bottom {
  padding: 14px 20px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-secondary);
  border-top: 1px solid var(--color-border);
}

@media (max-width: 760px) {
  .footer-inner {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 28px 16px 20px;
  }
}
</style>
