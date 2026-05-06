import type { CreateCharacterReq } from './character'
import type { WorldSettings } from './world'

// ==================== AI 增强模块 ====================

/** AI 增强世界观设定请求 */
export interface AIEnhanceSettingsReq {
  world_name: string
  settings: WorldSettings
}

/** AI 增强世界观设定响应 */
export interface AIEnhanceSettingsResp {
  original_settings: WorldSettings
  enhanced_settings: WorldSettings
}

// ==================== 角色生成模块 ====================

/** AI 生成角色请求 */
export interface AIGenerateCharacterReq extends CreateCharacterReq {

}

/** AI 生成角色响应 */
export interface AIGenerateCharacterResp {
  original_character: CreateCharacterReq
  enhanced_character: CreateCharacterReq
}
