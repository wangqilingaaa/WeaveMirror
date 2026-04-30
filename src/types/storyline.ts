// ==================== 故事线模块 ====================

/** 故事线条目 */
export interface StorylineEntry {
  id: string
  timestamp: string
  location?: string
  summary: string
  tags?: string[]
  emotion_tag?: string
  is_core_memory: boolean
  related_character_ids?: number[]
  created_at: string
}

/** 故事线条目列表响应 */
export interface StorylineData {
  entries: StorylineEntry[]
  total: number
  page: number
  limit: number
}

/** 固定/取消固定请求 */
export interface PinEntryReq {
  is_core_memory: boolean
}

/** 固定操作响应 */
export interface PinEntryResp {
  message: string
}
