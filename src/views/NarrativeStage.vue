<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NSpin, useMessage } from 'naive-ui'
import {
  createChatSessionApi,
  getWorldApi,
  invalidateChatSessionCache,
  listCharactersApi,
  listChatSessionMessagesApi,
  listChatSessionsApi
} from '@/api'
import { useNarrativeWebSocket } from '@/composables'
import type { Character, ChatMessage, ChatSession, World } from '@/types'
import {
  mapNarrativeSocketMessage,
  NarrativeCharacterSidebar,
  NarrativeChatPanel,
  NarrativeSessionSidebar,
  NarrativeWorldSidebar
} from '@/components/narrative'
import type { StageCharacterCard, StageChatMessage, StageSessionCard, StageWorldSection } from '@/components/narrative'

interface StageWorldSnapshot {
  name: string
  description: string
  epoch: string
  currentYear: number | null
  themes: string[]
  tags: string[]
  coreRules: string[]
  factions: string[]
  majorCities: string[]
  regionNames: string[]
  races: string[]
  government: string
  religion: string
  magicSystem: string
  techLevel: string
  economyType: string
  nsfwEnabled: boolean
  evolutionEnabled: boolean
  createdAt: string
  updatedAt: string
}

const route = useRoute()
const router = useRouter()
const message = useMessage()

/**
 * 页面完全基于 worldId 加载真实数据。
 * 当用户切换不同世界时，这个计算值会触发整页重载。
 */
const worldId = computed(() => Number(route.params.worldId))

const pageLoading = ref(true)
const sending = ref(false)
const world = ref<World | null>(null)
const characters = ref<Character[]>([])
const worldError = ref('')
const characterError = ref('')
const sessionError = ref('')
const chatDraft = ref('')
const activeCharacterId = ref<number | null>(null)
const activeSessionId = ref<number | null>(null)
const chatSessions = ref<ChatSession[]>([])
const chatMessages = ref<StageChatMessage[]>([])
const sessionLoading = ref(false)
const sessionCreating = ref(false)
const sessionMessagesLoading = ref(false)
const pendingStreamMessageId = ref<string | null>(null)

/**
 * 左侧世界栏严格限制为 `World` 类型中的真实字段。
 * 当接口失败时，也只回退到中性占位文案，不再补写任何剧情、任务或资源信息。
 */
const fallbackWorldSnapshot = computed<StageWorldSnapshot>(() => ({
  name: `世界 #${worldId.value}`,
  description: '当前世界暂无已加载的描述信息。',
  epoch: '未设置',
  currentYear: null,
  themes: [],
  tags: [],
  coreRules: [],
  factions: [],
  majorCities: [],
  regionNames: [],
  races: [],
  government: '未设置',
  religion: '未设置',
  magicSystem: '未设置',
  techLevel: '未设置',
  economyType: '未设置',
  nsfwEnabled: false,
  evolutionEnabled: false,
  createdAt: '',
  updatedAt: ''
}))

