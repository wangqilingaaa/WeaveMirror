import client, { extractData } from './client'
import type { ApiResponse, CurrentUserResp } from '@/types'

/**
 * 获取当前用户信息
 * GET /api/v1/me
 */
export function getCurrentUserIdApi(): Promise<CurrentUserResp> {
  return client.get<ApiResponse<CurrentUserResp>>('/api/v1/me').then(extractData)
}
