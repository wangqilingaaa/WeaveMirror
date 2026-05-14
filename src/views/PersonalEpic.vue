<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useRoute, useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NCard,
  NEmpty,
  NIcon,
  NSpace,
  NSpin,
  NStatistic,
  NTag,
  useMessage
} from 'naive-ui'
import { ArrowBackOutline, BookmarkOutline, RefreshOutline } from '@vicons/ionicons5'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GraphChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
import {
  getCharacterApi,
  getCharacterRelationsApi,
  getRelationMapApi,
  getStorylineApi,
  listCharactersApi,
  pinEntryApi
} from '@/api'
import type { Character, Relationship, StorylineEntry } from '@/types'

use([CanvasRenderer, GraphChart, TooltipComponent, LegendComponent])

interface RelationCardItem {
  id: number
  counterpartId: number
  counterpartName: string
  relType: string
  strength: number
  directionLabel: string
  isSecret: boolean
  createdAt?: string
}

const STORYLINE_BATCH_LIMIT = 100

const route = useRoute()
const router = useRouter()
const message = useMessage()

/**
 * 兼容新的标准路由 `/worlds/:worldId/storyline/:characterId`，
 * 同时允许旧别名路由通过 query 传 worldId，避免历史链接彻底失效。
 */
const worldId = computed(() => Number(route.params.worldId ?? route.query.worldId ?? 0))
const characterId = computed(() => Number(route.params.characterId))

const pageLoading = ref(true)
const characterLoading = ref(false)
const storylineLoading = ref(false)
const relationLoading = ref(false)
const pinningEntryId = ref<string | null>(null)

const pageError = ref('')
const relationHint = ref('')

const currentCharacter = ref<Character | null>(null)
const worldCharacters = ref<Character[]>([])
const storylineEntries = ref<StorylineEntry[]>([])
const characterRelations = ref<Relationship[]>([])
const relationMap = ref<{ nodes: Array<{ id: number; name: string; state: string }>; edges: Array<{ source_id: number; target_id: number; rel_type: string; strength: number; is_secret: boolean }> }>({
  nodes: [],
  edges: []
})

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0
}

function formatDateTime(value?: string | null): string {
  if (!value) return '未记录'
  const date = dayjs(value)
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : value
}

function normalizeStrength(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.max(-100, Math.min(100, value))
}

/**
 * 根据关系强度给出稳定的视觉文案，方便故事线与关系图共用同一套解释。
 */
function getStrengthLabel(strength: number): string {
  const absStrength = Math.abs(strength)
  if (absStrength >= 80) return strength >= 0 ? '极强连接' : '极强冲突'
  if (absStrength >= 50) return strength >= 0 ? '强连接' : '强冲突'
  if (absStrength >= 20) return strength >= 0 ? '中等连接' : '中等冲突'
  if (absStrength > 0) return strength >= 0 ? '弱连接' : '弱冲突'
  return '中性'
}

function getCharacterName(characterIdValue: number): string {
  if (characterIdValue === currentCharacter.value?.id) {
    return currentCharacter.value.name
  }

  return worldCharacters.value.find((item) => item.id === characterIdValue)?.name
    ?? relationMap.value.nodes.find((item) => item.id === characterIdValue)?.name
    ?? `角色 #${characterIdValue}`
}

const hasValidCharacterId = computed(() => isPositiveInteger(characterId.value))
const hasValidWorldId = computed(() => isPositiveInteger(worldId.value))

const timelineEntries = computed(() => {
  return [...storylineEntries.value].sort((a, b) => {
    return dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf()
  })
})

const coreMemories = computed(() => {
  return timelineEntries.value
    .filter((entry) => entry.is_core_memory)
    .slice()
    .sort((a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf())
})

const relationshipCards = computed<RelationCardItem[]>(() => {
  return characterRelations.value
    .map((relationship) => {
      const isSource = relationship.source_id === characterId.value
      const counterpartId = isSource ? relationship.target_id : relationship.source_id
      return {
        id: relationship.id,
        counterpartId,
        counterpartName: getCharacterName(counterpartId),
        relType: relationship.rel_type || '未命名关系',
        strength: normalizeStrength(relationship.strength),
        directionLabel: isSource ? '当前角色发起' : '对方向当前角色指向',
        isSecret: relationship.is_secret,
        createdAt: relationship.updated_at || relationship.created_at
      }
    })
    .sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength))
})

