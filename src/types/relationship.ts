// ==================== 关系模块 ====================

/** 创建关系请求 */
export interface CreateRelationshipReq {
  source_id: number
  target_id: number
  rel_type: string
  strength?: number
  is_secret?: boolean
  metadata?: string
}

/** 更新关系请求 */
export interface UpdateRelationshipReq {
  rel_type?: string
  strength?: number
  is_secret?: boolean
  metadata?: string
}

/** 关系 */
export interface Relationship {
  id: number
  world_id: number
  source_id: number
  target_id: number
  rel_type: string
  strength: number
  is_secret: boolean
  metadata?: string
  created_at: string
  updated_at: string
}

/** 角色关系列表响应 */
export interface RelationshipListData {
  relationships: Relationship[]
  total: number
}

/** 关系图谱节点 */
export interface RelationMapNode {
  id: number
  name: string
  state: string
}

/** 关系图谱边 */
export interface RelationMapEdge {
  source_id: number
  target_id: number
  rel_type: string
  strength: number
  is_secret: boolean
}

/** 关系图谱数据 */
export interface RelationMapData {
  nodes: RelationMapNode[]
  edges: RelationMapEdge[]
}