const stageWorld = computed<StageWorldSnapshot>(() => ({
  name: world.value?.name || fallbackWorldSnapshot.value.name,
  description: world.value?.description || fallbackWorldSnapshot.value.description,
  epoch: world.value?.epoch || fallbackWorldSnapshot.value.epoch,
  currentYear:
    typeof world.value?.current_year === 'number'
      ? world.value.current_year
      : fallbackWorldSnapshot.value.currentYear,
  themes: world.value?.themes ?? fallbackWorldSnapshot.value.themes,
  tags: world.value?.tags ?? fallbackWorldSnapshot.value.tags,
  coreRules: world.value?.core_rules ?? fallbackWorldSnapshot.value.coreRules,
  factions: world.value?.factions ?? fallbackWorldSnapshot.value.factions,
  majorCities: world.value?.major_cities ?? fallbackWorldSnapshot.value.majorCities,
  regionNames: (world.value?.regions ?? []).map((item) => item.name).filter(Boolean),
  races: world.value?.races ?? fallbackWorldSnapshot.value.races,
  government: world.value?.government || fallbackWorldSnapshot.value.government,
  religion: world.value?.religion || fallbackWorldSnapshot.value.religion,
  magicSystem: world.value?.magic_system || fallbackWorldSnapshot.value.magicSystem,
  techLevel: world.value?.tech_level || fallbackWorldSnapshot.value.techLevel,
  economyType: world.value?.economy_type || fallbackWorldSnapshot.value.economyType,
  nsfwEnabled: world.value?.nsfw_enabled ?? fallbackWorldSnapshot.value.nsfwEnabled,
  evolutionEnabled: world.value?.evolution_enabled ?? fallbackWorldSnapshot.value.evolutionEnabled,
  createdAt: world.value?.created_at || fallbackWorldSnapshot.value.createdAt,
  updatedAt: world.value?.updated_at || fallbackWorldSnapshot.value.updatedAt
}))

function buildAvatarText(name: string) {
  return name.trim().slice(0, 1) || '角'
}

function formatNow() {
  return dayjs().format('HH:mm:ss')
}

function formatDateTime(value?: string) {
  if (!value) return '未记录'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : value
}

function formatShortDateTime(value?: string) {
  if (!value) return '未活跃'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('MM-DD HH:mm') : value
}

function createChatMessage(payload: Omit<StageChatMessage, 'id' | 'timestamp'>): StageChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: formatNow(),
    ...payload
  }
}

function getCharacterPriority(character: Character) {
  let score = 0
  if (character.state === '活跃') score += 50
  if (character.core_desire) score += 20
  if (character.current_location) score += 10
  if (character.updated_at) score += 5
  return score
}

/**
 * 右侧角色栏也只保留最基础的真实字段。
 * 这样既符合你的要求，也避免继续把额外解释性文案塞进角色列表。
 */
const stageCharacters = computed<StageCharacterCard[]>(() => {
  return characters.value
    .map((character) => ({
      id: character.id,
      name: character.name,
      role: character.species || character.life_stage || '未设定身份',
      avatarText: buildAvatarText(character.name),
      priority: getCharacterPriority(character)
    }))
    .sort((left, right) => right.priority - left.priority)
})

const activeCharacterCard = computed(() => {
  return stageCharacters.value.find((item) => item.id === activeCharacterId.value) ?? stageCharacters.value[0] ?? null
})

/**
 * WebSocket 关系变化只返回 `character_id`，这里预先把当前页面已加载的角色列表整理成查找表，
 * 供消息映射层把 ID 转成更易读的角色名称。
 */
const characterNameMap = computed<Record<number, string>>(() => {
  return stageCharacters.value.reduce<Record<number, string>>((accumulator, character) => {
    accumulator[character.id] = character.name
    return accumulator
  }, {})
})

/**
 * 聊天会话列表接口当前不支持按世界过滤，
 * 因此前端在舞台页只展示“属于当前世界”的会话，避免跨世界数据混入当前舞台。
 */
const currentWorldSessions = computed<ChatSession[]>(() => {
  return chatSessions.value.filter((item) => item.world_id === worldId.value)
})

function formatSessionTypeLabel(sessionType?: string) {
  if (sessionType === 'narrative') return '叙事'
  if (sessionType === 'chat') return '聊天'
  return sessionType || '未分类'
}

function resolveCharacterName(characterId?: number | null) {
  if (!characterId) return '未绑定角色'
  return characterNameMap.value[characterId] || `角色 #${characterId}`
}

const stageSessions = computed<StageSessionCard[]>(() => {
  return currentWorldSessions.value.map((session) => ({
    id: session.id,
    title: session.title || '新的对话',
    sessionTypeLabel: formatSessionTypeLabel(session.session_type),
    characterName: resolveCharacterName(session.character_id),
    lastMessageAtText: `最近活跃：${formatShortDateTime(session.last_message_at)}`,
    messageCountText: `${session.message_count} 条消息`,
    summary:
      session.summary
      || `${resolveCharacterName(session.character_id)} · ${session.message_count > 0 ? '可继续沿用既有上下文' : '新建后尚无历史消息'}`
  }))
})

