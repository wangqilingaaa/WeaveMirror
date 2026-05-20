import type { GameResponse, RippleDelta, WSServerMessage } from '@/types'

export interface NarrativeSocketMessageContext {
  worldName: string
  activeCharacterName?: string
  characterNameMap?: Record<number, string>
}

type NarrativeDisplayMessage = {
  type: 'narration'
  title: string
  subtitle: string
  content: string
}

export type NarrativeSocketUiAction =
  | {
      kind: 'stream_append'
      chunk: string
      entryId?: string
      title: string
      subtitle: string
    }
  | {
      kind: 'stream_complete'
      fullText: string
      entryId?: string
    }
  | {
      kind: 'append_message'
      message: NarrativeDisplayMessage
    }
  | {
      kind: 'append_messages'
      messages: NarrativeDisplayMessage[]
      finishStreaming: boolean
    }
  | {
      kind: 'error'
      content: string
    }
  | {
      kind: 'ignore'
    }

function isRippleDelta(value: unknown): value is RippleDelta {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<RippleDelta>
  return (
    typeof candidate.character_id === 'number'
    && typeof candidate.delta === 'number'
    && typeof candidate.rel_type === 'string'
  )
}

function normalizeStructuredNarrative(candidate: unknown): GameResponse | null {
  if (!candidate || typeof candidate !== 'object') {
    return null
  }

  const narrative = 'narrative' in candidate ? candidate.narrative : undefined
  const suggestions = 'suggestions' in candidate ? candidate.suggestions : undefined
  const rippleDelta = 'ripple_delta' in candidate ? candidate.ripple_delta : undefined

  if (typeof narrative !== 'string') {
    return null
  }

  return {
    narrative,
    suggestions: Array.isArray(suggestions) ? suggestions.filter((item): item is string => typeof item === 'string') : [],
    ripple_delta: Array.isArray(rippleDelta) ? rippleDelta.filter(isRippleDelta) : []
  }
}

function parseStructuredContent(content?: string): GameResponse | null {
  if (!content) {
    return null
  }

  try {
    const parsed = JSON.parse(content) as unknown
    return normalizeStructuredNarrative(parsed)
  } catch {
    return null
  }
}

function parseJsonValue(content?: string): unknown | null {
  if (!content) {
    return null
  }

  try {
    return JSON.parse(content) as unknown
  } catch {
    return null
  }
}

function isSerializedJson(content?: string) {
  const parsed = parseJsonValue(content)
  return parsed !== null && typeof parsed === 'object'
}

