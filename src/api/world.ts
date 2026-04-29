import client, { extractData } from './client'
import type {
  ApiResponse,
  CreateWorldReq,
  UpdateWorldReq,
  World,
  WorldListData,
  AdvanceTimeReq,
  WorldTimeUpdate,
  CreateBranchReq,
  SwitchBranchReq,
  BranchTreeData,
  SwitchBranchResp,
  YearbookData
} from '@/types'

// ==================== 世界观 CRUD ====================

/**
 * 创建世界观
 * POST /api/v1/worlds
 */
export function createWorldApi(params: CreateWorldReq): Promise<World> {
  return client.post<ApiResponse<World>>('/api/v1/worlds', params).then(extractData)
}

/**
 * 获取世界观列表
 * GET /api/v1/worlds
 */
export function listWorldsApi(params?: { page?: number; limit?: number }): Promise<WorldListData> {
  return client.get<ApiResponse<WorldListData>>('/api/v1/worlds', { params }).then(extractData)
}

/**
 * 获取世界观详情
 * GET /api/v1/worlds/{world_id}
 */
export function getWorldApi(worldId: number): Promise<World> {
  return client.get<ApiResponse<World>>(`/api/v1/worlds/${worldId}`).then(extractData)
}

/**
 * 更新世界观
 * PUT /api/v1/worlds/{world_id}
 */
export function updateWorldApi(worldId: number, params: UpdateWorldReq): Promise<World> {
  return client.put<ApiResponse<World>>(`/api/v1/worlds/${worldId}`, params).then(extractData)
}

// ==================== 时间推进 ====================

/**
 * 推进世界时间
 * POST /api/v1/worlds/{world_id}/advance
 */
export function advanceTimeApi(worldId: number, params: AdvanceTimeReq): Promise<WorldTimeUpdate> {
  return client.post<ApiResponse<WorldTimeUpdate>>(`/api/v1/worlds/${worldId}/advance`, params).then(extractData)
}

// ==================== 世界线分支 ====================

/**
 * 创建世界线分支
 * POST /api/v1/worlds/{world_id}/branches
 */
export function createBranchApi(worldId: number, params: CreateBranchReq): Promise<World> {
  return client.post<ApiResponse<World>>(`/api/v1/worlds/${worldId}/branches`, params).then(extractData)
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
 * POST /api/v1/worlds/{world_id}/timelines/switch
 */
export function switchActiveTimelineApi(worldId: number, params: SwitchBranchReq): Promise<SwitchBranchResp> {
  return client.post<ApiResponse<SwitchBranchResp>>(`/api/v1/worlds/${worldId}/timelines/switch`, params).then(extractData)
}

// ==================== 年鉴事件 ====================

/**
 * 获取世界年鉴事件
 * GET /api/v1/worlds/{world_id}/yearbook
 */
export function getYearbookApi(worldId: number, params?: { page?: number; limit?: number }): Promise<YearbookData> {
  return client.get<ApiResponse<YearbookData>>(`/api/v1/worlds/${worldId}/yearbook`, { params }).then(extractData)
}
