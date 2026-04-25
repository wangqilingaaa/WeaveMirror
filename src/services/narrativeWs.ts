export type WsMessageHandler = (type: string, payload: any) => void

export class NarrativeSocket {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private messageHandlers: Set<WsMessageHandler> = new Set()

  constructor(worldId: string) {
    // 假设后端 WebSocket 路径格式，可根据实际情况调整
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    this.url = `${protocol}//${host}/ws/narrative/${worldId}`
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('[NarrativeSocket] Connected successfully to', this.url)
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.notifyHandlers(data.type, data.payload)
        } catch (e) {
          console.error('[NarrativeSocket] Failed to parse message', event.data)
        }
      }

      this.ws.onclose = () => {
        console.log('[NarrativeSocket] Connection closed')
        this.handleReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('[NarrativeSocket] Error occurred:', error)
      }
    } catch (e) {
      console.error('[NarrativeSocket] Failed to create WebSocket:', e)
      this.handleReconnect()
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`[NarrativeSocket] Reconnecting... Attempt ${this.reconnectAttempts}`)
      setTimeout(() => {
        this.connect()
      }, this.reconnectInterval)
    } else {
      console.error('[NarrativeSocket] Max reconnect attempts reached. Could not connect.')
    }
  }

  send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload })
      this.ws.send(message)
    } else {
      console.error('[NarrativeSocket] Cannot send message: WebSocket is not open')
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  onMessage(handler: WsMessageHandler) {
    this.messageHandlers.add(handler)
    return () => {
      this.messageHandlers.delete(handler)
    }
  }

  private notifyHandlers(type: string, payload: any) {
    this.messageHandlers.forEach(handler => handler(type, payload))
  }
}
