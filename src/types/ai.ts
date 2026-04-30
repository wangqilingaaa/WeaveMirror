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
