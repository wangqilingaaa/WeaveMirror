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
 * 关系模块统一使用世界维度路径。
 * openapi.yaml 中所有关系接口都要求把 world_id 放进 URL，
 * 这里集中拼接路径，避免页面层重复维护接口地址细节。
 */
function buildRelationshipUrl(worldId: number, suffix = ''): string {
  return `/api/v1/worlds/${worldId}/relationships${suffix}`
}

/**
 * 创建关系
 * POST /api/v1/worlds/{world_id}/relationships
 */
export function createRelationshipApi(worldId: number, params: CreateRelationshipReq): Promise<Relationship> {
  return client.post<ApiResponse<Relationship>>(buildRelationshipUrl(worldId), params).then(extractData)
}

/**
 * 获取角色关系列表
 * GET /api/v1/worlds/{world_id}/relationships?char_id={character_id}
 *
 * 文档中该接口返回的是 Relationship[]，
 * 这里额外归一化成业务层已经在使用的 `{ relationships, total }` 结构，
 * 这样页面只需要消费统一数据模型，而不必关心后端包装差异。
 */
export async function getCharacterRelationsApi(worldId: number, characterId: number): Promise<RelationshipListData> {
  const response = await client.get<ApiResponse<Relationship[]>>(buildRelationshipUrl(worldId), {
    params: { char_id: characterId }
  })
  const relationships = extractData<Relationship[]>(response) ?? []

  return {
    relationships,
    total: relationships.length
  }
}

/**
 * 更新关系
 * PUT /api/v1/worlds/{world_id}/relationships/{rel_id}
 */
export function updateRelationshipApi(worldId: number, relId: number, params: UpdateRelationshipReq): Promise<Relationship> {
  return client.put<ApiResponse<Relationship>>(buildRelationshipUrl(worldId, `/${relId}`), params).then(extractData)
}

/**
 * 删除关系
 * DELETE /api/v1/worlds/{world_id}/relationships/{rel_id}
 */
export function deleteRelationshipApi(worldId: number, relId: number): Promise<DeleteResp> {
  return client.delete<ApiResponse<DeleteResp>>(buildRelationshipUrl(worldId, `/${relId}`)).then(extractData)
}

// ==================== 关系图谱 ====================

/**
 * 获取关系图谱
 * GET /api/v1/worlds/{world_id}/relation-map
 */
export function getRelationMapApi(worldId: number): Promise<RelationMapData> {
  return client.get<ApiResponse<RelationMapData>>(`/api/v1/worlds/${worldId}/relation-map`).then(extractData)
}