const worldSidebarSections = computed<StageWorldSection[]>(() => {
  const sections: StageWorldSection[] = [
    {
      id: 'world-basic',
      title: '基础信息',
      summary: `${stageWorld.value.epoch} · ${stageWorld.value.currentYear ?? '未设置年份'}`,
      description: stageWorld.value.description,
      entries: [
        `世界名称：${stageWorld.value.name}`,
        `纪元：${stageWorld.value.epoch || '未设置'}`,
        `当前年份：${stageWorld.value.currentYear ?? '未设置'}`,
        `创建时间：${formatDateTime(stageWorld.value.createdAt)}`,
        `更新时间：${formatDateTime(stageWorld.value.updatedAt)}`
      ],
      initiallyExpanded: true
    },
    {
      id: 'world-structure',
      title: '设定字段',
      summary: '只展示世界模型中的真实字段',
      entries: [
        `魔法体系：${stageWorld.value.magicSystem || '未设置'}`,
        `科技水平：${stageWorld.value.techLevel || '未设置'}`,
        `经济形态：${stageWorld.value.economyType || '未设置'}`,
        `政治制度：${stageWorld.value.government || '未设置'}`,
        `宗教信仰：${stageWorld.value.religion || '未设置'}`,
        `内容模式：${stageWorld.value.nsfwEnabled ? 'NSFW' : 'SFW'}`,
        `演化开关：${stageWorld.value.evolutionEnabled ? '开启' : '关闭'}`
      ],
      initiallyExpanded: true
    }
  ]

  if (stageWorld.value.themes.length || stageWorld.value.tags.length || stageWorld.value.coreRules.length) {
    sections.push({
      id: 'world-rules',
      title: '主题与规则',
      summary: `主题 ${stageWorld.value.themes.length} 项 · 标签 ${stageWorld.value.tags.length} 项`,
      entries: [
        ...stageWorld.value.themes.map((item) => `主题：${item}`),
        ...stageWorld.value.tags.map((item) => `标签：${item}`),
        ...stageWorld.value.coreRules.map((item) => `核心规则：${item}`)
      ],
      initiallyExpanded: true
    })
  }

  if (
    stageWorld.value.factions.length
    || stageWorld.value.majorCities.length
    || stageWorld.value.regionNames.length
    || stageWorld.value.races.length
  ) {
    sections.push({
      id: 'world-entities',
      title: '势力与地理',
      summary: '世界实体字段汇总',
      entries: [
        ...stageWorld.value.factions.map((item) => `势力：${item}`),
        ...stageWorld.value.majorCities.map((item) => `主要城市：${item}`),
        ...stageWorld.value.regionNames.map((item) => `地区：${item}`),
        ...stageWorld.value.races.map((item) => `种族：${item}`)
      ],
      initiallyExpanded: false
    })
  }

  return sections
})

function buildInitialMessages() {
  return [
    createChatMessage({
      sender: 'system',
      type: 'narration',
      title: stageWorld.value.name,
      subtitle: `${stageWorld.value.epoch} · ${stageWorld.value.currentYear ?? '未设置年份'}`,
      content: stageWorld.value.description || '当前世界暂无描述信息，你可以直接输入对白、动作或旁白来推进剧情。'
    }),
    createChatMessage({
      sender: 'system',
      type: 'narration',
      title: '连接说明',
      subtitle: 'AI 通过 WebSocket 回复',
      content: activeCharacterCard.value
        ? `当前已聚焦角色「${activeCharacterCard.value.name}」。你可以在右侧角色栏切换当前角色，后续发送的消息会以该角色为行动主体。`
        : '当前世界还没有可用角色，暂时无法提交回合；请先补充角色数据后再进行对话推进。'
    })
  ]
}

