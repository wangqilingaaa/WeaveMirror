// ==================== 认证模块 ====================

/** 登录请求参数 */
export interface LoginParams {
  username: string
  password: string
}

/** 注册请求参数 */
export interface RegisterParams {
  username: string
  password: string
  email: string
  birth_date?: string
}

/** 认证接口响应数据 */
export interface AuthResp {
  user_id: number
  token: string
}
