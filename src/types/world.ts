// ==================== 世界观模块 ====================

/** 世界地区 */
export interface Region {
  name: string
  description?: string
  climate?: string
  notable_places?: string[]
}

/** 魔法体系强度 */
export type MagicType = 'none' | 'low' | 'high' | 'unique'

/** 科技水平 */
export type TechLevel =
  | 'stone_age'
  | 'medieval'
  | 'renaissance'
  | 'industrial'
  | 'modern'
  | 'future'
  | 'scifi'

/** 经济形态 */
export type EconomyType = 'barter' | 'currency' | 'resource' | 'post_scarcity'

/** 世界设定草稿，用于创建、编辑、AI 优化等场景 */
export interface WorldSettings {
  description?: string
  epoch?: string
  current_year?: number
  core_rules?: string[]
  themes?: string[]
  tags?: string[]
  magic_system?: MagicType
  tech_level?: TechLevel
  economy_type?: EconomyType
  government?: string
  religion?: string
  regions?: Region[]
  factions?: string[]
  major_cities?: string[]
  races?: string[]
  nsfw_enabled?: boolean
  evolution_enabled?: boolean
  metadata?: Record<string, any>
}

/** 创建世界观请求 */
export interface CreateWorldReq {
  name: string
  settings?: WorldSettings
}

/** 更新世界观请求 */
export interface UpdateWorldReq {
  name?: string
  settings?: WorldSettings
}

/** 世界观 */
export interface World {
  id: number
  user_id: number
  name: string
  slug: string
  description: string
  epoch: string
  current_year: number
  core_rules?: string[]
  themes?: string[]
  tags?: string[]
  magic_system?: MagicType
  tech_level?: TechLevel
  economy_type?: EconomyType
  government?: string
  religion?: string
  regions?: Region[]
  factions?: string[]
  major_cities?: string[]
  races?: string[]
  metadata?: Record<string, any>
  active_timeline_id?: number | null
  nsfw_enabled: boolean
  evolution_enabled: boolean
  created_at: string
  updated_at: string
}

/** 世界观列表响应 */
export interface WorldListData {
  worlds: World[]
  total: number
  page: number
  limit: number
}

/** 时间推进请求 */
export interface AdvanceTimeReq {
  years: number
}

/** 时间推进结果 */
export interface WorldTimeUpdate {
  world_id: number
  new_epoch: string
  new_year: number
  years_advanced: number
  aged_char_count: number
  death_names: string[]
  stage_change_count: number
  event_count: number
}
