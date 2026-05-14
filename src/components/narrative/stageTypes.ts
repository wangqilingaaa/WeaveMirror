export type StageBubbleSender = 'user' | 'system'

export type StageBubbleType = 'dialogue' | 'scene' | 'thought' | 'narration' | 'location'

/**
 * 中间聊天区使用的统一消息结构。
 * 无论消息来自用户输入还是系统剧情推送，都先转换成这个结构，
 * 这样组件层只关心“如何渲染”，不关心原始数据来自哪里。
 */
export interface StageChatMessage {
  id: string
  sender: StageBubbleSender
  type: StageBubbleType
  title: string
  subtitle?: string
  content: string
  timestamp: string
}

/**
 * 左侧世界栏中的可折叠信息模块。
 * 这里只保留真实世界字段对应的文本与列表内容，
 * 避免把并不存在的数据结构继续带到组件层。
 */
export interface StageWorldSection {
  id: string
  title: string
  summary: string
  description?: string
  entries?: string[]
  initiallyExpanded?: boolean
}

/**
 * 右侧角色栏的极简角色卡数据。
 * 这里刻意只保留头像文字、名称、身份标签与交互优先级，
 * 避免角色栏变成“第二个详情页”。
 */
export interface StageCharacterCard {
  id: number
  name: string
  role: string
  avatarText: string
  priority: number
}
