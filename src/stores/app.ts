import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, ThemeMode, LoginParams, RegisterParams } from '@/types'
import { loginApi, registerApi } from '@/api'

/** 本地存储键名 */
const STORAGE_KEYS = {
  TOKEN: 'weavemirror_token',
  USER: 'weavemirror_user',
  THEME: 'weavemirror_theme'
} as const

export const useAppStore = defineStore('app', () => {
  // ==================== 主题状态 ====================
  const themeMode = ref<ThemeMode>((localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode) || 'dark')

  /** 是否为深色主题 */
  const isDark = computed(() => {
    if (themeMode.value === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return themeMode.value === 'dark'
  })

  function setThemeMode(mode: ThemeMode) {
    themeMode.value = mode
    localStorage.setItem(STORAGE_KEYS.THEME, mode)
  }

  // ==================== 加载状态 ====================
  const isGlobalLoading = ref(false)

  function setGlobalLoading(loading: boolean) {
    isGlobalLoading.value = loading
  }

  // ==================== 错误状态 ====================
  const globalError = ref<Error | null>(null)

  function setGlobalError(error: Error | null) {
    globalError.value = error
  }

  // ==================== 用户认证状态 ====================
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

  /** 是否已登录 */
  const isLoggedIn = computed(() => !!token.value && !!currentUser.value)

  /** 登录：调用 API /api/v1/auth/login，保存 token 和用户信息 */
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

  /** 注册：调用 API /api/v1/auth/register，保存 token 和用户信息 */
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
    themeMode,
    isDark,
    setThemeMode,
    isGlobalLoading,
    setGlobalLoading,
    globalError,
    setGlobalError,
    token,
    currentUser,
    isLoggedIn,
    login,
    register,
    logout
  }
})
