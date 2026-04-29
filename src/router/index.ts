import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '@/stores/app'
import type { RouteRecordRaw } from 'vue-router'

/** 路由配置表 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '织世镜 · 首页', requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '织世镜 · 登录', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '织世镜 · 注册', requiresAuth: false }
  },
  {
    /** 未匹配路由重定向到首页 */
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/** 路由守卫：未登录用户重定向到登录页 */
router.beforeEach((to, _from, next) => {
  const appStore = useAppStore()

  // 更新页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // 需要登录但未登录时，重定向到登录页
  if (to.meta.requiresAuth && !appStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // 已登录用户访问登录/注册页时，重定向到首页
  if (!to.meta.requiresAuth && appStore.isLoggedIn && (to.name === 'Login' || to.name === 'Register')) {
    next({ name: 'Home' })
    return
  }

  next()
})

export default router