function createSessionNoticeMessage(session: ChatSession): StageChatMessage {
  return createChatMessage({
    sender: 'system',
    type: 'narration',
    title: '当前会话',
    subtitle: session.title || '新的对话',
    content: `当前会话类型为「${formatSessionTypeLabel(session.session_type)}」，默认行动角色为「${resolveCharacterName(session.character_id)}」。`
  })
}

function mapHistoryMessageToStageMessage(historyMessage: ChatMessage): StageChatMessage {
  const isUserMessage = historyMessage.role === 'user'
  const subtitleParts = [resolveCharacterName(historyMessage.character_id)]

  if (!isUserMessage && historyMessage.model_name) {
    subtitleParts.push(historyMessage.model_name)
  }

  return {
    id: `history-${historyMessage.id}`,
    sender: isUserMessage ? 'user' : 'system',
    type: isUserMessage ? 'dialogue' : 'narration',
    title: isUserMessage ? '你' : 'AI 剧情',
    subtitle: subtitleParts.filter(Boolean).join(' · '),
    content: historyMessage.content || '（空消息）',
    timestamp: formatNowFromValue(historyMessage.created_at)
  }
}

function formatNowFromValue(value?: string) {
  if (!value) return formatNow()
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('HH:mm:ss') : formatNow()
}

function syncActiveCharacterFromSession(session: ChatSession | null) {
  const fallbackCharacterId = stageCharacters.value[0]?.id ?? null
  const sessionCharacterId = session?.character_id ?? null
  const hasMatchedCharacter = sessionCharacterId ? !!characterNameMap.value[sessionCharacterId] : false
  activeCharacterId.value = hasMatchedCharacter ? sessionCharacterId : fallbackCharacterId
}

function resetRuntimeState() {
  activeCharacterId.value = stageCharacters.value[0]?.id ?? null
  activeSessionId.value = null
  chatDraft.value = ''
  pendingStreamMessageId.value = null
  chatMessages.value = buildInitialMessages()
}

async function loadChatSessions() {
  if (!Number.isInteger(worldId.value) || worldId.value <= 0) {
    chatSessions.value = []
    sessionError.value = '世界 ID 无效，当前无法加载会话列表。'
    return
  }

  sessionLoading.value = true
  try {
    sessionError.value = ''
    const data = await listChatSessionsApi({ page: 1, limit: 100 })
    chatSessions.value = data.sessions ?? []
  } catch (err: any) {
    chatSessions.value = []
    sessionError.value = err?.message || '加载会话列表失败。'
  } finally {
    sessionLoading.value = false
  }
}

async function loadSessionMessages(sessionId: number) {
  sessionMessagesLoading.value = true
  try {
    const data = await listChatSessionMessagesApi(sessionId, { page: 1, limit: 100 })
    const selectedSession = currentWorldSessions.value.find((item) => item.id === sessionId) ?? null

    activeSessionId.value = sessionId
    syncActiveCharacterFromSession(selectedSession)
    chatMessages.value = [
      buildInitialMessages()[0],
      createSessionNoticeMessage(selectedSession ?? {
        id: sessionId,
        user_id: 0,
        title: '新的对话',
        session_type: 'chat',
        status: 'active',
        last_message_at: '',
        message_count: data.total ?? 0,
        input_token_total: 0,
        output_token_total: 0,
        created_at: '',
        updated_at: ''
      }),
      ...((data.messages ?? []).map(mapHistoryMessageToStageMessage))
    ]
  } catch (err: any) {
    chatMessages.value = buildInitialMessages()
    message.error(err?.message || '加载会话历史失败。')
  } finally {
    sessionMessagesLoading.value = false
  }
}

async function handleSessionSelect(sessionId: number) {
  if (activeSessionId.value === sessionId && !sessionMessagesLoading.value) {
    return
  }
  await loadSessionMessages(sessionId)
}

