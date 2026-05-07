import client, { extractData } from './client'
import type {
  ApiResponse,
  CreateWorldReq,
  UpdateWorldReq,
  World,
  WorldSettings,
  WorldListData,
  AdvanceTimeReq,
  WorldTimeUpdate,
  CreateBranchReq,
  StoryBranch,
  SwitchBranchReq,
  BranchTreeData,
  YearbookData,
  AIEnhanceSettingsReq,
  AIEnhanceSettingsResp
} from '@/types'

// ==================== 世界观 CRUD ====================

/**
 * 后端当前存在两种世界观数据形态：
 * 1. 新结构：description / epoch / current_year 等字段直接平铺在顶层；
 * 2. 旧结构：详细设定放在 settings JSON 字符串里，顶层只保留少量基础字段。
 *
 * 为了避免页面层同时兼容两种结构，这里在 API 层统一把返回值标准化成扁平 World。
 */
type RawWorld = Partial<World> & {
  settings?: string | WorldSettings | null
}

function parseWorldSettings(settings?: string | WorldSettings | null): WorldSettings {
  if (!settings) return {}

  if (typeof settings === 'object') {
    return settings
  }

  try {
    const parsed = JSON.parse(settings)
    return parsed && typeof parsed === 'object' ? parsed as WorldSettings : {}
  } catch {
    return {}
  }
}

/**
 * 旧版世界观接口经常会返回“顶层字段存在，但值为空”的情况：
 * 例如 `description: ""`、`current_year: 0`、`themes: []`，
 * 而真实内容其实仍保存在 `settings` JSON 里。
 *
 * 这里不能直接用 `??`，因为空字符串、空数组、0 都会被视为“已定义”，
 * 从而把 settings 中真正的值挡住，最终导致编辑页无法正确回填原始数据。
 */
function pickString(rawValue: string | undefined, settingsValue: string | undefined, fallback = ''): string {
  if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
    return rawValue
  }
  if (typeof settingsValue === 'string' && settingsValue.trim().length > 0) {
    return settingsValue
  }
  return fallback
}

function pickNumber(rawValue: number | undefined, settingsValue: number | undefined, fallback = 0): number {
  if (typeof rawValue === 'number' && Number.isFinite(rawValue) && rawValue !== 0) {
    return rawValue
  }
  if (typeof settingsValue === 'number' && Number.isFinite(settingsValue)) {
    return settingsValue
  }
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return rawValue
  }
  return fallback
}

function pickArray<T>(rawValue: T[] | undefined, settingsValue: T[] | undefined): T[] | undefined {
  if (Array.isArray(rawValue) && rawValue.length > 0) {
    return rawValue
  }
  if (Array.isArray(settingsValue) && settingsValue.length > 0) {
    return settingsValue
  }
  if (Array.isArray(rawValue)) {
    return rawValue
  }
  return settingsValue
}

function pickObject<T extends Record<string, any> | undefined>(rawValue: T, settingsValue: T): T {
  if (rawValue && typeof rawValue === 'object' && Object.keys(rawValue).length > 0) {
    return rawValue
  }
  if (settingsValue && typeof settingsValue === 'object' && Object.keys(settingsValue).length > 0) {
    return settingsValue
  }
  return rawValue ?? settingsValue
}

function normalizeWorld(rawWorld: RawWorld): World {
  const settings = parseWorldSettings(rawWorld.settings)

  return {
    id: Number(rawWorld.id ?? 0),
    user_id: Number(rawWorld.user_id ?? 0),
    name: rawWorld.name ?? '',
    slug: rawWorld.slug ?? '',
    description: pickString(rawWorld.description, settings.description),
    epoch: pickString(rawWorld.epoch, settings.epoch),
    current_year: pickNumber(rawWorld.current_year, settings.current_year),
    core_rules: pickArray(rawWorld.core_rules, settings.core_rules),
    themes: pickArray(rawWorld.themes, settings.themes),
    tags: pickArray(rawWorld.tags, settings.tags),
    magic_system: rawWorld.magic_system ?? settings.magic_system,
    tech_level: rawWorld.tech_level ?? settings.tech_level,
    economy_type: rawWorld.economy_type ?? settings.economy_type,
    government: pickString(rawWorld.government, settings.government),
    religion: pickString(rawWorld.religion, settings.religion),
    regions: pickArray(rawWorld.regions, settings.regions),
    factions: pickArray(rawWorld.factions, settings.factions),
    major_cities: pickArray(rawWorld.major_cities, settings.major_cities),
    races: pickArray(rawWorld.races, settings.races),
    metadata: pickObject(rawWorld.metadata, settings.metadata),
    active_timeline_id: rawWorld.active_timeline_id ?? null,
    nsfw_enabled: rawWorld.nsfw_enabled ?? settings.nsfw_enabled ?? false,
    evolution_enabled: rawWorld.evolution_enabled ?? settings.evolution_enabled ?? false,
    created_at: rawWorld.created_at ?? '',
    updated_at: rawWorld.updated_at ?? '',
    // 保留原始 settings，便于后续如果某些页面需要回看原始载荷时继续使用。
    settings: rawWorld.settings ?? settings
  } as World
}

