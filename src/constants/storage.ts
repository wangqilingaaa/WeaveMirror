/**
 * 项目统一使用的本地存储键名。
 *
 * 设计原因：
 * 1. 之前同一个 key 在 router、store、API client、WebSocket 里被重复硬编码，后续一旦改名极易漏改。
 * 2. 把 key 收口到常量模块后，可以明确“哪些值允许持久化到本地”，减少隐式耦合。
 * 3. 路由守卫、状态管理、请求层现在都复用这里，避免再次出现多套认证状态源。
 */
export const STORAGE_KEYS = {
  TOKEN: 'weavemirror_token',
  USER: 'weavemirror_user',
  THEME: 'weavemirror_theme'
} as const
