import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/',
      component: () => import('../layouts/AppLayout.vue'),
      redirect: '/workshop',
      children: [
        {
          path: 'workshop',
          name: 'workshop',
          component: () => import('../views/WorkshopView.vue')
        },
        {
          path: 'stage/:worldId',
          name: 'stage',
          component: () => import('../views/StageView.vue')
        },
        {
          path: 'worldbook/:worldId',
          name: 'worldbook',
          component: () => import('../views/WorldbookView.vue')
        },
        {
          path: 'storyline/:characterId',
          name: 'storyline',
          component: () => import('../views/StorylineView.vue')
        },
        {
          path: 'console/:worldId',
          name: 'console',
          component: () => import('../views/ConsoleView.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  // Exclude login and register from auth check
  const publicPages = ['/login', '/register']
  const authRequired = !publicPages.includes(to.path)

  if (authRequired && !authStore.token) {
    return next('/login')
  }

  next()
})

export default router
