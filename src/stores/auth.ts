import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LoginParams, RegisterParams, UserInfo } from '@/types'
import { loginApi, registerApi } from '@/api'

/** 本地存储键名 */
const STORAGE_KEYS = {
  TOKEN: 'weavemirror_token',
  USER: 'weavemirror_user'
} as const

export const useAuthStore = defineStore('auth', () => {
  // ==================== 状态 ====================
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEYS.TOKEN))
  const currentUser = ref<UserInfo | null>(_loadStoredUser())

  /** 从本地存储加载用户信息 */
  function _loadStoredUser(): UserInfo | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  // ==================== 计算属性 ====================

  /** 是否已登录 */
  const isLoggedIn = computed(() => !!token.value && !!currentUser.value)

  // ==================== 方法 ====================

  /** 登录 */
  async function login(params: LoginParams): Promise<UserInfo> {
    const data = await loginApi(params)

    const user: UserInfo = {
      id: data.user_id,
      username: params.username,
      email: '',
      role: 'player',
      createdAt: new Date().toISOString()
    }

    _saveAuth(data.token, user)
    return user
  }

  /** 注册 */
  async function register(params: RegisterParams): Promise<UserInfo> {
    const data = await registerApi(params)

    const user: UserInfo = {
      id: data.user_id,
      username: params.username,
      email: params.email,
      role: 'player',
      createdAt: new Date().toISOString()
    }

    _saveAuth(data.token, user)
    return user
  }

  /** 退出登录 */
  function logout() {
    token.value = null
    currentUser.value = null
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
  }

  /** 保存认证信息到本地 */
  function _saveAuth(newToken: string, user: UserInfo) {
    token.value = newToken
    currentUser.value = user
    localStorage.setItem(STORAGE_KEYS.TOKEN, newToken)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  }

  return {
    token,
    currentUser,
    isLoggedIn,
    login,
    register,
    logout
  }
})
