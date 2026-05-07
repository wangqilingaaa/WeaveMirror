<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useRoute, useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NCard,
  NEmpty,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NSpin,
  NStatistic,
  NTag,
  useDialog,
  useMessage
} from 'naive-ui'
import {
  AddOutline,
  ArrowBackOutline,
  BookOutline,
  CreateOutline,
  EyeOutline,
  RefreshOutline,
  SwapHorizontalOutline,
  TrashOutline
} from '@vicons/ionicons5'
import {
  createBranchApi,
  createCharacterApi,
  deleteCharacterApi,
  enhanceWorldSettingsApi,
  generateCharacterApi,
  getBranchTreeApi,
  getCharacterApi,
  getWorldApi,
  getYearbookApi,
  listCharactersApi,
  switchActiveTimelineApi,
  updateCharacterApi,
  updateWorldApi
} from '@/api'
import type {
  BranchNode,
  Character,
  CharacterInput,
  CreateBranchReq,
  StoryBranch,
  World,
  WorldEvent,
  WorldSettings
} from '@/types'
import WorldSettingsForm from '@/components/world/WorldSettingsForm.vue'
import CharacterFormModal from '@/components/worldbook/CharacterFormModal.vue'

interface FlatBranchItem {
  branch: StoryBranch
  depth: number
  parent: StoryBranch | null
  lineage: number[]
}

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()

/**
 * 页面所有模块共享同一个 worldId。
 * 使用 computed 包装路由参数，可以在切换世界时自动触发后续 watcher 刷新数据。
 */
const worldId = computed(() => Number(route.params.worldId))

// ==================== 世界详情状态 ====================

const pageLoading = ref(true)
const worldLoading = ref(false)
const branchLoading = ref(false)
const characterLoading = ref(false)
const yearbookLoading = ref(false)

const worldError = ref('')
const branchError = ref('')
const characterError = ref('')
const yearbookError = ref('')

const world = ref<World | null>(null)
const branchTree = ref<BranchNode[]>([])
const characters = ref<Character[]>([])
const yearbookEvents = ref<WorldEvent[]>([])

// ==================== 世界编辑状态 ====================

const showWorldEditModal = ref(false)
const worldSaving = ref(false)
const worldEnhancing = ref(false)
const editingWorldName = ref('')
const worldSettingsFormRef = ref<InstanceType<typeof WorldSettingsForm> | null>(null)

// ==================== 分支编辑 / 查看状态 ====================

const showBranchFormModal = ref(false)
const branchSaving = ref(false)
const branchForm = reactive({
  choiceDesc: '',
  parentId: 0
})

const branchActionId = ref<number | null>(null)

// ==================== 角色编辑 / 查看状态 ====================

const showCharacterFormModal = ref(false)
const characterModalLoading = ref(false)
const characterSaving = ref(false)
const characterEnhancing = ref(false)
const editingCharacterId = ref<number | null>(null)
const editingCharacter = ref<Character | null>(null)
const characterFormRef = ref<InstanceType<typeof CharacterFormModal> | null>(null)

const showCharacterDetailModal = ref(false)
const characterDetailLoading = ref(false)
const selectedCharacter = ref<Character | null>(null)

/**
 * 世界对象本身是扁平结构，而 `WorldSettingsForm` 需要的是 settings 结构。
 * 这里把映射集中到一个函数里，避免在弹窗打开和保存时重复拼装字段。
 */
function worldToSettings(target: World): WorldSettings {
  return {
    description: target.description,
    epoch: target.epoch,
    current_year: target.current_year,
    core_rules: target.core_rules,
    themes: target.themes,
    tags: target.tags,
    magic_system: target.magic_system,
    tech_level: target.tech_level,
    economy_type: target.economy_type,
    government: target.government,
    religion: target.religion,
    regions: target.regions,
    factions: target.factions,
    major_cities: target.major_cities,
    races: target.races,
    nsfw_enabled: target.nsfw_enabled,
    evolution_enabled: target.evolution_enabled,
    metadata: target.metadata
  }
}

function formatDateTime(value?: string | null): string {
  if (!value) return '未记录'
  const time = dayjs(value)
  return time.isValid() ? time.format('YYYY-MM-DD HH:mm') : value
}

function formatDate(value?: string | null): string {
  if (!value) return '未记录'
  const time = dayjs(value)
  return time.isValid() ? time.format('YYYY-MM-DD') : value
}

