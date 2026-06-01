import { createRouter, createWebHistory } from 'vue-router'
import { getStoredToken } from '@/utils/authStorage'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { guest: true }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/Register.vue'),
      meta: { guest: true }
    },
    {
      path: '/',
      redirect: '/workshop'
    },
    {
      path: '/workshop',
      name: 'Workshop',
      component: () => import('@/views/CreationWorkshop.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/worlds/new',
      name: 'WorldCreate',
      component: () => import('@/views/WorldEditorPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/worlds/:worldId',
      name: 'WorldDetail',
      component: () => import('@/views/WorldDetail.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/worlds/:worldId/edit',
      name: 'WorldEdit',
      component: () => import('@/views/WorldEditorPage.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/worlds/:worldId/characters/new',
      name: 'CharacterCreate',
      component: () => import('@/views/CharacterEditorPage.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/worlds/:worldId/characters/:characterId/edit',
      name: 'CharacterEdit',
      component: () => import('@/views/CharacterEditorPage.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/stage/:worldId',
      name: 'Stage',
      component: () => import('@/views/NarrativeStage.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/worldbook/:worldId',
      name: 'WorldBook',
      component: () => import('@/views/WorldDetail.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/worlds/:worldId/storyline/:characterId',
      alias: '/storyline/:characterId',
      name: 'Storyline',
      component: () => import('@/views/PersonalEpic.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/console/:worldId',
      name: 'Console',
      component: () => import('@/views/SystemConsole.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/workshop'
    }
  ]
})

router.beforeEach((to, _from, next) => {
  /**
   * 路由守卫只依赖认证边界工具，而不直接触碰 localStorage。
   * 这样后续如果 token 改成 cookie、sessionStorage 或统一会话管理，这里不需要再做二次改造。
   */
  const token = getStoredToken()
  const isLoggedIn = !!token

  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
  } else if (to.meta.guest && isLoggedIn) {
    next('/workshop')
  } else {
    next()
  }
})

export default router