function normalizeWorldList(data: { worlds?: RawWorld[]; total: number; page: number; limit: number }): WorldListData {
  return {
    ...data,
    worlds: (data.worlds ?? []).map(normalizeWorld)
  }
}

function buildWorldPayload(params: CreateWorldReq | UpdateWorldReq): Record<string, unknown> {
  return {
    ...params
  }
}

/**
 * 创建世界观
 * POST /api/v1/worlds
 */
export function createWorldApi(params: CreateWorldReq): Promise<World> {
  return client
    .post<ApiResponse<{ world: RawWorld }>>('/api/v1/worlds', buildWorldPayload(params))
    .then(extractData)
    .then((data) => normalizeWorld(data.world))
}

/**
 * 获取世界观列表
 * GET /api/v1/worlds
 */
export function listWorldsApi(params?: { page?: number; limit?: number }): Promise<WorldListData> {
  return client
    .get<ApiResponse<{ worlds?: RawWorld[]; total: number; page: number; limit: number }>>('/api/v1/worlds', { params })
    .then(extractData)
    .then(normalizeWorldList)
}

/**
 * 获取世界观详情
 * GET /api/v1/worlds/{world_id}
 */
export function getWorldApi(worldId: number): Promise<World> {
  return client
    .get<ApiResponse<RawWorld>>(`/api/v1/worlds/${worldId}`)
    .then(extractData)
    .then(normalizeWorld)
}

/**
 * 更新世界观
 * PUT /api/v1/worlds/{world_id}
 */
export function updateWorldApi(worldId: number, params: UpdateWorldReq): Promise<World> {
  return client
    .put<ApiResponse<RawWorld>>(`/api/v1/worlds/${worldId}`, buildWorldPayload(params))
    .then(extractData)
    .then(normalizeWorld)
}

// ==================== 时间推进 ====================

/**
 * 推进世界时间
 * POST /api/v1/worlds/{world_id}/time/advance
 */
export function advanceTimeApi(worldId: number, params: AdvanceTimeReq): Promise<WorldTimeUpdate> {
  return client.post<ApiResponse<WorldTimeUpdate>>(`/api/v1/worlds/${worldId}/time/advance`, params).then(extractData)
}

// ==================== 世界线分支 ====================

/**
 * 创建世界线分支
 * POST /api/v1/worlds/{world_id}/timeline/branch
 */
export function createBranchApi(worldId: number, params: CreateBranchReq): Promise<StoryBranch> {
  return client.post<ApiResponse<StoryBranch>>(`/api/v1/worlds/${worldId}/timeline/branch`, params).then(extractData)
}

/**
 * 获取世界线分支树
 * GET /api/v1/worlds/{world_id}/timelines
 */
export function getBranchTreeApi(worldId: number): Promise<BranchTreeData> {
  return client.get<ApiResponse<BranchTreeData>>(`/api/v1/worlds/${worldId}/timelines`).then(extractData)
}

/**
 * 切换活跃时间线
 * PUT /api/v1/worlds/{world_id}/active-timeline
 */
export function switchActiveTimelineApi(worldId: number, params: SwitchBranchReq): Promise<null> {
  return client.put<ApiResponse<null>>(`/api/v1/worlds/${worldId}/active-timeline`, params).then(extractData)
}

// ==================== 年鉴事件 ====================

/**
 * 获取世界年鉴事件
 * GET /api/v1/worlds/{world_id}/yearbook
 */
export function getYearbookApi(worldId: number): Promise<YearbookData> {
  return client.get<ApiResponse<YearbookData>>(`/api/v1/worlds/${worldId}/yearbook`).then(extractData)
}

// ==================== AI 增强 ====================

/**
 * AI 优化世界观设定
 * POST /ai/enhance-world-settings
 */
export function enhanceWorldSettingsApi(params: AIEnhanceSettingsReq): Promise<AIEnhanceSettingsResp> {
  return client.post<ApiResponse<AIEnhanceSettingsResp>>('/api/v1/ai/enhance-world-settings', params).then(extractData)
}
