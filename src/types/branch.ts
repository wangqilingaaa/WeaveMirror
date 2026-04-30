// ==================== 世界线分支模块 ====================

/** 创建分支请求 */
export interface CreateBranchReq {
  parent_id?: number
  choice_desc: string
}

/** 切换分支请求 */
export interface SwitchBranchReq {
  branch_id: number
}

/** 故事分支 */
export interface StoryBranch {
  id: number
  world_id: number
  parent_id: number | null
  choice_desc: string
  snapshot_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/** 分支树节点 */
export interface BranchNode {
  branch: StoryBranch
  children: BranchNode[]
}

/** 分支树响应 */
export interface BranchTreeData {
  roots: BranchNode[]
}

/** 切换分支响应 */
export interface SwitchBranchResp {
  active_timeline_id: number
}
