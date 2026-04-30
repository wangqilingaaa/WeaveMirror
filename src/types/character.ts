// ==================== 角色模块 ====================

/** 创建角色请求 */
export interface CreateCharacterReq {
  name: string
  name_aliases?: string
  world_id: number
  age?: number
  gender?: string
  species?: string
  body_build?: string
  height?: number
  facial_features?: string
  hair?: string
  eyes?: string
  skin?: string
  distinguishing_marks?: string
  voice?: string
  nsfw_level?: string
  intimate_details?: string
  intimacy_settings?: string
  core_desire?: string
  personality_traits?: string
  emotional_state?: string
  fears?: string
  moral_compass?: string
  base_attributes: string
  skills?: string
  scars_conditions?: string
  appearance?: string
  backstory?: string
  current_location?: string
  birth_epoch?: string
  death_epoch?: string
  metadata?: string
}

/** 更新角色请求（所有字段可选） */
export interface UpdateCharacterReq {
  name?: string
  name_aliases?: string
  age?: number
  gender?: string
  species?: string
  body_build?: string
  height?: number
  facial_features?: string
  hair?: string
  eyes?: string
  skin?: string
  distinguishing_marks?: string
  voice?: string
  nsfw_level?: string
  intimate_details?: string
  intimacy_settings?: string
  core_desire?: string
  personality_traits?: string
  emotional_state?: string
  fears?: string
  moral_compass?: string
  base_attributes?: string
  skills?: string
  scars_conditions?: string
  appearance?: string
  backstory?: string
  current_location?: string
  metadata?: string
}

/** 角色 */
export interface Character {
  id: number
  world_id: number
  user_id: number
  name: string
  name_aliases?: string
  age: number
  gender?: string
  species?: string
  body_build?: string
  height?: number
  facial_features?: string
  hair?: string
  eyes?: string
  skin?: string
  distinguishing_marks?: string
  voice?: string
  nsfw_level: string
  intimate_details?: string
  intimacy_settings?: string
  core_desire?: string
  personality_traits?: string
  emotional_state?: string
  fears?: string
  moral_compass?: string
  base_attributes?: string
  skills?: string
  scars_conditions?: string
  appearance?: string
  backstory?: string
  current_location?: string
  birth_epoch?: string
  death_epoch?: string
  state: string
  life_stage: string
  birth_year?: number
  death_year?: number | null
  metadata?: string
  created_at: string
  updated_at: string
}

/** 角色列表响应 */
export interface CharacterListData {
  characters: Character[]
  total: number
  page: number
  limit: number
}

/** 变更角色状态请求 */
export interface ChangeStateReq {
  new_state: string
  force?: boolean
}
