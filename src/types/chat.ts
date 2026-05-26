// ==================== 聊天模块 ====================

import type { PaginationParams } from './common'

/**
 * 创建聊天会话请求。
 * 这里完全对齐联调文档中的字段定义，便于舞台页和未来的聊天页复用同一套入参。
 */
export interface CreateChatSessionReq {
  world_id?: number
  character_id?: number
  branch_id?: number
  title?: string
  session_type?: string
}

/**
 * 聊天会话。
 * 该结构对应 `/api/v1/chat/sessions` 的单条会话记录。
 */
export interface ChatSession {
  id: number
  user_id: number
  world_id?: number
  character_id?: number
  branch_id?: number
  title: string
  session_type: string
  status: string
  summary?: string
  last_message_at: string
  message_count: number
  input_token_total: number
  output_token_total: number
  created_at: string
  updated_at: string
}

/** 会话列表查询参数 */
export interface ListChatSessionsParams extends PaginationParams {}

/** 会话列表响应 */
export interface ChatSessionListData {
  sessions: ChatSession[]
  total: number
  page: number
  limit: number
}

/**
 * 单条聊天消息。
 * 舞台页会把它转换成 UI 专用的 `StageChatMessage` 再交给聊天面板渲染。
 */
export interface ChatMessage {
  id: number
  session_id: number
  user_id: number
  world_id?: number
  character_id?: number
  branch_id?: number
  sequence_no: number
  role: string
  message_type: string
  status: string
  content: string
  content_format: string
  model_name?: string
  provider?: string
  prompt_tokens: number
  completion_tokens: number
  latency_ms: number
  reply_to_message_id?: number
  error_message?: string
  extra?: Record<string, unknown>
  created_at: string
  updated_at: string
}

/** 会话历史查询参数 */
export interface ListChatMessagesParams extends PaginationParams {}

/** 会话历史响应 */
export interface ChatMessageListData {
  messages: ChatMessage[]
  total: number
  page: number
  limit: number
  session_id: number
}
