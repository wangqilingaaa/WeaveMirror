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

function normalizeWorld(rawWorld: RawWorld): World {
  const settings = parseWorldSettings(rawWorld.settings)

  return {
    id: Number(rawWorld.id ?? 0),
    user_id: Number(rawWorld.user_id ?? 0),
    name: rawWorld.name ?? '',
    slug: rawWorld.slug ?? '',
    description: rawWorld.description ?? settings.description ?? '',
    epoch: rawWorld.epoch ?? settings.epoch ?? '',
    current_year: rawWorld.current_year ?? settings.current_year ?? 0,
    core_rules: rawWorld.core_rules ?? settings.core_rules,
    themes: rawWorld.themes ?? settings.themes,
    tags: rawWorld.tags ?? settings.tags,
    magic_system: rawWorld.magic_system ?? settings.magic_system,
    tech_level: rawWorld.tech_level ?? settings.tech_level,
    economy_type: rawWorld.economy_type ?? settings.economy_type,
    government: rawWorld.government ?? settings.government,
    religion: rawWorld.religion ?? settings.religion,
    regions: rawWorld.regions ?? settings.regions,
    factions: rawWorld.factions ?? settings.factions,
    major_cities: rawWorld.major_cities ?? settings.major_cities,
    races: rawWorld.races ?? settings.races,
    metadata: rawWorld.metadata ?? settings.metadata,
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