async function handleCreateSession() {
  try {
    await createStageSession()
  } catch (err: any) {
    message.error(err?.message || '创建会话失败。')
  }
}

async function createStageSession(options?: { silent?: boolean; preferredCharacterId?: number | null }) {
  if (!Number.isInteger(worldId.value) || worldId.value <= 0) {
    throw new Error('世界 ID 无效，无法创建会话。')
  }

  sessionCreating.value = true
  try {
    const selectedCharacterId = options?.preferredCharacterId ?? activeCharacterId.value ?? stageCharacters.value[0]?.id ?? null
    const response = await createChatSessionApi({
      world_id: worldId.value,
      character_id: selectedCharacterId ?? undefined,
      title: selectedCharacterId
        ? `${resolveCharacterName(selectedCharacterId)} 的叙事会话`
        : `${stageWorld.value.name} 的新会话`,
      session_type: 'narrative'
    })

    await loadChatSessions()
    await loadSessionMessages(response.session.id)

    if (!options?.silent) {
      message.success('已创建新的叙事会话。')
    }
    return response.session
  } finally {
    sessionCreating.value = false
  }
}

function appendSystemMessage(payload: Omit<StageChatMessage, 'id' | 'timestamp' | 'sender'>) {
  const messageItem = createChatMessage({
    sender: 'system',
    ...payload
  })
  chatMessages.value.push(messageItem)
  return messageItem
}

function appendSystemMessages(payloads: Array<Omit<StageChatMessage, 'id' | 'timestamp' | 'sender'>>) {
  return payloads.map((item) => appendSystemMessage(item))
}

function ensureStreamingMessage() {
  const currentId = pendingStreamMessageId.value
  if (currentId) {
    return chatMessages.value.find((item) => item.id === currentId) ?? null
  }

  const streamMessage = appendSystemMessage({
    type: 'narration',
    title: activeCharacterCard.value?.name || stageWorld.value.name,
    subtitle: 'AI 剧情生成中',
    content: ''
  })
  pendingStreamMessageId.value = streamMessage.id
  return streamMessage
}

function handleSocketUiAction(payload: Parameters<typeof mapNarrativeSocketMessage>[0]) {
  if (typeof payload.session_id === 'number' && payload.session_id > 0) {
    activeSessionId.value = payload.session_id
  }

  const action = mapNarrativeSocketMessage(payload, {
    worldName: stageWorld.value.name,
    activeCharacterName: activeCharacterCard.value?.name,
    characterNameMap: characterNameMap.value
  })

  if (action.kind === 'stream_append') {
    const targetMessage = ensureStreamingMessage()
    if (targetMessage) {
      targetMessage.title = action.title
      targetMessage.subtitle = action.subtitle
      targetMessage.content += action.chunk
    }
    return
  }

  if (action.kind === 'stream_complete') {
    /**
     * 某些后端实现可能会在结构化结果已经提前落地后，额外再补发一次 complete 事件。
     * 这时如果当前既没有占位中的流消息，也已经不处于发送态，就直接忽略，避免重复追加同一轮回复。
     */
    if (!pendingStreamMessageId.value && !sending.value) {
      return
    }

    const targetMessage = ensureStreamingMessage()
    if (targetMessage) {
      targetMessage.subtitle = 'AI 剧情回复'
      targetMessage.content = action.fullText || targetMessage.content
    }
    pendingStreamMessageId.value = null
    sending.value = false
    invalidateChatSessionCache(activeSessionId.value ?? payload.session_id)
    void loadChatSessions()
    return
  }

  if (action.kind === 'append_message') {
    appendSystemMessage(action.message)
    return
  }

  if (action.kind === 'append_messages') {
    const [firstMessage, ...restMessages] = action.messages
    const targetMessage = pendingStreamMessageId.value
      ? chatMessages.value.find((item) => item.id === pendingStreamMessageId.value) ?? null
      : null

    /**
     * 如果页面上已经存在“AI 剧情生成中”的占位气泡，就直接把首条结构化消息写回去，
     * 这样可以避免同一轮回复出现一条空白占位消息再追加一条正式剧情消息。
     */
    if (targetMessage && firstMessage) {
      targetMessage.type = firstMessage.type
      targetMessage.title = firstMessage.title
      targetMessage.subtitle = firstMessage.subtitle
      targetMessage.content = firstMessage.content
    } else if (firstMessage) {
      appendSystemMessage(firstMessage)
    }

    if (restMessages.length) {
      appendSystemMessages(restMessages)
    }

    if (action.finishStreaming) {
      pendingStreamMessageId.value = null
      sending.value = false
      invalidateChatSessionCache(activeSessionId.value ?? payload.session_id)
      void loadChatSessions()
    }
    return
  }

  if (action.kind === 'error') {
    pendingStreamMessageId.value = null
    sending.value = false
    message.error(action.content)
    appendSystemMessage({
      type: 'narration',
      title: '系统提示',
      subtitle: 'WebSocket 异常',
      content: action.content
    })
  }
}

