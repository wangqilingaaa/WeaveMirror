import client, { extractData } from './client'
import type {
  ApiResponse,
  CreateCharacterReq,
  UpdateCharacterReq,
  Character,
  CharacterListData,
  ChangeStateReq,
  DeleteResp
} from '@/types'

// ==================== 角色 CRUD ====================

/**
 * 创建角色
 * POST /api/v1/characters
 */
export function createCharacterApi(params: CreateCharacterReq): Promise<Character> {
  return client.post<ApiResponse<Character>>('/api/v1/characters', params).then(extractData)
}

/**
 * 获取角色列表
 * GET /api/v1/characters?world_id={world_id}
 */
export function listCharactersApi(params: { world_id: number; page?: number; limit?: number }): Promise<CharacterListData> {
  return client.get<ApiResponse<CharacterListData>>('/api/v1/characters', { params }).then(extractData)
}

/**
 * 获取角色详情
 * GET /api/v1/characters/{character_id}
 */
export function getCharacterApi(characterId: number): Promise<Character> {
  return client.get<ApiResponse<Character>>(`/api/v1/characters/${characterId}`).then(extractData)
}

/**
 * 更新角色
 * PUT /api/v1/characters/{character_id}
 */
export function updateCharacterApi(characterId: number, params: UpdateCharacterReq): Promise<Character> {
  return client.put<ApiResponse<Character>>(`/api/v1/characters/${characterId}`, params).then(extractData)
}

/**
 * 删除角色
 * DELETE /api/v1/characters/{character_id}
 */
export function deleteCharacterApi(characterId: number): Promise<DeleteResp> {
  return client.delete<ApiResponse<DeleteResp>>(`/api/v1/characters/${characterId}`).then(extractData)
}

// ==================== 角色状态 ====================

/**
 * 变更角色状态
 * PUT /api/v1/characters/{character_id}/state
 */
export function changeCharacterStateApi(characterId: number, params: ChangeStateReq): Promise<Character> {
  return client.put<ApiResponse<Character>>(`/api/v1/characters/${characterId}/state`, params).then(extractData)
}
