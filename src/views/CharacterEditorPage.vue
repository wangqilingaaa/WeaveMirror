<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NCard,
  NIcon,
  NSpin,
  NStatistic,
  NSpace,
  useMessage
} from 'naive-ui'
import { ArrowBackOutline, SaveOutline, SparklesOutline } from '@vicons/ionicons5'
import {
  createCharacterApi,
  generateCharacterApi,
  getCharacterApi,
  getWorldApi,
  updateCharacterApi
} from '@/api'
import CharacterEditorForm from '@/components/worldbook/CharacterEditorForm.vue'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import type { Character, CharacterInput, World } from '@/types'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const characterFormRef = ref<InstanceType<typeof CharacterEditorForm> | null>(null)

const pageLoading = ref(false)
const pageError = ref('')
const saving = ref(false)
const enhancing = ref(false)

const world = ref<World | null>(null)
const character = ref<Character | null>(null)
const validationError = ref('')
const livePayload = ref<CharacterInput | null>(null)
const formVersion = ref(0)
const initialSnapshot = ref('')

const worldId = computed(() => Number(route.params.worldId))
const characterId = computed(() => Number(route.params.characterId))
const isCreateMode = computed(() => route.name === 'CharacterCreate')
const redirectPath = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect ? redirect : ''
})

function getCurrentSnapshot(): string {
  return JSON.stringify({
    draft: characterFormRef.value?.getDraftSnapshot() ?? '',
    version: formVersion.value
  })
}

const isDirty = computed(() => {
  if (pageLoading.value) return false
  return getCurrentSnapshot() !== initialSnapshot.value
})

const pageTitle = computed(() => (isCreateMode.value ? '创建角色' : '编辑角色'))
const pageSubtitle = computed(() => {
  const worldName = world.value?.name || `世界 #${worldId.value}`
  return isCreateMode.value
    ? `为 ${worldName} 创建新的角色档案，保存后自动回到来源页面。`
    : `对 ${worldName} 中的现有角色进行维护，保留原有接口和数据结构。`
})

const formStats = computed(() => ({
  aliasCount: livePayload.value?.name_aliases?.length ?? 0,
  skillCount: livePayload.value?.skills?.length ?? 0,
  tagCount: livePayload.value?.personality_traits?.tags?.length ?? 0
}))

useUnsavedChangesGuard(isDirty, '角色内容尚未保存，确定离开当前页面吗？')

async function syncInitialSnapshot() {
  await nextTick()
  refreshValidationState()
  initialSnapshot.value = getCurrentSnapshot()
}

function refreshValidationState() {
  try {
    livePayload.value = characterFormRef.value?.buildPayload() ?? null
    validationError.value = ''
  } catch (err: any) {
    livePayload.value = null
    validationError.value = err?.message || '角色表单存在未完成或格式错误的字段'
  }
}

function handleFormChange() {
  formVersion.value += 1
  refreshValidationState()
}

function navigateBack() {
  if (redirectPath.value) {
    void router.push(redirectPath.value)
    return
  }

  void router.push({ name: 'WorldDetail', params: { worldId: worldId.value } })
}

async function loadPage() {
  pageError.value = ''

  if (!Number.isInteger(worldId.value) || worldId.value <= 0) {
    pageError.value = '世界 ID 无效，无法进入角色编辑页面。'
    return
  }

  if (!isCreateMode.value && (!Number.isInteger(characterId.value) || characterId.value <= 0)) {
    pageError.value = '角色 ID 无效，无法进入编辑页面。'
    return
  }

  pageLoading.value = true
  try {
    const tasks: Promise<unknown>[] = [getWorldApi(worldId.value).then((data) => { world.value = data })]

    if (isCreateMode.value) {
      character.value = null
    } else {
      tasks.push(getCharacterApi(worldId.value, characterId.value).then((data) => { character.value = data }))
    }

    await Promise.all(tasks)
    await syncInitialSnapshot()
  } catch (err: any) {
    pageError.value = err?.message || '加载角色编辑信息失败'
  } finally {
    pageLoading.value = false
  }
}

async function handleEnhance() {
  let payload: CharacterInput

  try {
    payload = characterFormRef.value?.buildPayload() ?? {}
  } catch (err: any) {
    validationError.value = err?.message || '请先完善角色基础信息后再使用 AI'
    message.warning(validationError.value)
    return
  }

  enhancing.value = true
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
    handleFormChange()
    message.success('AI 已生成并回填角色设定')
  } catch (err: any) {
    message.error(err?.message || 'AI 生成角色失败')
  } finally {
    enhancing.value = false
  }
}

async function handleSave() {
  let payload: CharacterInput

  try {
    payload = characterFormRef.value?.buildPayload() ?? {}
  } catch (err: any) {
    validationError.value = err?.message || '角色表单存在未完成或格式错误的字段'
    message.warning(validationError.value)
    return
  }

  saving.value = true
  try {
    if (isCreateMode.value) {
      await createCharacterApi(worldId.value, payload)
      message.success('角色已创建')
    } else {
      await updateCharacterApi(worldId.value, characterId.value, payload)
      message.success('角色已更新')
    }

    livePayload.value = payload
    await syncInitialSnapshot()
    navigateBack()
  } catch (err: any) {
    message.error(err?.message || '保存角色失败')
  } finally {
    saving.value = false
  }
}