function formatLooseObject(item: Record<string, unknown>) {
  const fragments = Object.entries(item)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`)

  return fragments.length ? fragments.join(' · ') : '已发生关系变化'
}

function resolveCharacterLabel(characterId: number, context: NarrativeSocketMessageContext) {
  const resolvedName = context.characterNameMap?.[characterId]
  return resolvedName ? `角色「${resolvedName}」` : `角色 ID ${characterId}`
}

function formatRipplePreview(previewItems: Array<Record<string, unknown>>, context: NarrativeSocketMessageContext) {
  return previewItems
    .map((item, index) => {
      const characterLabel =
        typeof item.character_id === 'number'
          ? resolveCharacterLabel(item.character_id, context)
          : `关系项 ${index + 1}`
      const relType = typeof item.rel_type === 'string' ? item.rel_type : '关系变化'
      const delta =
        typeof item.delta === 'number'
          ? `${item.delta > 0 ? '+' : ''}${item.delta}`
          : typeof item.change === 'number'
            ? `${item.change > 0 ? '+' : ''}${item.change}`
            : null

      return delta ? `${characterLabel} · ${relType} ${delta}` : `${characterLabel} · ${formatLooseObject(item)}`
    })
    .join('\n')
}

function extractStructuredNarrative(payload: WSServerMessage): GameResponse | null {
  const candidate =
    payload.data && typeof payload.data === 'object'
      ? payload.data
      : {
          narrative: payload.narrative,
          suggestions: payload.suggestions,
          ripple_delta: payload.ripple_delta
        }

  return normalizeStructuredNarrative(candidate) || parseStructuredContent(payload.content)
}

function formatSuggestions(suggestions: string[]) {
  return suggestions.map((item, index) => `${index + 1}. ${item}`).join('\n')
}

function formatRippleDelta(deltas: RippleDelta[], context: NarrativeSocketMessageContext) {
  return deltas
    .map((item) => {
      const sign = item.delta > 0 ? '+' : ''
      return `${resolveCharacterLabel(item.character_id, context)} · ${item.rel_type} ${sign}${item.delta}`
    })
    .join('\n')
}

function buildStructuredMessagesAction(
  narrative: string,
  context: NarrativeSocketMessageContext,
  suggestions: string[] = [],
  rippleDelta: RippleDelta[] = [],
  ripplePreview: Array<Record<string, unknown>> = []
): NarrativeSocketUiAction {
  const messages: NarrativeDisplayMessage[] = [
    {
      type: 'narration',
      title: context.activeCharacterName || context.worldName,
      subtitle: 'AI 剧情回复',
      content: narrative
    }
  ]

  if (suggestions.length) {
    messages.push({
      type: 'narration',
      title: '行动建议',
      subtitle: 'AI 推荐的后续选择',
      content: formatSuggestions(suggestions)
    })
  }

  if (rippleDelta.length) {
    messages.push({
      type: 'narration',
      title: '关系变化',
      subtitle: '本回合触发的涟漪波动',
      content: formatRippleDelta(rippleDelta, context)
    })
  } else if (ripplePreview.length) {
    messages.push({
      type: 'narration',
      title: '关系变化',
      subtitle: '本回合触发的涟漪波动',
      content: formatRipplePreview(ripplePreview, context)
    })
  }

  return {
    kind: 'append_messages',
    messages,
    finishStreaming: true
  }
}

/**
 * 把 WebSocket 服务端消息映射成前端 UI 能直接理解的动作。
 * 页面层只需要消费这些动作，不再直接判断具体协议字段。
 */
export function mapNarrativeSocketMessage(
  payload: WSServerMessage,
  context: NarrativeSocketMessageContext
): NarrativeSocketUiAction {
  if (payload.type === 'narrative_stream') {
    const structuredNarrative = extractStructuredNarrative(payload)
    if (structuredNarrative) {
      return buildStructuredMessagesAction(
        structuredNarrative.narrative,
        context,
        structuredNarrative.suggestions,
        structuredNarrative.ripple_delta
      )
    }

    /**
     * 如果服务端误把完整 JSON 串塞进了 stream 事件，但字段又不满足当前结构化协议，
     * 前端宁可先忽略这段原始串，也不要把整段 JSON 直接渲染到聊天气泡中。
     */
    if (isSerializedJson(payload.content)) {
      return {
        kind: 'ignore'
      }
    }

    return {
      kind: 'stream_append',
      chunk: payload.content || '',
      entryId: payload.entry_id,
      title: context.activeCharacterName || context.worldName,
      subtitle: 'AI 剧情生成中'
    }
  }

  if (payload.type === 'narrative_complete') {
    const structuredNarrative =
      extractStructuredNarrative(payload)
      || parseStructuredContent(payload.full_text)
      || parseStructuredContent(payload.content)

    if (structuredNarrative) {
      return buildStructuredMessagesAction(
        structuredNarrative.narrative,
        context,
        structuredNarrative.suggestions,
        structuredNarrative.ripple_delta
      )
    }

    if (Array.isArray(payload.suggestions) || Array.isArray(payload.ripple_preview)) {
      return buildStructuredMessagesAction(
        payload.full_text || payload.content || '',
        context,
        Array.isArray(payload.suggestions)
          ? payload.suggestions.filter((item): item is string => typeof item === 'string')
          : [],
        [],
        Array.isArray(payload.ripple_preview) ? payload.ripple_preview : []
      )
    }

    return {
      kind: 'stream_complete',
      fullText: payload.full_text || payload.content || '',
      entryId: payload.entry_id
    }
  }

  if (payload.type === 'narrative_error') {
    return {
      kind: 'error',
      content: payload.content || 'AI 回复失败'
    }
  }

  if (payload.type === 'world_time_update') {
    return {
      kind: 'append_message',
      message: {
        type: 'narration',
        title: '世界时间更新',
        subtitle: '系统事件',
        content: payload.content || '世界时间发生了变化。'
      }
    }
  }

  if (payload.type === 'background_event') {
    return {
      kind: 'append_message',
      message: {
        type: 'narration',
        title: '背景事件',
        subtitle: '系统推送',
        content: payload.summary || payload.content || '发生了一条新的背景事件。'
      }
    }
  }

  if (payload.type === 'ripple_brief') {
    return {
      kind: 'append_message',
      message: {
        type: 'narration',
        title: '涟漪简报',
        subtitle: '系统推送',
        content: payload.rumor_text || payload.content || '世界状态出现新的连锁变化。'
      }
    }
  }

  return {
    kind: 'ignore'
  }
}
