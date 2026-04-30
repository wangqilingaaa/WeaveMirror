// ==================== 通用类型 ====================

/** 统一 API 响应包装 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/** 分页参数 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/** 分页响应 */
export interface PaginatedData<T> {
  total: number
  page: number
  limit: number
  [items: string]: T[] | number
}

/** 应用主题模式 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** 用户角色 */
export type UserRole = 'player' | 'admin'

/** 通用删除操作响应 */
export interface DeleteResp {
  message: string
}