/**
 * 关系图只聚焦当前角色的一度关系。
 * 原因：
 * 1. 世界级图谱节点可能很多，整图直接铺开会压缩可读性；
 * 2. 当前页面是“个人史诗”，重点应放在角色自身与周边人物的关系网络。
 */
const relationGraphPayload = computed(() => {
  const focusId = characterId.value
  const graphNodes = relationMap.value.nodes ?? []
  const graphEdges = relationMap.value.edges ?? []
  const relatedEdges = graphEdges.filter((edge) => edge.source_id === focusId || edge.target_id === focusId)
  const nodeIds = new Set<number>([focusId])

  relatedEdges.forEach((edge) => {
    nodeIds.add(edge.source_id)
    nodeIds.add(edge.target_id)
  })

  const nodes = graphNodes
    .filter((node) => nodeIds.has(node.id))
    .map((node) => ({ ...node }))

  if (!nodes.find((node) => node.id === focusId) && currentCharacter.value) {
    nodes.unshift({
      id: currentCharacter.value.id,
      name: currentCharacter.value.name,
      state: currentCharacter.value.state || '未设置状态'
    })
  }

  const degreeMap = new Map<number, number>()
  relatedEdges.forEach((edge) => {
    degreeMap.set(edge.source_id, (degreeMap.get(edge.source_id) ?? 0) + 1)
    degreeMap.set(edge.target_id, (degreeMap.get(edge.target_id) ?? 0) + 1)
  })

  return {
    nodes,
    edges: relatedEdges,
    degreeMap
  }
})

const relationChartOption = computed(() => {
  const { nodes, edges, degreeMap } = relationGraphPayload.value

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter(params: any) {
        if (params.dataType === 'edge') {
          const strength = normalizeStrength(params.data?.strength)
          return [
            `${params.data?.sourceName ?? '未知角色'} -> ${params.data?.targetName ?? '未知角色'}`,
            `关系：${params.data?.relType ?? '未命名'}`,
            `强度：${strength}（${getStrengthLabel(strength)}）`,
            `可见性：${params.data?.isSecret ? '秘密关系' : '公开关系'}`
          ].join('<br/>')
        }

        return [
          params.data?.name ?? '未命名角色',
          `状态：${params.data?.state ?? '未设置'}`,
          `直接关系数：${degreeMap.get(Number(params.data?.id)) ?? 0}`
        ].join('<br/>')
      }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [4, 8],
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 3
          }
        },
        force: {
          repulsion: 240,
          gravity: 0.08,
          friction: 0.2,
          edgeLength: [100, 180]
        },
        label: {
          show: true,
          color: '#f4ecff',
          fontSize: 12
        },
        lineStyle: {
          opacity: 0.75,
          curveness: 0.14
        },
        data: nodes.map((node) => {
          const isFocusNode = node.id === characterId.value
          const degree = degreeMap.get(node.id) ?? 0
          return {
            id: String(node.id),
            name: node.name,
            state: node.state,
            symbolSize: isFocusNode ? 72 : 42 + Math.min(degree * 4, 16),
            itemStyle: {
              color: isFocusNode ? '#b48eff' : '#63e2b7',
              borderColor: isFocusNode ? '#ead8ff' : '#d8fff2',
              borderWidth: 2,
              shadowBlur: isFocusNode ? 22 : 12,
              shadowColor: isFocusNode ? 'rgba(180, 142, 255, 0.35)' : 'rgba(99, 226, 183, 0.25)'
            }
          }
        }),
        links: edges.map((edge) => {
          const strength = normalizeStrength(edge.strength)
          return {
            source: String(edge.source_id),
            target: String(edge.target_id),
            relType: edge.rel_type,
            strength,
            isSecret: edge.is_secret,
            sourceName: getCharacterName(edge.source_id),
            targetName: getCharacterName(edge.target_id),
            lineStyle: {
              color: strength >= 0 ? '#63e2b7' : '#ff8a80',
              width: 1.6 + Math.min(Math.abs(strength) / 30, 3)
            },
            label: {
              show: true,
              formatter: edge.rel_type,
              color: '#c9bed8',
              fontSize: 11
            }
          }
        })
      }
    ]
  }
})

const overviewStats = computed(() => {
  return {
    timelineCount: timelineEntries.value.length,
    memoryCount: coreMemories.value.length,
    relationCount: relationshipCards.value.length,
    graphNodeCount: relationGraphPayload.value.nodes.length
  }
})

function goToWorkshop() {
  router.push({ name: 'Workshop' })
}