const {
  connectionState: wsConnectionState,
  connectionLabel: wsConnectionLabel,
  errorMessage: wsErrorMessage,
  connect: connectNarrativeSocket,
  sendTurnSubmit
} = useNarrativeWebSocket({
  worldId,
  onServerMessage(payload) {
    handleSocketUiAction(payload)
  },
  onSocketClosed() {
    if (sending.value) {
      sending.value = false
      message.error('WebSocket 已断开，当前回合未收到 AI 回复。')
    }
  }
})

async function loadWorld() {
  if (!Number.isInteger(worldId.value) || worldId.value <= 0) {
    world.value = null
    worldError.value = '世界 ID 无效，当前仅展示基础占位信息。'
    return
  }

  try {
    worldError.value = ''
    world.value = await getWorldApi(worldId.value)
  } catch (err: any) {
    world.value = null
    worldError.value = err?.message || '加载世界信息失败，当前仅展示基础占位信息。'
  }
}

async function loadCharacters() {
  if (!Number.isInteger(worldId.value) || worldId.value <= 0) {
    characters.value = []
    characterError.value = '世界 ID 无效，当前无法加载角色列表。'
    return
  }

  try {
    characterError.value = ''
    const data = await listCharactersApi({
      world_id: worldId.value,
      page: 1,
      limit: 100
    })
    characters.value = data.characters ?? []
  } catch (err: any) {
    characters.value = []
    characterError.value = err?.message || '加载角色列表失败。'
  }
}

async function refreshStage() {
  pageLoading.value = true
  await Promise.allSettled([loadWorld(), loadCharacters(), loadChatSessions()])
  resetRuntimeState()
  connectNarrativeSocket()

  if (currentWorldSessions.value.length > 0) {
    await loadSessionMessages(currentWorldSessions.value[0].id)
  }
  pageLoading.value = false
}

function goToWorkshop() {
  router.push({ name: 'Workshop' })
}

function goToWorldDetail() {
  router.push({ name: 'WorldDetail', params: { worldId: worldId.value } })
}

/**
 * 切换当前角色只更新舞台页内的“当前行动主体”，
 * 不直接清空既有消息，避免用户在同一舞台中切角色时丢失上下文。
 * 同时补一条系统提示，让聊天记录里明确记录角色焦点的变化。
 */
function handleCharacterSelect(character: StageCharacterCard) {
  if (activeCharacterId.value === character.id) {
    message.info(`当前角色已是「${character.name}」。`)
    return
  }

  activeCharacterId.value = character.id
  appendSystemMessage({
    type: 'narration',
    title: '角色已切换',
    subtitle: '当前行动主体已更新',
    content: `当前角色已切换为「${character.name}」，接下来发送的消息都会以该角色的视角和行动继续推进剧情。`
  })
  message.success(`已切换当前角色：${character.name}`)
}

