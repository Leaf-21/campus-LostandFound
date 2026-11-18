import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** default：带导航页脚；blank：登录/注册/404 无导航页面 */
    layout?: 'default' | 'blank'
    requiresAuth?: boolean
    title?: string
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { title: '首页' } },
  { path: '/posts', name: 'posts', component: () => import('@/views/PostsView.vue'), meta: { title: '信息广场' } },
  { path: '/posts/:id/edit', name: 'post-edit', component: () => import('@/views/PostFormView.vue'), meta: { requiresAuth: true, title: '编辑信息' } },
  { path: '/posts/:id', name: 'post-detail', component: () => import('@/views/PostDetailView.vue'), props: true, meta: { title: '信息详情' } },
  { path: '/publish', name: 'publish', component: () => import('@/views/PostFormView.vue'), meta: { requiresAuth: true, title: '发布信息' } },
  { path: '/me', name: 'me', component: () => import('@/views/MeView.vue'), meta: { requiresAuth: true, title: '个人中心' } },
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { layout: 'blank', title: '登录' } },
  { path: '/register', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { layout: 'blank', title: '注册' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { layout: 'blank', title: '页面不存在' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

/** 路由守卫：需要登录的页面跳转登录，并携带回跳地址 */
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if ((to.path === '/login' || to.path === '/register') && auth.isLoggedIn) {
    return { path: '/' }
  }
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} · 校园失物招领` : '校园失物招领'
})

export default router
