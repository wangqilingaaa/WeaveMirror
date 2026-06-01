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
import { createCachedRequest } from './requestCache'

const cachedListChatSessionsRequest = createCachedRequest(
  (params?: ListChatSessionsParams) => {
    return client.get<ApiResponse<ChatSessionListData>>('/api/v1/chat/sessions', { params }).then(extractData)
  },
  {
    getKey: (params) => `chat-sessions:${JSON.stringify(params ?? {})}`,
    ttlMs: 3000
  }
)

const cachedListChatSessionMessagesRequest = createCachedRequest(
  (sessionId: number, params?: ListChatMessagesParams) => {
    return client
      .get<ApiResponse<ChatMessageListData>>(`/api/v1/chat/sessions/${sessionId}/messages`, { params })
      .then(extractData)
  },
  {
    getKey: (sessionId, params) => `chat-session-messages:${sessionId}:${JSON.stringify(params ?? {})}`,
    ttlMs: 3000
  }
)

/**
 * 创建聊天会话。
 * 舞台页会在“新建会话”或“当前没有可用会话但准备发送消息”时调用这里。
 */
export function createChatSessionApi(params: CreateChatSessionReq = {}): Promise<{ session: ChatSession }> {
  return client.post<ApiResponse<{ session: ChatSession }>>('/api/v1/chat/sessions', params).then(extractData).then((data) => {
    /**
     * 创建会话会直接影响列表数据，因此这里立即清空相关缓存，避免舞台页创建成功后仍读到旧列表。
     */
    cachedListChatSessionsRequest.invalidate()
    return data
  })
}

/**
 * 获取当前用户的会话列表。
 * 由于后端当前未提供按世界过滤的查询参数，页面层会在拿到结果后按 world_id 再做一次筛选。
 */
export function listChatSessionsApi(params?: ListChatSessionsParams): Promise<ChatSessionListData> {
  return cachedListChatSessionsRequest(params)
}

/**
 * 获取某个会话的历史消息列表。
 * 返回顺序已经由后端按 `sequence_no ASC` 排好，页面层不需要再次排序。
 */
export function listChatSessionMessagesApi(
  sessionId: number,
  params?: ListChatMessagesParams
): Promise<ChatMessageListData> {
  return cachedListChatSessionMessagesRequest(sessionId, params)
}

export function invalidateChatSessionCache(sessionId?: number) {
  cachedListChatSessionsRequest.invalidate()
  if (typeof sessionId === 'number' && sessionId > 0) {
    cachedListChatSessionMessagesRequest.invalidate((key) => key.startsWith(`chat-session-messages:${sessionId}:`))
    return
  }
  cachedListChatSessionMessagesRequest.invalidate()
}
