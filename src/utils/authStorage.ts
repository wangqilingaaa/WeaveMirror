import type { ThemeMode, UserInfo } from '@/types'
import { STORAGE_KEYS } from '@/constants/storage'

/**
 * 读取当前登录 token。
 * 统一从这里取值后，调用方就不需要再关心本地存储键名细节。
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.TOKEN)
}

/**
 * 读取本地缓存的用户信息。
 * 这里显式包裹 JSON.parse，是为了把“脏数据”隔离在边界层，避免上层页面直接崩溃。
 */
export function getStoredUser(): UserInfo | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER)
    return stored ? JSON.parse(stored) as UserInfo : null
  } catch {
    return null
  }
}

/**
 * 读取主题模式。
 * 如果本地没有值，统一回退到传入的默认值，避免各组件自行决定默认策略。
 */
export function getStoredThemeMode(fallback: ThemeMode = 'dark'): ThemeMode {
  const themeMode = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode | null
  return themeMode || fallback
}

/**
 * 持久化认证信息。
 * 登录、注册成功后都通过这里写入，保证 token 和 user 始终成对更新。
 */
export function saveAuthSession(token: string, user: UserInfo) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token)
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
}

/**
 * 清理认证信息。
 * 请求层 401、主动退出登录、鉴权失效场景统一复用，避免不同入口出现清理不完整的问题。
 */
export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
}

/**
 * 持久化主题模式。
 */
export function saveThemeMode(mode: ThemeMode) {
  localStorage.setItem(STORAGE_KEYS.THEME, mode)
}
