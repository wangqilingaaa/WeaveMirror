// ==================== 年鉴事件模块 ====================

/** 世界观事件 */
export interface WorldEvent {
  id: number
  world_id: number
  epoch: string
  description: string
  related_chars?: string
  event_type: string
  created_at: string
  updated_at: string
}

/** 年鉴事件列表响应 */
export interface YearbookData {
  events: WorldEvent[]
  total: number
  page: number
  limit: number
}
