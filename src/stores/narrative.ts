import { defineStore } from 'pinia'
import { ref } from 'vue'
import { NarrativeSocket } from '../services/narrativeWs'
import Mock from 'mockjs'

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

    // 初始化一些默认的假消息，展示不同角色的消息效果
    if (messages.value.length === 0) {
      messages.value = [
        {
          id: 'msg_init_1',
          role: 'system',
          content: '【世界初始化完成】当前接入：' + worldId
        },
        {
          id: 'msg_init_2',
          role: 'narrator',
          content: Mock.Random.cparagraph(1, 2)
        },
        {
          id: 'msg_init_3',
          role: 'assistant',
          content: Mock.mock('@cparagraph(2, 4)'),
          narratorText: 'NPC 的表情微微发生变化，似乎在思考着什么。',
          options: ['询问更多细节', '保持沉默', '试图攻击']
        }
      ]
    }

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

    // 模拟后端处理
    isTyping.value = true
    
    setTimeout(() => {
      // 模拟流式返回
      const fakeResponse = Mock.Random.cparagraph(3, 8)
      const fakeNarrator = Mock.Random.boolean() ? Mock.Random.csentence(5, 15) : undefined
      const fakeOptions = Mock.mock({ 'array|2-4': ['@cword(4, 8)'] }).array
      
      let currentLength = 0
      const streamInterval = setInterval(() => {
        if (currentLength < fakeResponse.length) {
          const chunk = fakeResponse.slice(currentLength, currentLength + 5)
          handleIncomingMessage('narrative_stream', { text: chunk, narratorText: currentLength === 0 ? fakeNarrator : '' })
          currentLength += 5
        } else {
          clearInterval(streamInterval)
          handleIncomingMessage('narrative_complete', {
            fullText: fakeResponse,
            narratorText: fakeNarrator,
            options: fakeOptions
          })
          
          // 模拟触发后台传闻事件和涟漪
          if (Mock.Random.boolean()) {
            setTimeout(() => {
              handleIncomingMessage('ripple_brief', {
                title: Mock.Random.pick(['世界线变动', '好感度变化', '势力警觉']),
                content: Mock.Random.csentence(10, 20),
                type: Mock.Random.pick(['info', 'success', 'warning', 'error'])
              })
            }, 1000)
          }

          if (Mock.Random.boolean()) {
            setTimeout(() => {
              handleIncomingMessage('background_event', {
                content: `传闻：${Mock.Random.csentence(15, 30)}`
              })
            }, 2000)
          }
        }
      }, 100)
    }, 500)
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