function goToWorldDetail() {
  if (!hasValidWorldId.value) return
  router.push({ name: 'WorldDetail', params: { worldId: worldId.value } })
}

async function loadCharacter() {
  if (!hasValidWorldId.value || !hasValidCharacterId.value) {
    currentCharacter.value = null
    return
  }

  characterLoading.value = true
  try {
    currentCharacter.value = await getCharacterApi(worldId.value, characterId.value)
  } finally {
    characterLoading.value = false
  }
}

/**
 * 故事线接口是分页的，但页面的“故事线”和“记忆点”都需要完整数据集。
 * 因此这里主动按批次拉全量数据，再统一做时间轴和核心记忆筛选。
 */
async function loadStorylineEntries() {
  if (!hasValidCharacterId.value) {
    storylineEntries.value = []
    return
  }

  storylineLoading.value = true
  try {
    let page = 1
    let total = Infinity
    const allEntries: StorylineEntry[] = []

    while (allEntries.length < total) {
      const response = await getStorylineApi(characterId.value, {
        page,
        limit: STORYLINE_BATCH_LIMIT
      })
      const currentBatch = response.entries ?? []
      total = response.total ?? currentBatch.length
      allEntries.push(...currentBatch)

      if (!currentBatch.length || currentBatch.length < STORYLINE_BATCH_LIMIT) {
        break
      }

      page += 1
    }

    storylineEntries.value = allEntries
  } finally {
    storylineLoading.value = false
  }
}

async function loadWorldCharacters() {
  if (!hasValidWorldId.value) {
    worldCharacters.value = []
    return
  }

  const data = await listCharactersApi({
    world_id: worldId.value,
    page: 1,
    limit: 200
  })
  worldCharacters.value = data.characters ?? []
}

async function loadRelationData() {
  characterRelations.value = []
  relationMap.value = { nodes: [], edges: [] }
  relationHint.value = ''

  if (!hasValidWorldId.value || !hasValidCharacterId.value) {
    relationHint.value = '当前链接缺少 worldId，人物关系图无法按接口文档加载。'
    return
  }

  relationLoading.value = true
  try {
    const [relationListData, relationMapData] = await Promise.all([
      getCharacterRelationsApi(worldId.value, characterId.value),
      getRelationMapApi(worldId.value)
    ])

    characterRelations.value = relationListData.relationships ?? []
    relationMap.value = {
      nodes: relationMapData.nodes ?? [],
      edges: relationMapData.edges ?? []
    }

    /**
     * 关系图接口文档明确说明只返回“未死亡角色”。
     * 因此若某条直接关系的对象未出现在图谱节点中，页面仍保留列表展示，并给出提示。
     */
    const missingCounterparts = characterRelations.value.filter((item) => {
      const counterpartId = item.source_id === characterId.value ? item.target_id : item.source_id
      return !relationMap.value.nodes.some((node) => node.id === counterpartId)
    })

    if (missingCounterparts.length > 0) {
      relationHint.value = '部分直接关系对象未出现在图谱中，通常是因为关系图接口仅返回符合文档条件的节点。'
    }
  } finally {
    relationLoading.value = false
  }
}

async function refreshAllData() {
  if (!hasValidCharacterId.value) {
    pageError.value = '角色 ID 无效，无法加载个人史诗。'
    pageLoading.value = false
    return
  }

  pageLoading.value = true
  pageError.value = ''

  const tasks: Array<Promise<unknown>> = [loadStorylineEntries()]

  if (hasValidWorldId.value) {
    tasks.push(loadCharacter(), loadWorldCharacters(), loadRelationData())
  } else {
    currentCharacter.value = null
    worldCharacters.value = []
    await loadRelationData()
  }

  const results = await Promise.allSettled(tasks)
  const rejected = results.find((item) => item.status === 'rejected') as PromiseRejectedResult | undefined

  if (rejected) {
    pageError.value = rejected.reason?.message || '加载个人史诗页面失败'
  }

  pageLoading.value = false
}

async function toggleCoreMemory(entry: StorylineEntry) {
  pinningEntryId.value = entry.id
  try {
    const nextState = !entry.is_core_memory
    await pinEntryApi(entry.id, { is_core_memory: nextState })
    storylineEntries.value = storylineEntries.value.map((item) => {
      if (item.id !== entry.id) return item
      return {
        ...item,
        is_core_memory: nextState
      }
    })
    message.success(nextState ? '已加入关键记忆点' : '已移出关键记忆点')
  } catch (err: any) {
    message.error(err?.message || '更新关键记忆点失败')
  } finally {
    pinningEntryId.value = null
  }
}

