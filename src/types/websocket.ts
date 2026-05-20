// ==================== WebSocket 消息类型 ====================

/** 客户端 WebSocket 消息 */
export interface WSClientMessage {
  type: 'turn_submit' | 'ping'
  data: {
    character_id: number
    content: string
  }
}

/**
 * 单条关系变化记录。
 * 目前服务端只返回角色 ID、变化值和关系类型，因此前端展示时也基于这三个字段做文本描述。
 */
export interface RippleDelta {
  character_id: number
  delta: number
  rel_type: string
}

/**
 * AI 对一次回合提交给出的结构化结果。
 * `narrative` 是主剧情文本，另外两个数组分别用于展示建议动作与关系波动。
 */
export interface GameResponse {
  narrative: string
  suggestions: string[]
  ripple_delta: RippleDelta[]
}

/** 服务端 WebSocket 消息 */
export interface WSServerMessage {
  type:
    | 'narrative_stream'
    | 'narrative_complete'
    | 'narrative_error'
    | 'world_time_update'
    | 'background_event'
    | 'ripple_brief'
  content?: string
  entry_id?: string
  full_text?: string
  summary?: string
  rumor_text?: string
  timestamp?: string
  /**
   * 兼容后端两种返回方式：
   * 1. 结构化结果直接放在消息顶层；
   * 2. 结构化结果包在 `data` 字段中。
   */
  narrative?: string
  suggestions?: string[]
  ripple_delta?: RippleDelta[]
  /**
   * 文档里 `narrative_complete` 使用的是 `ripple_preview`，
   * 实际结构未完全固定，因此先按宽松对象数组接收，再在展示层做格式化。
   */
  ripple_preview?: Array<Record<string, unknown>>
  data?: GameResponse | Record<string, unknown>
}
