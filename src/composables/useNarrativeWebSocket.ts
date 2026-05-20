import { computed, onBeforeUnmount, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { WSClientMessage, WSServerMessage } from '@/types'

export type NarrativeSocketState = 'disconnected' | 'connecting' | 'connected' | 'error'

interface UseNarrativeWebSocketOptions {
  worldId: Ref<number> | ComputedRef<number>
  onServerMessage: (message: WSServerMessage) => void
  onSocketClosed?: () => void
}

/**
 * 负责叙事舞台的 WebSocket 生命周期管理。
 * 这个组合式函数只处理“如何连、如何发、如何收、如何保活”，
 * 不直接参与聊天消息列表的渲染和拼装。
 */
export function useNarrativeWebSocket(options: UseNarrativeWebSocketOptions) {
  const connectionState = ref<NarrativeSocketState>('disconnected')
  const errorMessage = ref('')

  let narrativeSocket: WebSocket | null = null
  let pingTimer: number | null = null

  const connectionLabel = computed(() => {
    switch (connectionState.value) {
      case 'connecting':
        return 'WS 连接中'
      case 'connected':
        return 'WS 已连接'
      case 'error':
        return 'WS 异常'
      default:
        return 'WS 未连接'
    }
  })

  function clearPingTimer() {
    if (pingTimer !== null) {
      window.clearInterval(pingTimer)
      pingTimer = null
    }
  }

  function resolveWebSocketUrl() {
    const token = localStorage.getItem('weavemirror_token')
    if (!token) {
      throw new Error('缺少登录 token，无法建立 WebSocket 连接。')
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/api/v1/worlds/${options.worldId.value}/narrative?token=${encodeURIComponent(token)}`
  }

  function disconnect() {
    clearPingTimer()
    if (narrativeSocket) {
      narrativeSocket.close()
      narrativeSocket = null
    }
  }

  function connect() {
    if (!Number.isInteger(options.worldId.value) || options.worldId.value <= 0) {
      connectionState.value = 'error'
      errorMessage.value = '世界 ID 无效，无法建立 WebSocket 连接。'
      return
    }

    disconnect()
    connectionState.value = 'connecting'
    errorMessage.value = ''

    try {
      narrativeSocket = new WebSocket(resolveWebSocketUrl())
    } catch (error: any) {
      connectionState.value = 'error'
      errorMessage.value = error?.message || 'WebSocket 初始化失败。'
      return
    }

    narrativeSocket.onopen = () => {
      connectionState.value = 'connected'
      clearPingTimer()
      pingTimer = window.setInterval(() => {
        if (narrativeSocket?.readyState === WebSocket.OPEN) {
          const pingPayload: WSClientMessage = {
            type: 'ping',
            data: {
              character_id: 0,
              content: ''
            }
          }
          narrativeSocket.send(JSON.stringify(pingPayload))
        }
      }, 25000)
    }

    narrativeSocket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as WSServerMessage
        options.onServerMessage(payload)
      } catch {
        connectionState.value = 'error'
        errorMessage.value = '收到无法解析的 WebSocket 消息。'
      }
    }

    narrativeSocket.onerror = () => {
      connectionState.value = 'error'
      errorMessage.value = 'WebSocket 连接发生错误。'
    }

    narrativeSocket.onclose = () => {
      clearPingTimer()
      if (connectionState.value !== 'error') {
        connectionState.value = 'disconnected'
      }
      options.onSocketClosed?.()
    }
  }

  function sendTurnSubmit(characterId: number, content: string) {
    if (!narrativeSocket || narrativeSocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket 未连接，无法发送消息。')
    }

    const payload: WSClientMessage = {
      type: 'turn_submit',
      data: {
        character_id: characterId,
        content
      }
    }

    narrativeSocket.send(JSON.stringify(payload))
  }

  onBeforeUnmount(() => {
    disconnect()
  })

  return {
    connectionState,
    connectionLabel,
    errorMessage,
    connect,
    disconnect,
    sendTurnSubmit
  }
}