watch(
  () => [worldId.value, characterId.value],
  () => {
    void refreshAllData()
  },
  { immediate: true }
)
</script>

<template>
  <div class="personal-epic-page">
    <div v-if="pageLoading" class="page-loading">
      <NSpin size="large" />
    </div>

    <template v-else>
      <header class="page-header">
        <div class="page-header__left">
          <div class="page-header__badge">个人史诗</div>
          <h1 class="page-title">
            {{ currentCharacter?.name || `角色 #${characterId}` }} 的故事线
          </h1>
          <p class="page-subtitle">
            基于已接入接口展示完整故事线、核心记忆点和人物关系图。未出现在接口文档中的高级操作，当前先不纳入本页。
          </p>
        </div>

        <NSpace>
          <NButton secondary @click="goToWorkshop">
            <template #icon>
              <NIcon><ArrowBackOutline /></NIcon>
            </template>
            返回工坊
          </NButton>
          <NButton secondary :disabled="!hasValidWorldId" @click="goToWorldDetail">
            返回世界详情
          </NButton>
          <NButton type="primary" @click="refreshAllData">
            <template #icon>
              <NIcon><RefreshOutline /></NIcon>
            </template>
            刷新页面
          </NButton>
        </NSpace>
      </header>

      <NAlert v-if="pageError" type="error" :show-icon="false" class="page-alert">
        {{ pageError }}
      </NAlert>

      <section class="summary-grid">
        <NCard class="summary-card">
          <NStatistic label="故事节点" :value="overviewStats.timelineCount" />
        </NCard>
        <NCard class="summary-card">
          <NStatistic label="关键记忆点" :value="overviewStats.memoryCount" />
        </NCard>
        <NCard class="summary-card">
          <NStatistic label="直接关系" :value="overviewStats.relationCount" />
        </NCard>
        <NCard class="summary-card">
          <NStatistic label="图谱节点" :value="overviewStats.graphNodeCount" />
        </NCard>
      </section>

      <section class="module-section">
        <div class="module-header">
          <div>
            <h2 class="module-title">故事线</h2>
            <p class="module-desc">
              按时间顺序展示角色经历过的故事条目，并允许把高价值节点提升为关键记忆点。
            </p>
          </div>
          <NButton secondary :loading="storylineLoading" @click="loadStorylineEntries">
            重新加载故事线
          </NButton>
        </div>

        <div v-if="storylineLoading" class="module-loading">
          <NSpin size="large" />
        </div>
        <NEmpty v-else-if="timelineEntries.length === 0" description="当前角色还没有故事线条目。" />
        <div v-else class="timeline-list">
          <article v-for="entry in timelineEntries" :key="entry.id" class="timeline-item">
            <div class="timeline-item__axis">
              <span class="timeline-item__dot" :class="{ 'timeline-item__dot--memory': entry.is_core_memory }" />
            </div>

            <div class="timeline-item__content">
              <div class="timeline-item__head">
                <div class="timeline-item__title-group">
                  <h3 class="timeline-item__title">{{ entry.timestamp || '未记录时间' }}</h3>
                  <p class="timeline-item__meta">
                    {{ entry.location || '未知地点' }} · 录入于 {{ formatDateTime(entry.created_at) }}
                  </p>
                </div>
                <NTag size="small" :type="entry.is_core_memory ? 'warning' : 'default'">
                  {{ entry.is_core_memory ? '关键记忆' : '普通节点' }}
                </NTag>
              </div>

              <p class="timeline-item__summary">{{ entry.summary || '暂无摘要。' }}</p>

              <div class="timeline-item__tags">
                <NTag v-if="entry.emotion_tag" size="small" type="success" round>
                  情绪：{{ entry.emotion_tag }}
                </NTag>
                <NTag v-for="tag in entry.tags || []" :key="tag" size="small" round>
                  {{ tag }}
                </NTag>
                <NTag
                  v-for="relatedId in entry.related_character_ids || []"
                  :key="`related-${entry.id}-${relatedId}`"
                  size="small"
                  type="info"
                  round
                >
                  关联人物：{{ getCharacterName(relatedId) }}
                </NTag>
              </div>

              <div class="timeline-item__actions">
                <NButton
                  size="small"
                  secondary
                  :loading="pinningEntryId === entry.id"
                  @click="toggleCoreMemory(entry)"
                >
                  <template #icon>
                    <NIcon><BookmarkOutline /></NIcon>
                  </template>
                  {{ entry.is_core_memory ? '取消记忆点' : '设为记忆点' }}
                </NButton>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="module-section">
        <div class="module-header">
          <div>
            <h2 class="module-title">记忆点</h2>
            <p class="module-desc">
              从故事线里提取 `is_core_memory = true` 的条目，作为角色最值得回看的核心节点。
            </p>
          </div>
          <NTag size="small" type="warning" round>
            共 {{ coreMemories.length }} 条
          </NTag>
        </div>

        <NEmpty v-if="coreMemories.length === 0" description="当前还没有被标记为关键记忆点的条目。" />
        <div v-else class="memory-grid">
          <NCard v-for="entry in coreMemories" :key="`memory-${entry.id}`" class="memory-card">
            <template #header>{{ entry.timestamp || '未记录时间' }}</template>
            <template #header-extra>
              <NTag size="small" type="warning">记忆点</NTag>
            </template>

            <p class="memory-card__summary">{{ entry.summary || '暂无摘要。' }}</p>
            <div class="memory-card__meta">
              <span>地点：{{ entry.location || '未知地点' }}</span>
              <span>录入时间：{{ formatDateTime(entry.created_at) }}</span>
              <span v-if="entry.emotion_tag">情绪：{{ entry.emotion_tag }}</span>
            </div>
            <div class="timeline-item__tags">
              <NTag v-for="tag in entry.tags || []" :key="`memory-tag-${entry.id}-${tag}`" size="small" round>
                {{ tag }}
              </NTag>
            </div>
          </NCard>
        </div>
      </section>

      <section class="module-section">
        <div class="module-header">
          <div>
            <h2 class="module-title">人物关系</h2>
            <p class="module-desc">
              左侧展示当前角色的直接关系，右侧用图表聚焦一度关系网络。图谱严格以接口返回结果为准。
            </p>
          </div>
          <NButton secondary :loading="relationLoading || characterLoading" @click="loadRelationData">
            重新加载关系
          </NButton>
        </div>

        <NAlert v-if="relationHint" type="info" :show-icon="false" class="module-alert">
          {{ relationHint }}
        </NAlert>

        <div class="relation-layout">
          <NCard class="detail-card">
            <template #header>直接关系</template>
            <div v-if="relationLoading" class="module-loading">
              <NSpin size="small" />
            </div>
            <NEmpty v-else-if="relationshipCards.length === 0" description="当前角色还没有直接关系记录。" />
            <div v-else class="relation-card-list">
              <article v-for="item in relationshipCards" :key="item.id" class="relation-card">
                <div class="relation-card__head">
                  <div>
                    <h3 class="relation-card__title">{{ item.counterpartName }}</h3>
                    <p class="relation-card__subtitle">
                      {{ item.relType }} · {{ item.directionLabel }}
                    </p>
                  </div>
                  <NTag size="small" :type="item.strength >= 0 ? 'success' : 'error'">
                    {{ item.strength }}
                  </NTag>
                </div>

                <div class="relation-strength">
                  <div class="relation-strength__track">
                    <div
                      class="relation-strength__value"
                      :class="item.strength >= 0 ? 'relation-strength__value--positive' : 'relation-strength__value--negative'"
                      :style="{ width: `${Math.max(Math.abs(item.strength), 4)}%` }"
                    />
                  </div>
                  <span class="relation-strength__label">{{ getStrengthLabel(item.strength) }}</span>
                </div>

                <div class="relation-card__meta">
                  <span>对象 ID：{{ item.counterpartId }}</span>
                  <span>可见性：{{ item.isSecret ? '秘密关系' : '公开关系' }}</span>
                  <span>最近变更：{{ formatDateTime(item.createdAt) }}</span>
                </div>
              </article>
            </div>
          </NCard>

          <NCard class="detail-card">
            <template #header>关系图谱</template>
            <template #header-extra>
              <NTag size="small" round type="info">
                当前角色 + 一度关系
              </NTag>
            </template>
            <div v-if="relationLoading" class="module-loading module-loading--chart">
              <NSpin size="large" />
            </div>
            <NEmpty
              v-else-if="relationGraphPayload.nodes.length === 0"
              description="当前没有可用于绘图的人物关系数据。"
            />
            <VChart v-else class="relation-chart" :option="relationChartOption" autoresize />
          </NCard>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.personal-epic-page {
  min-height: 100vh;
  padding: 32px;
  background:
    radial-gradient(circle at top left, rgba(180, 142, 255, 0.12), transparent 28%),
    var(--color-bg-deep);
}