watch(
  () => [route.name, route.params.worldId, route.params.characterId] as const,
  () => {
    void loadPage()
  },
  { immediate: true }
)
</script>

<template>
  <div class="editor-page">
    <div class="editor-shell">
      <header class="editor-header">
        <div class="editor-header__main">
          <div class="editor-badge">{{ pageTitle }}</div>
          <h1 class="editor-title">{{ pageTitle }}</h1>
          <p class="editor-subtitle">{{ pageSubtitle }}</p>
        </div>

        <NSpace>
          <NButton secondary @click="navigateBack">
            <template #icon>
              <NIcon><ArrowBackOutline /></NIcon>
            </template>
            返回
          </NButton>
          <NButton secondary :loading="enhancing" :disabled="saving" @click="handleEnhance">
            <template #icon>
              <NIcon><SparklesOutline /></NIcon>
            </template>
            AI 生成
          </NButton>
          <NButton type="primary" :loading="saving" :disabled="!!validationError" @click="handleSave">
            <template #icon>
              <NIcon><SaveOutline /></NIcon>
            </template>
            {{ isCreateMode ? '创建角色' : '保存修改' }}
          </NButton>
        </NSpace>
      </header>

      <div v-if="pageLoading" class="state-panel state-panel--loading">
        <NSpin size="large" />
      </div>

      <div v-else-if="pageError" class="state-panel">
        <NAlert type="error" :show-icon="false">
          {{ pageError }}
        </NAlert>
        <NSpace>
          <NButton secondary @click="loadPage">重新加载</NButton>
          <NButton @click="navigateBack">返回上一页</NButton>
        </NSpace>
      </div>

      <div v-else class="editor-layout">
        <aside class="editor-side">
          <NCard class="editor-side-card">
            <template #header>编辑状态</template>
            <div class="status-list">
              <div class="status-item">
                <span class="status-label">世界</span>
                <span class="status-value">{{ world?.name || `世界 #${worldId}` }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">模式</span>
                <span class="status-value">{{ isCreateMode ? '新建' : '编辑' }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">未保存修改</span>
                <span class="status-value">{{ isDirty ? '有' : '无' }}</span>
              </div>
            </div>
          </NCard>

          <div class="stat-grid">
            <NCard class="stat-card">
              <NStatistic label="别名数" :value="formStats.aliasCount" />
            </NCard>
            <NCard class="stat-card">
              <NStatistic label="技能数" :value="formStats.skillCount" />
            </NCard>
            <NCard class="stat-card">
              <NStatistic label="人格标签" :value="formStats.tagCount" />
            </NCard>
          </div>

          <NAlert v-if="validationError" type="warning" :show-icon="false">
            {{ validationError }}
          </NAlert>
          <NAlert v-else type="success" :show-icon="false">
            当前表单校验通过，可直接保存或继续补充更完整的角色设定。
          </NAlert>
        </aside>

        <section class="editor-main">
          <NCard class="editor-card">
            <template #header>角色档案</template>
            <CharacterEditorForm
              ref="characterFormRef"
              :world-id="worldId"
              :character="character"
              :loading="false"
              @change="handleFormChange"
            />
          </NCard>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.editor-page {
  min-height: 100vh;
  padding: 32px;
  background:
    radial-gradient(circle at top left, rgba(120, 200, 255, 0.12), transparent 24%),
    var(--color-bg-deep);
}

.editor-shell {
  max-width: 1600px;
  margin: 0 auto;
}

.editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.editor-header__main {
  max-width: 760px;
}

.editor-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(120, 200, 255, 0.25);
  background: rgba(120, 200, 255, 0.08);
  color: #8ed7ff;
  font-size: 12px;
  margin-bottom: 12px;
}

.editor-title {
  margin: 0 0 8px;
  font-family: var(--font-title);
  font-size: 34px;
  color: var(--color-text-body);
}

.editor-subtitle {
  margin: 0;
  color: var(--color-text-desc);
  line-height: 1.75;
}

.state-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
}

.state-panel--loading {
  min-height: 360px;
  align-items: center;
  justify-content: center;
}

.editor-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 20px;
}

.editor-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-side-card,
.editor-card,
.stat-card {
  border-radius: var(--radius-lg);
  background: rgba(15, 18, 34, 0.82);
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.status-label {
  color: var(--color-text-muted);
  font-size: 13px;
}

.status-value {
  color: var(--color-text-body);
  font-size: 13px;
  text-align: right;
  word-break: break-word;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 12px;
}

.editor-main {
  min-width: 0;
}

@media (max-width: 1180px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .editor-page {
    padding: 20px;
  }

  .editor-header {
    flex-direction: column;
  }
}
</style>
