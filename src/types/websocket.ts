// ==================== WebSocket 消息类型 ====================

/** 客户端 WebSocket 消息 */
export interface WSClientMessage {
  type: 'turn_submit'
  data: {
    character_id: number
    content: string
  }
}

/** 服务端 WebSocket 消息 */
export interface WSServerMessage {
  type: 'narrative_stream' | 'narrative_complete' | 'narrative_error' | 'world_time_update' | 'background_event'
  content?: string
  entry_id?: string
  data?: object
}