/**
 * 故事线仍然保留独立入口，但与“切换当前角色”解耦，
 * 避免用户只是想切换操控角色时被强制带离当前舞台。
 */
function goToCharacterStoryline(characterId = activeCharacterId.value) {
  if (!characterId) {
    message.warning('当前没有可查看故事线的角色。')
    return
  }

  router.push({
    name: 'Storyline',
    params: {
      worldId: worldId.value,
      characterId
    }
  })
}

async function handleSendMessage() {
  const normalizedDraft = chatDraft.value.trim()

  if (!normalizedDraft) {
    message.warning('请输入要推进剧情的内容。')
    return
  }

  if (sending.value) {
    message.info('消息正在处理中，请稍候。')
    return
  }

  if (!activeCharacterCard.value) {
    message.warning('当前没有可用角色，无法提交回合。')
    return
  }

  if (wsConnectionState.value !== 'connected') {
    message.error('WebSocket 未连接，无法发送消息。')
    return
  }

  if (sessionMessagesLoading.value) {
    message.info('当前会话历史仍在加载，请稍候。')
    return
  }

  let targetSessionId = activeSessionId.value
  if (!targetSessionId) {
    try {
      const createdSession = await createStageSession({
        silent: true,
        preferredCharacterId: activeCharacterCard.value.id
      })
      targetSessionId = createdSession?.id ?? null
    } catch (error: any) {
      message.error(error?.message || '创建会话失败，无法发送消息。')
      return
    }
  }

  chatMessages.value.push(
    createChatMessage({
      sender: 'user',
      type: 'dialogue',
      title: '你',
      subtitle: activeCharacterCard.value?.name || stageWorld.value.name,
      content: normalizedDraft
    })
  )

  chatDraft.value = ''
  sending.value = true
  pendingStreamMessageId.value = null
  try {
    sendTurnSubmit(activeCharacterCard.value.id, normalizedDraft, targetSessionId ?? undefined)
  } catch (error: any) {
    sending.value = false
    message.error(error?.message || '发送消息失败。')
  }
}

watch(
  () => worldId.value,
  () => {
    void refreshStage()
  },
  { immediate: true }
)
</script>

