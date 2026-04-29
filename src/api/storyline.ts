import client, { extractData } from './client'
import type {
  ApiResponse,
  StorylineData,
  PinEntryReq,
  PinEntryResp,
  DeleteResp
} from '@/types'

/**
 * 获取角色故事线
 * GET /api/v1/storylines/{character_id}
 */
export function getStorylineApi(characterId: number, params?: { page?: number; limit?: number }): Promise<StorylineData> {
  return client.get<ApiResponse<StorylineData>>(`/api/v1/storylines/${characterId}`, { params }).then(extractData)
}

/**
 * 固定/取消固定故事线条目
 * PUT /api/v1/storylines/entries/{entry_id}/pin
 */
export function pinEntryApi(entryId: string, params: PinEntryReq): Promise<PinEntryResp> {
  return client.put<ApiResponse<PinEntryResp>>(`/api/v1/storylines/entries/${entryId}/pin`, params).then(extractData)
}

/**
 * 删除故事线条目
 * DELETE /api/v1/storylines/entries/{entry_id}
 */
export function deleteEntryApi(entryId: string): Promise<DeleteResp> {
  return client.delete<ApiResponse<DeleteResp>>(`/api/v1/storylines/entries/${entryId}`).then(extractData)
}
