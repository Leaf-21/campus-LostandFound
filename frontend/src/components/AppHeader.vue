<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ChevronDown, HeartHandshake, LogOut, Menu, Plus, User } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { avatarText } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const drawerOpen = ref(false)

const navItems = [
  { path: '/', label: '首页', match: (p: string) => p === '/' },
  { path: '/posts', label: '信息广场', match: (p: string) => p.startsWith('/posts') },
  { path: '/publish', label: '发布信息', match: (p: string) => p.startsWith('/publish') },
  { path: '/me', label: '个人中心', match: (p: string) => p === '/me' }
]

function isActive(match: (p: string) => boolean): boolean {
  return match(route.path)
}

function go(path: string) {
  drawerOpen.value = false
  router.push(path)
}

function handleCommand(command: string) {
  if (command === 'logout') {
    auth.logout()
    ElMessage.success('已退出登录')
    router.push('/')
    return
  }
  go(command === 'me' ? '/me' : '/publish')
}
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <router-link class="brand" to="/">
        <span class="brand-logo"><HeartHandshake :size="26" /></span>
        <span class="brand-name">校园失物招领</span>
      </router-link>

      <nav class="header-nav" aria-label="主导航">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ 'is-active': isActive(item.match) }"
        >
          {{ item.label }}
        </router-link>
      </nav>

      <div class="header-actions">
        <template v-if="auth.isLoggedIn">
          <el-dropdown trigger="click" @command="handleCommand">
            <button class="user-trigger" type="button">
              <el-avatar :size="34" :src="auth.user?.avatarUrl ?? undefined">
                {{ avatarText(auth.user?.nickname) }}
              </el-avatar>
              <span class="user-name">{{ auth.user?.nickname }}</span>
              <ChevronDown :size="15" class="user-caret" />
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="me">
                  <User :size="14" class="dropdown-icon" />个人中心
                </el-dropdown-item>
                <el-dropdown-item command="publish">
                  <Plus :size="14" class="dropdown-icon" />发布信息
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <LogOut :size="14" class="dropdown-icon" />退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <router-link class="login-link" to="/login">登录</router-link>
          <router-link to="/register">
            <el-button type="primary" round>注册</el-button>
          </router-link>
        </template>
        <button class="menu-btn" type="button" aria-label="打开菜单" @click="drawerOpen = true">
          <Menu :size="22" />
        </button>
      </div>
    </div>

    <el-drawer v-model="drawerOpen" direction="rtl" size="264px" :with-header="false">
      <div class="drawer-body">
        <div class="drawer-brand">
          <HeartHandshake :size="22" />
          <span>校园失物招领</span>
        </div>
        <button
          v-for="item in navItems"
          :key="item.path"
          type="button"
          class="drawer-link"
          :class="{ 'is-active': isActive(item.match) }"
          @click="go(item.path)"
        >
          {{ item.label }}
        </button>
        <div class="drawer-footer">
          <template v-if="auth.isLoggedIn">
            <p class="drawer-user">
              {{ auth.user?.nickname }}（{{ auth.user?.account }}）
            </p>
            <el-button type="danger" plain round @click="handleCommand('logout')">
              <LogOut :size="15" />退出登录
            </el-button>
          </template>
          <template v-else>
            <el-button type="primary" round @click="go('/login')">登录</el-button>
            <el-button round @click="go('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </el-drawer>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
}

.header-inner {
  max-width: var(--content-max-width);
  height: var(--header-height);
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 28px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--color-text);
  flex-shrink: 0;

  &:hover {
    color: var(--color-text);
  }
}

.brand-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  color: #fff;
  background: var(--color-primary);
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.nav-link {
  position: relative;
  padding: 8px 14px;
  border-radius: var(--radius-control);
  color: var(--color-text-secondary);
  font-size: 15px;
  transition: color 0.2s ease, background 0.2s ease;

  &:hover {
    color: var(--color-primary);
    background: var(--color-primary-light);
  }

  &.is-active {
    color: var(--color-primary);
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      left: 14px;
      right: 14px;
      bottom: 2px;
      height: 2px;
      border-radius: 2px;
      background: var(--color-primary);
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.login-link {
  color: var(--color-text);
  font-size: 15px;

  &:hover {
    color: var(--color-primary);
  }
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  color: var(--color-text);
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: var(--color-primary-light);
    border-color: var(--color-border);
  }
}

.user-name {
  font-size: 14px;
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-caret {
  color: var(--color-text-secondary);
}

.dropdown-icon {
  margin-right: 6px;
  vertical-align: -2px;
  color: var(--color-text-secondary);
}

.menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;

  &:hover {
    background: var(--color-primary-light);
  }
}

.drawer-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 8px;
}

.drawer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 18px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 10px;
}

.drawer-link {
  display: block;
  width: 100%;
  padding: 13px 14px;
  text-align: left;
  border: none;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--color-text);
  font-size: 15px;
  cursor: pointer;

  &:hover {
    background: var(--color-primary-light);
    color: var(--color-primary);
  }

  &.is-active {
    background: var(--color-primary-light);
    color: var(--color-primary);
    font-weight: 600;
  }
}

.drawer-footer {
  margin-top: auto;
  padding: 14px 12px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drawer-user {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

@media (max-width: 860px) {
  .header-nav {
    display: none;
  }

  .menu-btn {
    display: inline-flex;
  }

  .user-name {
    display: none;
  }
}

@media (max-width: 480px) {
  .header-inner {
    padding: 0 14px;
    gap: 12px;
  }

  .brand-name {
    font-size: 16px;
  }

  .login-link {
    display: none;
  }
}
</style>
