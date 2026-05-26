import client, { extractData } from './client'
import type { ApiResponse } from '@/types'
import type {
  ChatMessageListData,
  ChatSession,
  ChatSessionListData,
  CreateChatSessionReq,
  ListChatMessagesParams,
  ListChatSessionsParams
} from '@/types/chat'

/**
 * 创建聊天会话。
 * 舞台页会在“新建会话”或“当前没有可用会话但准备发送消息”时调用这里。
 */
export function createChatSessionApi(params: CreateChatSessionReq = {}): Promise<{ session: ChatSession }> {
  return client.post<ApiResponse<{ session: ChatSession }>>('/api/v1/chat/sessions', params).then(extractData)
}

/**
 * 获取当前用户的会话列表。
 * 由于后端当前未提供按世界过滤的查询参数，页面层会在拿到结果后按 world_id 再做一次筛选。
 */
export function listChatSessionsApi(params?: ListChatSessionsParams): Promise<ChatSessionListData> {
  return client.get<ApiResponse<ChatSessionListData>>('/api/v1/chat/sessions', { params }).then(extractData)
}

/**
 * 获取某个会话的历史消息列表。
 * 返回顺序已经由后端按 `sequence_no ASC` 排好，页面层不需要再次排序。
 */
export function listChatSessionMessagesApi(
  sessionId: number,
  params?: ListChatMessagesParams
): Promise<ChatMessageListData> {
  return client.get<ApiResponse<ChatMessageListData>>(`/api/v1/chat/sessions/${sessionId}/messages`, { params }).then(extractData)
}
