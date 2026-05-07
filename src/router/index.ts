import { createRouter, createWebHistory } from 'vue-router'

/** localStorage 键名常量（与 stores/app.ts 保持一致） */
const STORAGE_KEYS = {
  TOKEN: 'weavemirror_token'
} as const

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
      path: '/storyline/:characterId',
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
  // 直接读 localStorage，避免跨 Pinia store 实例的状态同步问题
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
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
