import client, { extractData } from './client'
import type {
  ApiResponse,
  CreateCharacterReq,
  UpdateCharacterReq,
  Character,
  CharacterListData,
  ChangeStateReq,
  DeleteResp,
  AIGenerateCharacterReq,
  AIGenerateCharacterResp
} from '@/types'

// ==================== 角色 CRUD ====================

/**
 * 统一构造角色模块的请求路径。
 * 后端接口已经改为把 world_id 放在 URL 路径中，这里集中处理可以避免每个方法手写模板字符串时漏传。
 */
function buildCharacterUrl(worldId: number, suffix = ''): string {
  return `/api/v1/worlds/${worldId}/characters${suffix}`
}

/**
 * 创建角色
 * POST /api/v1/worlds/:world_id/characters
 */
export function createCharacterApi(worldId: number, params: CreateCharacterReq): Promise<Character> {
  return client.post<ApiResponse<Character>>(buildCharacterUrl(worldId), params).then(extractData)
}

/**
 * 获取角色列表
 * GET /api/v1/worlds/:world_id/characters
 */
export function listCharactersApi(params: { world_id: number; page?: number; limit?: number }): Promise<CharacterListData> {
  const { world_id, ...query } = params
  return client.get<ApiResponse<CharacterListData>>(buildCharacterUrl(world_id), { params: query }).then(extractData)
}

/**
 * 获取角色详情
 * GET /api/v1/worlds/:world_id/characters/{character_id}
 */
export function getCharacterApi(worldId: number, characterId: number): Promise<Character> {
  return client.get<ApiResponse<Character>>(buildCharacterUrl(worldId, `/${characterId}`)).then(extractData)
}

/**
 * 更新角色
 * PUT /api/v1/worlds/:world_id/characters/{character_id}
 */
export function updateCharacterApi(worldId: number, characterId: number, params: UpdateCharacterReq): Promise<Character> {
  return client.put<ApiResponse<Character>>(buildCharacterUrl(worldId, `/${characterId}`), params).then(extractData)
}

/**
 * 删除角色
 * DELETE /api/v1/worlds/:world_id/characters/{character_id}
 */
export function deleteCharacterApi(worldId: number, characterId: number): Promise<DeleteResp> {
  return client.delete<ApiResponse<DeleteResp>>(buildCharacterUrl(worldId, `/${characterId}`)).then(extractData)
}

// ==================== 角色状态 ====================

/**
 * 变更角色状态
 * PUT /api/v1/worlds/:world_id/characters/{character_id}/state
 */
export function changeCharacterStateApi(worldId: number, characterId: number, params: ChangeStateReq): Promise<Character> {
  return client.put<ApiResponse<Character>>(buildCharacterUrl(worldId, `/${characterId}/state`), params).then(extractData)
}


/**
 * AI 生成角色
 * POST /api/v1/characters/ai-generate
 */
export function generateCharacterApi(params: AIGenerateCharacterReq): Promise<AIGenerateCharacterResp> {
  return client.post<ApiResponse<AIGenerateCharacterResp>>('/api/v1/characters/ai-generate', params).then(extractData)
}
