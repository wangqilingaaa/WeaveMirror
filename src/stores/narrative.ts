import { defineStore } from 'pinia'
import { ref } from 'vue'
import { NarrativeSocket } from '../services/narrativeWs'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'narrator' | 'system'
  content: string
  narratorText?: string // 旁白文本（环境描写、微表情等）
  options?: string[] // 后端返回的建议选项
}

export interface RippleBrief {
  title?: string
  content: string
  type?: 'info' | 'success' | 'warning' | 'error'
}

export const useNarrativeStore = defineStore('narrative', () => {
  const messages = ref<Message[]>([])
  const isConnected = ref(false)
  const isTyping = ref(false)
  const currentRippleBrief = ref<RippleBrief | null>(null)
  let socket: NarrativeSocket | null = null
  let currentStreamingMessage: Message | null = null

  const connect = (worldId: string) => {
    // 建立新连接前清理旧连接
    disconnect()

    socket = new NarrativeSocket(worldId)

    socket.onMessage((type, payload) => {
      handleIncomingMessage(type, payload)
    })

    socket.connect()
    isConnected.value = true // 简化处理，实际上应通过 ws 的 onopen 事件来标记
  }

  const handleIncomingMessage = (type: string, payload: any) => {
    if (type === 'narrative_stream') {
      isTyping.value = true
      if (!currentStreamingMessage) {
        currentStreamingMessage = {
          id: 'msg_' + Date.now(),
          role: 'assistant',
          content: payload.text || '',
          narratorText: payload.narratorText || ''
        }
        messages.value.push(currentStreamingMessage)
      } else {
        currentStreamingMessage.content += payload.text || ''
        currentStreamingMessage.narratorText += payload.narratorText || ''
      }
    } else if (type === 'narrative_complete') {
      if (currentStreamingMessage) {
        currentStreamingMessage.content = payload.fullText || currentStreamingMessage.content
        currentStreamingMessage.narratorText = payload.narratorText || currentStreamingMessage.narratorText
        currentStreamingMessage.options = payload.options || []
        currentStreamingMessage = null
      } else {
        // 如果没有 streaming 的前置状态，直接整段添加
        messages.value.push({
          id: 'msg_' + Date.now(),
          role: 'assistant',
          content: payload.fullText || '',
          narratorText: payload.narratorText || '',
          options: payload.options || []
        })
      }
      isTyping.value = false
    } else if (type === 'error') {
      console.error('[NarrativeStore] Received error message:', payload)
      isTyping.value = false
    } else if (type === 'ripple_brief') {
      currentRippleBrief.value = {
        title: payload.title || '涟漪影响',
        content: payload.content || '你的选择对世界产生了一些未知的涟漪...',
        type: payload.type || 'info'
      }
    } else if (type === 'background_event') {
      messages.value.push({
        id: 'msg_sys_' + Date.now(),
        role: 'system',
        content: payload.content || '世界传闻：某个角落发生了未知事件。'
      })
    }
  }

  const clearRippleBrief = () => {
    currentRippleBrief.value = null
  }

  const sendTurn = (content: string) => {
    if (!content.trim()) return

    // 先把用户的输入添加到本地消息列表
    messages.value.push({
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content
    })

    if (socket) {
      socket.send('turn_submit', { content })
    } else {
      console.warn('[NarrativeStore] WebSocket is not connected. Message not sent.')
      // 模拟后端返回（便于前端验收）
      setTimeout(() => {
        handleIncomingMessage('ripple_brief', {
          title: '涟漪效应发生',
          content: `由于你刚才说了 "${content.substring(0, 5)}..."，某个隐藏角色的态度转为冷漠，世界线悄然发生偏转。`,
          type: 'warning'
        })
        
        // 模拟触发后台传闻事件
        setTimeout(() => {
          handleIncomingMessage('background_event', {
            content: `传闻：就在刚才，有人目击到亚瑟和梅林在密林深处进行了一场秘密会面...`
          })
        }, 1000)
        
      }, 1500)
    }
  }

  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
    isConnected.value = false
    currentStreamingMessage = null
    isTyping.value = false
  }

  const clearMessages = () => {
    messages.value = []
  }

  return {
    messages,
    isConnected,
    isTyping,
    currentRippleBrief,
    connect,
    sendTurn,
    disconnect,
    clearMessages,
    clearRippleBrief
  }
})