.page-loading,
.module-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-loading {
  min-height: calc(100vh - 64px);
}

.module-loading {
  min-height: 180px;
}

.module-loading--chart {
  min-height: 420px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.page-header__left {
  max-width: 780px;
}

.page-header__badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  margin-bottom: 12px;
  border: 1px solid rgba(180, 142, 255, 0.25);
  border-radius: 999px;
  background: rgba(180, 142, 255, 0.1);
  color: var(--color-primary);
  font-size: 12px;
}

.page-title {
  margin: 0 0 8px;
  font-family: var(--font-title);
  font-size: 34px;
  color: var(--color-text-body);
}

.page-subtitle {
  margin: 0;
  color: var(--color-text-desc);
  line-height: 1.75;
}

.page-alert {
  margin-bottom: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card,
.detail-card,
.memory-card {
  min-width: 0;
  background: rgba(22, 19, 31, 0.9);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.module-section {
  margin-bottom: 24px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(22, 19, 31, 0.72);
  backdrop-filter: blur(8px);
}

.module-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.module-title {
  margin: 0 0 6px;
  font-size: 22px;
  color: var(--color-text-body);
}

.module-desc {
  margin: 0;
  color: var(--color-text-desc);
  line-height: 1.7;
}

.module-alert {
  margin-bottom: 16px;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 12px;
}

.timeline-item__axis {
  position: relative;
  display: flex;
  justify-content: center;
}

.timeline-item__axis::after {
  content: '';
  position: absolute;
  top: 10px;
  bottom: -18px;
  width: 1px;
  background: rgba(180, 142, 255, 0.2);
}

.timeline-item:last-child .timeline-item__axis::after {
  display: none;
}

.timeline-item__dot {
  position: relative;
  z-index: 1;
  width: 12px;
  height: 12px;
  margin-top: 8px;
  border-radius: 50%;
  background: rgba(180, 142, 255, 0.65);
  box-shadow: 0 0 0 6px rgba(180, 142, 255, 0.12);
}

.timeline-item__dot--memory {
  background: #f7c948;
  box-shadow: 0 0 0 6px rgba(247, 201, 72, 0.14);
}

.timeline-item__content,
.relation-card {
  padding: 18px;
  border: 1px solid rgba(180, 142, 255, 0.1);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.02);
}

.timeline-item__head,
.relation-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.timeline-item__title,
.relation-card__title {
  margin: 0 0 6px;
  font-size: 18px;
  color: var(--color-text-body);
}

.timeline-item__meta,
.relation-card__subtitle {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.timeline-item__summary,
.memory-card__summary {
  margin: 14px 0;
  color: var(--color-text-desc);
  line-height: 1.85;
  white-space: pre-wrap;
}

.timeline-item__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.timeline-item__actions {
  margin-top: 14px;
}

.memory-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.memory-card__meta,
.relation-card__meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.relation-layout {
  display: grid;
  grid-template-columns: 0.95fr 1.25fr;
  gap: 16px;
}

.relation-card-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.relation-strength {
  margin: 14px 0;
}

.relation-strength__track {
  width: 100%;
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}

.relation-strength__value {
  height: 100%;
  border-radius: 999px;
}

.relation-strength__value--positive {
  background: linear-gradient(90deg, rgba(99, 226, 183, 0.45), rgba(99, 226, 183, 0.95));
}

.relation-strength__value--negative {
  background: linear-gradient(90deg, rgba(255, 138, 128, 0.45), rgba(255, 138, 128, 0.95));
}

.relation-strength__label {
  display: inline-block;
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: 12px;
}

.relation-chart {
  width: 100%;
  height: 460px;
}

:deep(.n-card-header__main),
:deep(.n-statistic .n-statistic-value),
:deep(.n-statistic .n-statistic-label) {
  color: var(--color-text-body);
}

:deep(.n-card-header__main) {
  font-weight: 600;
}

@media (max-width: 1280px) {
  .summary-grid,
  .memory-grid,
  .relation-layout {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .personal-epic-page {
    padding: 20px;
  }

  .page-header,
  .module-header,
  .timeline-item__head,
  .relation-card__head {
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .page-title {
    font-size: 28px;
  }
}
</style>
