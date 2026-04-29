import client, { extractData } from './client'
import type {
  ApiResponse,
  CreateRelationshipReq,
  UpdateRelationshipReq,
  Relationship,
  RelationshipListData,
  RelationMapData,
  DeleteResp
} from '@/types'

// ==================== 关系 CRUD ====================

/**
 * 创建关系
 * POST /api/v1/relationships
 */
export function createRelationshipApi(params: CreateRelationshipReq): Promise<Relationship> {
  return client.post<ApiResponse<Relationship>>('/api/v1/relationships', params).then(extractData)
}

/**
 * 获取角色关系列表
 * GET /api/v1/relationships/{character_id}
 */
export function getCharacterRelationsApi(characterId: number, type?: string): Promise<RelationshipListData> {
  const params = type ? { type } : undefined
  return client.get<ApiResponse<RelationshipListData>>(`/api/v1/relationships/${characterId}`, { params }).then(extractData)
}

/**
 * 更新关系
 * PUT /api/v1/relationships/{rel_id}
 */
export function updateRelationshipApi(relId: number, params: UpdateRelationshipReq): Promise<Relationship> {
  return client.put<ApiResponse<Relationship>>(`/api/v1/relationships/${relId}`, params).then(extractData)
}

/**
 * 删除关系
 * DELETE /api/v1/relationships/{rel_id}
 */
export function deleteRelationshipApi(relId: number): Promise<DeleteResp> {
  return client.delete<ApiResponse<DeleteResp>>(`/api/v1/relationships/${relId}`).then(extractData)
}

// ==================== 关系图谱 ====================

/**
 * 获取关系图谱
 * GET /api/v1/relationships/{world_id}/map
 */
export function getRelationMapApi(worldId: number): Promise<RelationMapData> {
  return client.get<ApiResponse<RelationMapData>>(`/api/v1/relationships/${worldId}/map`).then(extractData)
}
