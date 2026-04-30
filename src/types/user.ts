import type { UserRole } from './common'

// ==================== 用户模块 ====================

/** 用户信息（本地扩展，API /api/v1/me 仅返回 user_id） */
export interface UserInfo {
  id: number
  username: string
  email: string
  role: UserRole
  createdAt: string
}

/** 当前用户 API 响应 */
export interface CurrentUserResp {
  user_id: number
}
