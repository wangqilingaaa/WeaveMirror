import client, { extractData } from './client'
import type { ApiResponse, LoginParams, RegisterParams, AuthResp } from '@/types'

/**
 * 用户登录
 * POST /api/v1/auth/login
 */
export function loginApi(params: LoginParams): Promise<AuthResp> {
  return client.post<ApiResponse<AuthResp>>('/api/v1/auth/login', params).then(extractData)
}

/**
 * 用户注册
 * POST /api/v1/auth/register
 */
export function registerApi(params: RegisterParams): Promise<AuthResp> {
  return client.post<ApiResponse<AuthResp>>('/api/v1/auth/register', params).then(extractData)
}