function formatJson(value: unknown): string {
  if (!value) return '暂无数据'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function isValidWorldId(id: number): boolean {
  return Number.isInteger(id) && id > 0
}

/**
 * 把树形分支展开为带深度的线性列表。
 * 这样可以同时支持“树状关系展示”和“卡片列表渲染”，避免维护两份数据源。
 */
function flattenBranchTree(nodes: BranchNode[], depth = 0, parent: StoryBranch | null = null, lineage: number[] = []): FlatBranchItem[] {
  const result: FlatBranchItem[] = []

  nodes.forEach((node) => {
    const currentLineage = [...lineage, node.id]
    result.push({
      branch: node,
      depth,
      parent,
      lineage: currentLineage
    })
    result.push(...flattenBranchTree(node.children, depth + 1, node, currentLineage))
  })

  return result
}

const flatBranches = computed(() => flattenBranchTree(branchTree.value))

function getBranchDisplayName(branch: StoryBranch): string {
  const desc = branch.choice_desc?.trim()
  if (desc) return desc
  return branch.parent_id === null ? '主线时间线' : `支线时间线 #${branch.id}`
}

function getBranchKind(branch: StoryBranch): string {
  return branch.parent_id === null ? '主线' : '支线'
}

const activeBranch = computed(() => {
  if (!world.value?.active_timeline_id) return null
  return flatBranches.value.find((item) => item.branch.id === world.value?.active_timeline_id)?.branch ?? null
})

/**
 * 后端目前没有明确提供“事件归属到哪个分支”的字段。
 * 页面为了满足运营展示需求，采用一个保守的近似规则：
 * 把事件归属给“创建时间早于该事件且最晚创建的分支”。
 * 这样至少能在缺少显式映射时，呈现一个稳定且可解释的数量指标。
 */
const branchEventCountMap = computed<Record<number, number>>(() => {
  const result: Record<number, number> = {}
  const branchItems = [...flatBranches.value]

  branchItems.forEach((item) => {
    result[item.branch.id] = 0
  })

  if (!branchItems.length || !yearbookEvents.value.length) {
    return result
  }

  const sortedBranches = [...branchItems].sort((a, b) => dayjs(a.branch.created_at).valueOf() - dayjs(b.branch.created_at).valueOf())
  const fallbackBranch = sortedBranches[0]?.branch

  yearbookEvents.value
    .slice()
    .sort((a, b) => dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf())
    .forEach((event) => {
      const eventTime = dayjs(event.created_at).valueOf()
      let target = fallbackBranch

      sortedBranches.forEach((item) => {
        if (dayjs(item.branch.created_at).valueOf() <= eventTime) {
          target = item.branch
        }
      })

      if (target) {
        result[target.id] = (result[target.id] ?? 0) + 1
      }
    })

  return result
})

const worldStats = computed(() => {
  return {
    branchCount: flatBranches.value.length,
    characterCount: characters.value.length,
    eventCount: yearbookEvents.value.length
  }
})

const branchParentOptions = computed(() => {
  const options = flatBranches.value.map((item) => ({
      label: `${'　'.repeat(item.depth)}${getBranchDisplayName(item.branch)}`,
      value: item.branch.id
    }))

  /**
   * 当接口还没有返回任何父时间线可选数据时，前端使用 0 作为兜底值。
   * 这样可以避免下拉框为空导致用户无法继续提交创建操作。
   */
  if (options.length === 0) {
    return [
      {
        label: '默认父时间线（0）',
        value: 0
      }
    ]
  }

  return options
})

const characterPreviewCards = computed(() => {
  return characters.value.map((character) => ({
    ...character,
    highlightTags: [
      character.state || '未设置状态',
      character.life_stage,
      character.species
    ].filter(Boolean) as string[]
  }))
})

function openWorkshop() {
  router.push({ name: 'Workshop' })
}

function openStage() {
  router.push({ name: 'Stage', params: { worldId: worldId.value } })
}

function openConsole() {
  router.push({ name: 'Console', params: { worldId: worldId.value } })
}

function openStoryline(characterId: number) {
  router.push({ name: 'Storyline', params: { characterId } })
}

// ==================== 数据加载 ====================

async function loadWorld() {
  if (!isValidWorldId(worldId.value)) {
    worldError.value = '世界 ID 无效，无法加载详情。'
    world.value = null
    return
  }

  worldLoading.value = true
  worldError.value = ''
  try {
    world.value = await getWorldApi(worldId.value)
  } catch (err: any) {
    worldError.value = err?.message || '加载世界详情失败'
  } finally {
    worldLoading.value = false
  }
}

async function loadBranches() {
  if (!isValidWorldId(worldId.value)) {
    branchError.value = '世界 ID 无效，无法加载分支数据。'
    branchTree.value = []
    return
  }

  branchLoading.value = true
  branchError.value = ''
  try {
    const data = await getBranchTreeApi(worldId.value)
    branchTree.value = data.roots ?? []
  } catch (err: any) {
    branchError.value = err?.message || '加载时间线分支失败'
    branchTree.value = []
  } finally {
    branchLoading.value = false
  }
}

async function loadCharacters() {
  if (!isValidWorldId(worldId.value)) {
    characterError.value = '世界 ID 无效，无法加载角色数据。'
    characters.value = []
    return
  }

  characterLoading.value = true
  characterError.value = ''
  try {
    const data = await listCharactersApi({
      world_id: worldId.value,
      page: 1,
      limit: 200
    })
    characters.value = data.characters ?? []
  } catch (err: any) {
    characterError.value = err?.message || '加载角色列表失败'
    characters.value = []
  } finally {
    characterLoading.value = false
  }
}

async function loadYearbook() {
  if (!isValidWorldId(worldId.value)) {
    yearbookError.value = '世界 ID 无效，无法加载年鉴数据。'
    yearbookEvents.value = []
    return
  }

  yearbookLoading.value = true
  yearbookError.value = ''
  try {
    yearbookEvents.value = await getYearbookApi(worldId.value)
  } catch (err: any) {
    yearbookError.value = err?.message || '加载年鉴事件失败'
    yearbookEvents.value = []
  } finally {
    yearbookLoading.value = false
  }
}

async function refreshAllData() {
  pageLoading.value = true
  await Promise.allSettled([
    loadWorld(),
    loadBranches(),
    loadCharacters(),
    loadYearbook()
  ])
  pageLoading.value = false
}

// ==================== 世界详情模块 ====================

function openWorldEditModal() {
  if (!world.value) return
  editingWorldName.value = world.value.name
  showWorldEditModal.value = true
}

async function handleEnhanceWorldSettings() {
  const worldName = editingWorldName.value.trim()
  const settings = worldSettingsFormRef.value?.getSettings() ?? {}

  if (!worldName) {
    message.warning('请先填写世界名称')
    return
  }

  if (Object.keys(settings).length === 0) {
    message.warning('请先填写至少一项世界设定')
    return
  }

  worldEnhancing.value = true
  try {
    const response = await enhanceWorldSettingsApi({
      world_name: worldName,
      settings
    })
    worldSettingsFormRef.value?.reset(response.enhanced_settings)
    message.success('AI 已完成世界设定优化')
  } catch (err: any) {
    message.error(err?.message || 'AI 优化世界设定失败')
  } finally {
    worldEnhancing.value = false
  }
}

async function handleSaveWorld() {
  if (!world.value) return

  const name = editingWorldName.value.trim()
  if (!name) {
    message.warning('世界名称不能为空')
    return
  }

  worldSaving.value = true
  try {
    const settings = worldSettingsFormRef.value?.getSettings() ?? {}
    const updated = await updateWorldApi(world.value.id, {
      name,
      settings
    })
    world.value = updated
    showWorldEditModal.value = false
    message.success('世界信息已更新')
    await Promise.allSettled([loadWorld(), loadYearbook()])
  } catch (err: any) {
    message.error(err?.message || '保存世界信息失败')
  } finally {
    worldSaving.value = false
  }
}

// ==================== 分支模块 ====================

function resetBranchForm() {
  branchForm.choiceDesc = ''
  branchForm.parentId = 0
}

function openCreateBranchModal(parentId = 0) {
  resetBranchForm()
  branchForm.parentId = parentId
  showBranchFormModal.value = true
}

async function handleSubmitBranch() {
  const choiceDesc = branchForm.choiceDesc.trim()
  if (!choiceDesc) {
    message.warning('请填写分支名称或分歧描述')
    return
  }

  branchSaving.value = true
  try {
    const payload: CreateBranchReq = {
      parent_timeline_id: branchForm.parentId ?? 0,
      choice_desc: choiceDesc
    }
    await createBranchApi(worldId.value, payload)
    message.success('时间线分支已创建')
    showBranchFormModal.value = false
    resetBranchForm()
    await Promise.allSettled([loadWorld(), loadBranches(), loadYearbook()])
  } catch (err: any) {
    message.error(err?.message || '保存时间线分支失败')
  } finally {
    branchSaving.value = false
  }
}

async function handleSwitchBranch(branch: StoryBranch) {
  branchActionId.value = branch.id
  try {
    await switchActiveTimelineApi(worldId.value, {
      timeline_id: branch.id
    })
    message.success(`已切换到 ${getBranchDisplayName(branch)}`)
    await Promise.allSettled([loadWorld(), loadBranches()])
  } catch (err: any) {
    message.error(err?.message || '切换活跃时间线失败')
  } finally {
    branchActionId.value = null
  }
}

// ==================== 角色模块 ====================

function openCreateCharacterModal() {
  editingCharacterId.value = null
  editingCharacter.value = null
  characterModalLoading.value = false
  showCharacterFormModal.value = true
}

async function openEditCharacterModal(characterId: number) {
  editingCharacterId.value = characterId
  editingCharacter.value = null
  characterModalLoading.value = true
  showCharacterFormModal.value = true

  try {
    editingCharacter.value = await getCharacterApi(worldId.value, characterId)
  } catch (err: any) {
    showCharacterFormModal.value = false
    message.error(err?.message || '加载角色详情失败')
  } finally {
    characterModalLoading.value = false
  }
}

async function handleSubmitCharacter(payload: CharacterInput) {
  characterSaving.value = true
  try {
    if (editingCharacterId.value) {
      await updateCharacterApi(worldId.value, editingCharacterId.value, payload)
      message.success('角色已更新')
    } else {
      await createCharacterApi(worldId.value, payload)
      message.success('角色已创建')
    }

    showCharacterFormModal.value = false
    editingCharacter.value = null
    await loadCharacters()
  } catch (err: any) {
    message.error(err?.message || '保存角色失败')
  } finally {
    characterSaving.value = false
  }
}

async function handleEnhanceCharacter(payload: CharacterInput) {
  characterEnhancing.value = true
  try {
    const response = await generateCharacterApi(payload)
    const generatedPayload =
      (response as any)?.enhanced_character ??
      (response as any)?.original_character ??
      (response as any)?.enhanced_settings ??
      (response as any)?.original_settings ??
      response

    if (!generatedPayload || typeof generatedPayload !== 'object') {
      throw new Error('AI 返回的角色数据格式不正确，无法回填表单')
    }

    characterFormRef.value?.applyGeneratedCharacter(generatedPayload)
    message.success('AI 已生成并回填角色设定')
  } catch (err: any) {
    message.error(err?.message || 'AI 生成角色失败')
  } finally {
    characterEnhancing.value = false
  }
}

async function handleViewCharacter(characterId: number) {
  showCharacterDetailModal.value = true
  characterDetailLoading.value = true
  selectedCharacter.value = characters.value.find((item) => item.id === characterId) ?? null

  try {
    selectedCharacter.value = await getCharacterApi(worldId.value, characterId)
  } catch (err: any) {
    message.error(err?.message || '加载角色详情失败')
  } finally {
    characterDetailLoading.value = false
  }
}

function handleDeleteCharacter(character: Character) {
  dialog.warning({
    title: '删除角色',
    content: `确定删除角色「${character.name}」吗？删除后无法恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteCharacterApi(worldId.value, character.id)
        message.success('角色已删除')
        if (selectedCharacter.value?.id === character.id) {
          showCharacterDetailModal.value = false
          selectedCharacter.value = null
        }
        await loadCharacters()
      } catch (err: any) {
        message.error(err?.message || '删除角色失败')
      }
    }
  })
}

// ==================== 监听路由变化 ====================

watch(
  () => worldId.value,
  () => {
    void refreshAllData()
  },
  { immediate: true }
)
</script>

<template>
  <div class="world-detail-page">
    <div v-if="pageLoading" class="page-loading">
      <NSpin size="large" />
    </div>

    <template v-else>
      <header class="page-header">
        <div class="page-header__left">
          <div class="page-header__badge">世界详情</div>
          <h1 class="page-title">{{ world?.name || `世界 #${worldId}` }}</h1>
          <p class="page-subtitle">
            集中管理世界设定、时间线分支和角色资料，所有操作都会在当前页面即时同步。
          </p>
        </div>

        <NSpace>
          <NButton secondary @click="openWorkshop">
            <template #icon>
              <NIcon><ArrowBackOutline /></NIcon>
            </template>
            返回工坊
          </NButton>
          <NButton secondary @click="openStage">叙事舞台</NButton>
          <NButton secondary @click="openConsole">系统控制台</NButton>
          <NButton type="primary" @click="refreshAllData">
            <template #icon>
              <NIcon><RefreshOutline /></NIcon>
            </template>
            刷新页面
          </NButton>
        </NSpace>
      </header>

      <section class="summary-grid">
        <NCard class="summary-card">
          <NStatistic label="时间线分支" :value="worldStats.branchCount" />
        </NCard>
        <NCard class="summary-card">
          <NStatistic label="世界角色" :value="worldStats.characterCount" />
        </NCard>
        <NCard class="summary-card">
          <NStatistic label="年鉴事件" :value="worldStats.eventCount" />
        </NCard>
        <NCard class="summary-card">
          <NStatistic
            label="当前活跃时间线"
            :value="activeBranch ? getBranchDisplayName(activeBranch) : '未设置'"
          />
        </NCard>
      </section>

      <section class="module-section">
        <div class="module-header">
          <div>
            <h2 class="module-title">世界详情模块</h2>
            <p class="module-desc">
              展示世界基础设定与关键标签，并支持在同页编辑更新。
            </p>
          </div>
          <NSpace>
            <NButton :loading="worldLoading" secondary @click="loadWorld">重新加载</NButton>
            <NButton type="primary" :disabled="!world" @click="openWorldEditModal">
              <template #icon>
                <NIcon><CreateOutline /></NIcon>
              </template>
              编辑世界信息
            </NButton>
          </NSpace>
        </div>

        <NAlert v-if="worldError" type="error" :show-icon="false" class="module-alert">
          {{ worldError }}
        </NAlert>

        <template v-else-if="world">
          <div class="detail-grid detail-grid--world">
            <NCard class="detail-card world-overview-card">
              <template #header>基础信息</template>
              <div class="kv-grid world-overview-grid">
                <div class="kv-item">
                  <span class="kv-label">世界名称</span>
                  <span class="kv-value">{{ world.name }}</span>
                </div>
                <div class="kv-item">
                  <span class="kv-label">纪元</span>
                  <span class="kv-value">{{ world.epoch || '未设置' }}</span>
                </div>
                <div class="kv-item">
                  <span class="kv-label">当前年份</span>
                  <span class="kv-value">{{ world.current_year || '未设置' }}</span>
                </div>
                <div class="kv-item">
                  <span class="kv-label">创建时间</span>
                  <span class="kv-value">{{ formatDateTime(world.created_at) }}</span>
                </div>
                <div class="kv-item">
                  <span class="kv-label">最近更新</span>
                  <span class="kv-value">{{ formatDateTime(world.updated_at) }}</span>
                </div>
                <div class="kv-item">
                  <span class="kv-label">内容模式</span>
                  <span class="kv-value">{{ world.nsfw_enabled ? 'NSFW' : 'SFW' }}</span>
                </div>
              </div>
            </NCard>

            <NCard class="detail-card world-summary-card">
              <template #header>设定摘要</template>
              <p class="long-text">{{ world.description || '暂无世界描述。' }}</p>
              <div class="tag-section">
                <span class="tag-section__label">主题</span>
                <div class="tag-list">
                  <NTag v-for="theme in world.themes || []" :key="theme" round type="info">{{ theme }}</NTag>
                  <span v-if="!world.themes?.length" class="empty-hint">暂无主题标签</span>
                </div>
              </div>
              <div class="tag-section">
                <span class="tag-section__label">标签</span>
                <div class="tag-list">
                  <NTag v-for="tag in world.tags || []" :key="tag" round>{{ tag }}</NTag>
                  <span v-if="!world.tags?.length" class="empty-hint">暂无标签</span>
                </div>
              </div>
              <div class="tag-section">
                <span class="tag-section__label">核心规则</span>
                <div class="text-list">
                  <div v-for="rule in world.core_rules || []" :key="rule" class="text-list__item">{{ rule }}</div>
                  <span v-if="!world.core_rules?.length" class="empty-hint">暂无核心规则</span>
                </div>
              </div>
            </NCard>

            <NCard class="detail-card world-structure-card">
              <template #header>世界结构</template>
              <div class="tag-section">
                <span class="tag-section__label">政治制度</span>
                <span class="kv-value">{{ world.government || '未设置' }}</span>
              </div>
              <div class="tag-section">
                <span class="tag-section__label">宗教信仰</span>
                <span class="kv-value">{{ world.religion || '未设置' }}</span>
              </div>
              <div class="tag-section">
                <span class="tag-section__label">主要势力</span>
                <div class="pill-list pill-list--success">
                  <span v-for="faction in world.factions || []" :key="faction" class="pill-item">
                    {{ faction }}
                  </span>
                  <span v-if="!world.factions?.length" class="empty-hint">暂无势力信息</span>
                </div>
              </div>
              <div class="tag-section">
                <span class="tag-section__label">主要城市</span>
                <div class="pill-list pill-list--warning">
                  <span v-for="city in world.major_cities || []" :key="city" class="pill-item">
                    {{ city }}
                  </span>
                  <span v-if="!world.major_cities?.length" class="empty-hint">暂无城市信息</span>
                </div>
              </div>
              <div class="tag-section">
                <span class="tag-section__label">主要种族</span>
                <div class="pill-list pill-list--neutral">
                  <span v-for="race in world.races || []" :key="race" class="pill-item">
                    {{ race }}
                  </span>
                  <span v-if="!world.races?.length" class="empty-hint">暂无种族信息</span>
                </div>
              </div>
            </NCard>
          </div>
        </template>
      </section>

      <section class="module-section">
        <div class="module-header">
          <div>
            <h2 class="module-title">世界线分支模块</h2>
            <p class="module-desc">
              展示主线与支线时间线，支持查看、创建、编辑、删除与活跃分支切换。
            </p>
          </div>
          <NSpace>
            <NButton :loading="branchLoading" secondary @click="loadBranches">重新加载</NButton>
            <NButton type="primary" @click="openCreateBranchModal()">
              <template #icon>
                <NIcon><AddOutline /></NIcon>
              </template>
              新建分支
            </NButton>
          </NSpace>
        </div>

        <NAlert v-if="branchError" type="error" :show-icon="false" class="module-alert">
          {{ branchError }}
        </NAlert>
        <NAlert
          v-else-if="yearbookError"
          type="warning"
          :show-icon="false"
          class="module-alert"
        >
          年鉴事件加载失败，当前“关联事件数量”使用已有缓存或显示为 0。
        </NAlert>

        <div class="detail-grid detail-grid--branch">
          <NCard class="detail-card">
            <template #header>分支关系树</template>
            <div v-if="branchLoading" class="module-loading">
              <NSpin size="small" />
            </div>
            <NEmpty v-else-if="flatBranches.length === 0" description="当前世界还没有任何时间线分支。" />
            <div v-else class="branch-tree">
              <div
                v-for="item in flatBranches"
                :key="item.branch.id"
                class="branch-tree__item"
                :style="{ paddingLeft: `${item.depth * 28}px` }"
              >
                <div class="branch-tree__line" />
                <div class="branch-tree__content">
                  <div class="branch-tree__main">
                    <span class="branch-tree__name">{{ getBranchDisplayName(item.branch) }}</span>
                    <NTag size="small" :type="item.branch.is_active ? 'success' : 'default'">
                      {{ item.branch.is_active ? '当前活跃' : getBranchKind(item.branch) }}
                    </NTag>
                  </div>
                  <div class="branch-tree__meta">
                    <span v-if="item.parent">来自：{{ getBranchDisplayName(item.parent) }}</span>
                    <span>创建于：{{ formatDate(item.branch.created_at) }}</span>
                    <span>关联事件：{{ branchEventCountMap[item.branch.id] ?? 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </NCard>

          <NCard class="detail-card">
            <template #header>分支列表</template>
            <div v-if="branchLoading" class="module-loading">
              <NSpin size="small" />
            </div>
            <NEmpty v-else-if="flatBranches.length === 0" description="暂无分支数据，可先创建主线或支线。" />
            <div v-else class="branch-card-list">
              <div v-for="item in flatBranches" :key="item.branch.id" class="branch-card">
                <div class="branch-card__head">
                  <div>
                    <h3 class="branch-card__title">{{ getBranchDisplayName(item.branch) }}</h3>
                    <p class="branch-card__subtitle">
                      {{ getBranchKind(item.branch) }} · 创建于 {{ formatDateTime(item.branch.created_at) }}
                    </p>
                  </div>
                  <NTag size="small" :type="item.branch.is_active ? 'success' : 'default'">
                    {{ item.branch.is_active ? '活跃中' : '待切换' }}
                  </NTag>
                </div>

                <div class="kv-grid kv-grid--compact">
                  <div class="kv-item">
                    <span class="kv-label">父分支</span>
                    <span class="kv-value">{{ item.parent ? getBranchDisplayName(item.parent) : '无（主线）' }}</span>
                  </div>
                  <div class="kv-item">
                    <span class="kv-label">关联事件数量</span>
                    <span class="kv-value">{{ branchEventCountMap[item.branch.id] ?? 0 }}</span>
                  </div>
                  <div class="kv-item">
                    <span class="kv-label">子分支数量</span>
                    <span class="kv-value">{{ flatBranches.filter(branchItem => branchItem.branch.parent_id === item.branch.id).length }}</span>
                  </div>
                  <div class="kv-item">
                    <span class="kv-label">分支路径</span>
                    <span class="kv-value">#{{ item.lineage.join(' -> #') }}</span>
                  </div>
                </div>

                <p class="branch-card__desc">{{ item.branch.choice_desc || '暂无分支描述。' }}</p>

                <div class="branch-card__actions">
                  <NButton size="small" secondary @click="openCreateBranchModal(item.branch.id)">
                    <template #icon>
                      <NIcon><AddOutline /></NIcon>
                    </template>
                    新建子分支
                  </NButton>
                  <NButton
                    size="small"
                    type="primary"
                    ghost
                    :loading="branchActionId === item.branch.id && item.branch.is_active === false"
                    :disabled="item.branch.is_active"
                    @click="handleSwitchBranch(item.branch)"
                  >
                    <template #icon>
                      <NIcon><SwapHorizontalOutline /></NIcon>
                    </template>
                    设为活跃
                  </NButton>
                </div>
              </div>
            </div>
          </NCard>
        </div>
      </section>

      <section class="module-section">
        <div class="module-header">
          <div>
            <h2 class="module-title">角色管理模块</h2>
            <p class="module-desc">
              统一管理当前世界下的角色卡片、详情查看与增删改操作。
            </p>
          </div>
          <NSpace>
            <NButton :loading="characterLoading" secondary @click="loadCharacters">重新加载</NButton>
            <NButton type="primary" @click="openCreateCharacterModal">
              <template #icon>
                <NIcon><AddOutline /></NIcon>
              </template>
              新增角色
            </NButton>
          </NSpace>
        </div>

        <NAlert v-if="characterError" type="error" :show-icon="false" class="module-alert">
          {{ characterError }}
        </NAlert>

        <div v-if="characterLoading" class="module-loading module-loading--large">
          <NSpin size="large" />
        </div>
        <NEmpty v-else-if="characterPreviewCards.length === 0" description="当前世界还没有角色，先创建一个吧。" />
        <div v-else class="character-grid">
          <div v-for="character in characterPreviewCards" :key="character.id" class="character-card">
            <div class="character-card__head">
              <div>
                <h3 class="character-card__title">{{ character.name }}</h3>
                <p class="character-card__subtitle">
                  {{ character.current_location || '未设置地点' }}
                  <span v-if="character.age !== undefined"> · {{ character.age }} 岁</span>
                </p>
              </div>
              <div class="tag-list tag-list--compact">
                <NTag v-for="tag in character.highlightTags" :key="tag" size="small" round>{{ tag }}</NTag>
              </div>
            </div>

            <p class="character-card__desc">
              {{ character.appearance || character.backstory || '暂未填写角色外观或背景描述。' }}
            </p>

            <div class="kv-grid kv-grid--compact">
              <div class="kv-item">
                <span class="kv-label">身份 / 种族</span>
                <span class="kv-value">{{ character.species || '未设置' }}</span>
              </div>
              <div class="kv-item">
                <span class="kv-label">核心欲望</span>
                <span class="kv-value">{{ character.core_desire || '未设置' }}</span>
              </div>
              <div class="kv-item">
                <span class="kv-label">别名</span>
                <span class="kv-value">{{ character.name_aliases?.join(' / ') || '无' }}</span>
              </div>
              <div class="kv-item">
                <span class="kv-label">最近更新</span>
                <span class="kv-value">{{ formatDateTime(character.updated_at || character.created_at) }}</span>
              </div>
            </div>

            <div class="character-card__actions">
              <NButton size="small" secondary @click="handleViewCharacter(character.id)">
                <template #icon>
                  <NIcon><EyeOutline /></NIcon>
                </template>
                详情
              </NButton>
              <NButton size="small" secondary @click="openStoryline(character.id)">
                <template #icon>
                  <NIcon><BookOutline /></NIcon>
                </template>
                故事线
              </NButton>
              <NButton size="small" secondary @click="openEditCharacterModal(character.id)">
                <template #icon>
                  <NIcon><CreateOutline /></NIcon>
                </template>
                编辑
              </NButton>
              <NButton size="small" quaternary type="error" @click="handleDeleteCharacter(character)">
                <template #icon>
                  <NIcon><TrashOutline /></NIcon>
                </template>
                删除
              </NButton>
            </div>
          </div>
        </div>
      </section>
    </template>

    <NModal
      v-model:show="showWorldEditModal"
      preset="card"
      title="编辑世界信息"
      style="max-width: 760px"
      :mask-closable="false"
    >
      <NForm @submit.prevent="handleSaveWorld">
        <NFormItem label="世界名称" required>
          <NInput
            v-model:value="editingWorldName"
            placeholder="请输入世界名称"
            :disabled="worldSaving"
          />
        </NFormItem>

        <WorldSettingsForm
          ref="worldSettingsFormRef"
          :settings="world ? worldToSettings(world) : undefined"
          :enhancing="worldEnhancing"
          @enhance="handleEnhanceWorldSettings"
        />

        <NSpace justify="end" style="margin-top: 20px">
          <NButton :disabled="worldSaving" @click="showWorldEditModal = false">取消</NButton>
          <NButton type="primary" :loading="worldSaving" @click="handleSaveWorld">保存世界信息</NButton>
        </NSpace>
      </NForm>
    </NModal>

    <NModal
      v-model:show="showBranchFormModal"
      preset="card"
      title="创建时间线分支"
      style="max-width: 560px"
      :mask-closable="false"
    >
      <NForm @submit.prevent="handleSubmitBranch">
        <NFormItem label="分支名称 / 分歧描述" required>
          <NInput
            v-model:value="branchForm.choiceDesc"
            placeholder="例如：选择支持王室、拒绝远征、救下关键角色"
          />
        </NFormItem>

        <NFormItem label="父时间线">
          <NSelect
            v-model:value="branchForm.parentId"
            :options="branchParentOptions"
            placeholder="无可选数据时默认使用 0"
          />
        </NFormItem>

        <NSpace justify="end">
          <NButton :disabled="branchSaving" @click="showBranchFormModal = false">取消</NButton>
          <NButton type="primary" :loading="branchSaving" @click="handleSubmitBranch">
            创建分支
          </NButton>
        </NSpace>
      </NForm>
    </NModal>

    <CharacterFormModal
      ref="characterFormRef"
      v-model:show="showCharacterFormModal"
      :world-id="worldId"
      :character="editingCharacter"
      :loading="characterModalLoading"
      :saving="characterSaving"
      :enhancing="characterEnhancing"
      @submit="handleSubmitCharacter"
      @enhance="handleEnhanceCharacter"
    />

    <NModal
      v-model:show="showCharacterDetailModal"
      preset="card"
      title="角色详情"
      style="max-width: 860px"
    >
      <div v-if="characterDetailLoading" class="module-loading module-loading--large">
        <NSpin size="large" />
      </div>

      <template v-else-if="selectedCharacter">
        <div class="detail-grid detail-grid--character-modal">
          <NCard class="detail-card">
            <template #header>基础档案</template>
            <div class="kv-grid">
              <div class="kv-item">
                <span class="kv-label">姓名</span>
                <span class="kv-value">{{ selectedCharacter.name }}</span>
              </div>
              <div class="kv-item">
                <span class="kv-label">别名</span>
                <span class="kv-value">{{ selectedCharacter.name_aliases?.join(' / ') || '无' }}</span>
              </div>
              <div class="kv-item">
                <span class="kv-label">年龄</span>
                <span class="kv-value">{{ selectedCharacter.age ?? '未设置' }}</span>
              </div>
              <div class="kv-item">
                <span class="kv-label">状态</span>
                <span class="kv-value">{{ selectedCharacter.state || '未设置' }}</span>
              </div>
              <div class="kv-item">
                <span class="kv-label">生命阶段</span>
                <span class="kv-value">{{ selectedCharacter.life_stage || '未设置' }}</span>
              </div>
              <div class="kv-item">
                <span class="kv-label">当前位置</span>
                <span class="kv-value">{{ selectedCharacter.current_location || '未设置' }}</span>
              </div>
            </div>
            <div class="modal-section">
              <h3 class="modal-section__title">外观描述</h3>
              <p class="long-text">{{ selectedCharacter.appearance || '暂无外观描述。' }}</p>
            </div>
            <div class="modal-section">
              <h3 class="modal-section__title">背景故事</h3>
              <p class="long-text">{{ selectedCharacter.backstory || '暂无背景故事。' }}</p>
            </div>
          </NCard>

          <NCard class="detail-card">
            <template #header>关键属性</template>
            <div class="tag-section">
              <span class="tag-section__label">人格标签</span>
              <div class="tag-list">
                <NTag
                  v-for="tag in selectedCharacter.personality_traits?.tags || []"
                  :key="tag"
                  round
                  type="info"
                >
                  {{ tag }}
                </NTag>
                <span v-if="!selectedCharacter.personality_traits?.tags?.length" class="empty-hint">暂无人格标签</span>
              </div>
            </div>
            <div class="tag-section">
              <span class="tag-section__label">核心欲望</span>
              <p class="long-text">{{ selectedCharacter.core_desire || '暂无核心欲望描述。' }}</p>
            </div>
            <div class="tag-section">
              <span class="tag-section__label">基础属性</span>
              <pre class="json-block">{{ formatJson(selectedCharacter.base_attributes) }}</pre>
            </div>
            <div class="tag-section">
              <span class="tag-section__label">技能</span>
              <pre class="json-block">{{ formatJson(selectedCharacter.skills) }}</pre>
            </div>
          </NCard>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.world-detail-page {
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

.module-loading--large {
  min-height: 280px;
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
  border: 1px solid rgba(180, 142, 255, 0.25);
  border-radius: 999px;
  background: rgba(180, 142, 255, 0.1);
  color: var(--color-primary);
  font-size: 12px;
  margin-bottom: 12px;
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

.summary-grid,
.detail-grid,
.character-grid {
  display: grid;
  gap: 16px;
}

.summary-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 24px;
}

.detail-grid--world {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-grid--branch {
  grid-template-columns: 0.95fr 1.25fr;
}

.detail-grid--character-modal {
  grid-template-columns: 1fr 1fr;
}

.summary-card,
.detail-card {
  min-width: 0;
  background: rgba(22, 19, 31, 0.9);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.world-overview-card {
  grid-column: 1 / -1;
}

.world-overview-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.world-summary-card,
.world-structure-card {
  min-height: 100%;
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

.kv-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.kv-grid--compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.kv-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid rgba(180, 142, 255, 0.08);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.02);
}

.kv-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.kv-value {
  color: var(--color-text-body);
  line-height: 1.6;
  word-break: break-word;
}

.long-text {
  margin: 0;
  color: var(--color-text-desc);
  line-height: 1.8;
  white-space: pre-wrap;
}

.tag-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
}

.tag-section__label {
  font-size: 13px;
  color: var(--color-text-muted);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.tag-list--compact {
  justify-content: flex-end;
}

.pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}

.pill-item {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 34px;
  padding: 8px 12px;
  border: 1px solid rgba(180, 142, 255, 0.14);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text-body);
  line-height: 1.6;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  box-sizing: border-box;
}

.pill-list--success .pill-item {
  border-color: rgba(99, 226, 183, 0.2);
  background: rgba(99, 226, 183, 0.08);
}

.pill-list--warning .pill-item {
  border-color: rgba(255, 193, 7, 0.22);
  background: rgba(255, 193, 7, 0.08);
}

.pill-list--neutral .pill-item {
  border-color: rgba(180, 142, 255, 0.16);
  background: rgba(180, 142, 255, 0.06);
}

.text-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.text-list__item {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text-desc);
  line-height: 1.7;
}

.empty-hint {
  color: var(--color-text-muted);
  font-size: 13px;
}

.branch-tree {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.branch-tree__item {
  position: relative;
}

.branch-tree__line {
  position: absolute;
  left: 11px;
  top: 0;
  bottom: -10px;
  width: 1px;
  background: rgba(180, 142, 255, 0.22);
}

.branch-tree__content {
  position: relative;
  padding: 14px 14px 14px 28px;
  border: 1px solid rgba(180, 142, 255, 0.1);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.02);
}

.branch-tree__content::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 22px;
  width: 10px;
  height: 1px;
  background: rgba(180, 142, 255, 0.22);
}

.branch-tree__main {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.branch-tree__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-body);
}

.branch-tree__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.branch-card-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.branch-card,
.character-card {
  padding: 18px;
  border: 1px solid rgba(180, 142, 255, 0.1);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.02);
}

.branch-card__head,
.character-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.branch-card__title,
.character-card__title {
  margin: 0 0 6px;
  font-size: 18px;
  color: var(--color-text-body);
}

.branch-card__subtitle,
.character-card__subtitle {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.branch-card__desc,
.character-card__desc {
  margin: 14px 0;
  color: var(--color-text-desc);
  line-height: 1.8;
  white-space: pre-wrap;
}

.branch-card__actions,
.character-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.character-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.modal-section {
  margin-top: 20px;
}

.modal-section__title {
  margin: 0 0 10px;
  font-size: 15px;
  color: var(--color-text-body);
}

.json-block {
  margin: 0;
  padding: 14px;
  overflow: auto;
  border-radius: var(--radius-md);
  background: rgba(7, 6, 11, 0.7);
  color: var(--color-text-desc);
  font-size: 12px;
  line-height: 1.7;
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
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-grid--branch,
  .character-grid,
  .detail-grid--character-modal {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .world-overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .page-header,
  .module-header,
  .branch-card__head,
  .character-card__head {
    flex-direction: column;
  }

  .tag-list--compact {
    justify-content: flex-start;
  }

  .kv-grid,
  .kv-grid--compact,
  .world-overview-grid,
  .detail-grid--world,
  .summary-grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>