<template>
  <div class="narrative-stage-page">
    <div v-if="pageLoading" class="page-loading">
      <NSpin size="large" />
    </div>

    <template v-else>
      <header class="stage-page-header">
        <div class="stage-page-header__main">
          <span class="stage-page-header__badge">叙事舞台</span>
          <div class="stage-page-header__context">
            <span class="stage-page-header__world">{{ stageWorld.name }}</span>
            <span class="stage-page-header__separator">/</span>
            <span class="stage-page-header__meta">
              {{ stageWorld.epoch }} · {{ stageWorld.currentYear ?? '未设置年份' }}
            </span>
          </div>
        </div>

        <div class="stage-page-header__actions">
          <NButton secondary @click="goToWorkshop">返回工坊</NButton>
          <NButton secondary @click="goToWorldDetail">世界详情</NButton>
          <NButton secondary :disabled="!activeCharacterCard" @click="goToCharacterStoryline()">
            当前角色故事线
          </NButton>
          <NButton type="primary" @click="refreshStage">刷新舞台</NButton>
        </div>
      </header>

      <div class="stage-layout">
        <div class="stage-column stage-column--left">
          <NarrativeSessionSidebar
            title="会话列表"
            :subtitle="'左侧会话栏基于聊天接口文档接入。你可以创建新会话、切换历史会话，并在当前舞台继续续写。'"
            :sessions="stageSessions"
            :active-session-id="activeSessionId"
            :loading="sessionLoading"
            :creating="sessionCreating"
            :error="sessionError"
            @create="handleCreateSession"
            @select="handleSessionSelect"
          />
        </div>

        <div class="stage-column stage-column--center">
          <NarrativeChatPanel
            v-model:draft="chatDraft"
            :context-tag="`${stageWorld.epoch} · ${stageWorld.currentYear ?? '未设置年份'}`"
            :active-character-name="activeCharacterCard?.name || '未选择角色'"
            :messages="chatMessages"
            :sending="sending"
            :connection-label="wsConnectionLabel"
            @submit="handleSendMessage"
          />
        </div>

        <div class="stage-column stage-column--right stage-column--stack">
          <div class="stage-stack-panel">
            <NarrativeWorldSidebar
              :world-name="stageWorld.name"
              :header-tag="`${stageWorld.epoch} · ${stageWorld.currentYear ?? '未设置年份'}`"
              :subtitle="'这里只展示当前世界模型中真实存在的字段，不再追加任务、资源或场景扩展信息。'"
              :sections="worldSidebarSections"
            />
          </div>

          <div class="stage-stack-panel">
            <NarrativeCharacterSidebar
              title="角色列表"
              :subtitle="'点击角色卡即可切换当前角色；如需离开舞台查看个人故事线，请使用下方故事线按钮。'"
              :characters="stageCharacters"
              :active-character-id="activeCharacterId"
              :loading="false"
              :error="characterError"
              @select="handleCharacterSelect"
              @storyline="goToCharacterStoryline($event.id)"
            />
          </div>
        </div>
      </div>

      <section v-if="worldError" class="page-notice">
        {{ worldError }}
      </section>

      <section v-if="wsErrorMessage && wsConnectionState === 'error'" class="page-notice">
        {{ wsErrorMessage }}
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.narrative-stage-page {
  height: 100vh;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 16px;
  padding: 24px;
  box-sizing: border-box;
  background:
    radial-gradient(circle at top left, rgba(180, 142, 255, 0.14), transparent 24%),
    radial-gradient(circle at top right, rgba(99, 226, 183, 0.08), transparent 20%),
    var(--color-bg-deep);
}

.page-loading {
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border: 1px solid rgba(180, 142, 255, 0.1);
  border-radius: var(--radius-lg);
  background: rgba(22, 19, 31, 0.72);
  backdrop-filter: blur(10px);
}

.stage-page-header__main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.stage-page-header__badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border: 1px solid rgba(180, 142, 255, 0.24);
  border-radius: 999px;
  background: rgba(180, 142, 255, 0.1);
  color: var(--color-primary);
  font-size: 12px;
}

.stage-page-header__context {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.stage-page-header__world {
  color: var(--color-text-body);
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stage-page-header__separator,
.stage-page-header__meta {
  color: var(--color-text-muted);
  line-height: 1.5;
}

.stage-page-header__separator {
  flex-shrink: 0;
}

.stage-page-header__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.stage-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 280px;
  gap: 18px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.stage-column {
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.stage-column--stack {
  display: grid;
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}

.stage-stack-panel {
  min-height: 0;
}

.page-notice {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 193, 7, 0.18);
  background: rgba(255, 193, 7, 0.08);
  color: #f4d27a;
  line-height: 1.7;
}

@media (max-width: 1360px) {
  .stage-layout {
    grid-template-columns: 290px minmax(0, 1fr) 260px;
  }
}

@media (max-width: 1080px) {
  .narrative-stage-page {
    height: auto;
    min-height: 100vh;
    overflow: visible;
    grid-template-rows: auto auto auto;
  }

  .stage-layout {
    grid-template-columns: repeat(1, minmax(0, 1fr));
    height: auto;
    overflow: visible;
  }

  .stage-column {
    height: auto;
  }

  .stage-column--stack {
    grid-template-rows: repeat(2, minmax(0, auto));
  }
}

@media (max-width: 768px) {
  .narrative-stage-page {
    padding: 16px;
  }

  .stage-page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stage-page-header__actions {
    justify-content: flex-start;
  }

  .stage-page-header__main,
  .stage-page-header__context {
    flex-wrap: wrap;
  }
}
</style>
