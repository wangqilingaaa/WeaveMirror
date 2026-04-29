import type { MessageApi } from 'naive-ui'

/** 扩展全局 Window 接口，添加 Naive UI 的消息 API */
declare global {
  interface Window {
    $message: MessageApi
  }
}

export {}
