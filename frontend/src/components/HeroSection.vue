<script setup lang="ts">
import { ChevronRight, Megaphone, PackageSearch, Plus, Search } from 'lucide-vue-next'
</script>

<template>
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-text">
        <h1>在校园里，丢了东西也能找回来</h1>
        <p class="hero-sub">
          发布寻物启事、认领失物、提供线索，让每一件物品都回到主人身边。
        </p>
        <div class="hero-actions">
          <router-link to="/posts?type=LOST">
            <el-button type="primary" size="large" round class="hero-btn">
              <Search :size="17" class="hero-btn__icon" />寻找物品
            </el-button>
          </router-link>
          <router-link to="/publish">
            <el-button size="large" round class="hero-btn hero-btn--ghost">
              <Plus :size="17" class="hero-btn__icon" />发布信息
            </el-button>
          </router-link>
        </div>
        <ul class="hero-stats">
          <li><strong>公开</strong><span>无需注册即可浏览</span></li>
          <li><strong>互助</strong><span>同学之间互相帮忙</span></li>
          <li><strong>免费</strong><span>平台不收取任何费用</span></li>
        </ul>
      </div>

      <div class="hero-quick">
        <router-link class="quick-card" to="/posts?type=LOST">
          <span class="quick-card__icon"><PackageSearch :size="26" /></span>
          <div class="quick-card__body">
            <strong>我丢失了</strong>
            <p>发布寻物启事，等待好心人提供线索</p>
          </div>
          <ChevronRight :size="18" class="quick-card__arrow" />
        </router-link>
        <router-link class="quick-card quick-card--accent" to="/posts?type=FOUND">
          <span class="quick-card__icon"><Megaphone :size="26" /></span>
          <div class="quick-card__body">
            <strong>我捡到了</strong>
            <p>发布招领信息，帮助失主找回物品</p>
          </div>
          <ChevronRight :size="18" class="quick-card__arrow" />
        </router-link>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.hero {
  background: linear-gradient(150deg, var(--color-primary-light) 0%, var(--color-bg) 60%);
}

.hero-inner {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 56px 20px 48px;
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 48px;
  align-items: center;
}

.hero-text {
  h1 {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--color-text);
  }
}

.hero-sub {
  margin-top: 14px;
  font-size: 16px;
  color: var(--color-text-secondary);
  max-width: 460px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 14px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.hero-btn__icon {
  margin-right: 6px;
  vertical-align: -3px;
}

.hero-btn--ghost {
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: #fff;

  &:hover {
    background: var(--color-primary-light);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.hero-stats {
  display: flex;
  gap: 34px;
  margin-top: 30px;
  list-style: none;
  flex-wrap: wrap;

  li {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  strong {
    font-size: 15px;
    color: var(--color-primary);
  }

  span {
    font-size: 12px;
    color: var(--color-text-secondary);
  }
}

.hero-quick {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 22px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  color: var(--color-text);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-card-hover);
    border-color: var(--color-primary);
    color: var(--color-text);
  }
}

.quick-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  flex-shrink: 0;
}

.quick-card--accent {
  .quick-card__icon {
    background: var(--color-accent-light);
    color: var(--color-accent);
  }

  &:hover {
    border-color: var(--color-accent);
  }
}

.quick-card__body {
  flex: 1;

  strong {
    font-size: 17px;
    display: block;
  }

  p {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: 4px;
  }
}

.quick-card__arrow {
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

@media (max-width: 860px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 40px 20px 36px;
  }

  .hero-text h1 {
    font-size: 26px;
  }
}
</style>
