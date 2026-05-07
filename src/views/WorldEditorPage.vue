<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NSpin,
  NStatistic,
  NSpace,
  useMessage
} from 'naive-ui'
import { ArrowBackOutline, SparklesOutline, SaveOutline } from '@vicons/ionicons5'
import { createWorldApi, enhanceWorldSettingsApi, getWorldApi, updateWorldApi } from '@/api'
import WorldSettingsForm from '@/components/world/WorldSettingsForm.vue'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import type { World, WorldSettings } from '@/types'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const worldSettingsFormRef = ref<InstanceType<typeof WorldSettingsForm> | null>(null)

const pageLoading = ref(false)
const saving = ref(false)
const enhancing = ref(false)
const pageError = ref('')

const world = ref<World | null>(null)
const worldName = ref('')
const initialSettings = ref<WorldSettings>({})
const draftSettings = ref<WorldSettings>({})
const formVersion = ref(0)
const formRenderKey = ref(0)
const initialSnapshot = ref('')

const isCreateMode = computed(() => route.name === 'WorldCreate')
const worldId = computed(() => Number(route.params.worldId))
const redirectPath = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect ? redirect : ''
})

/**
 * 把详情页使用的扁平 World 数据转换回 settings 结构。
 * 页面继续复用原表单组件，因此需要先把后端对象恢复成表单认识的输入格式。
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

function getCurrentSnapshot(): string {
  return JSON.stringify({
    name: worldName.value.trim(),
    settingsDraft: worldSettingsFormRef.value?.getDraftSnapshot() ?? '',
    version: formVersion.value
  })
}

const pageTitle = computed(() => (isCreateMode.value ? '创建世界' : '编辑世界'))
const pageSubtitle = computed(() => {
  return isCreateMode.value
    ? '在独立页面中完整编排世界设定，创建后会直接进入世界详情页。'
    : '对现有世界进行分组编辑和统一维护，保存后自动返回来源页面。'
})

const validationMessage = computed(() => {
  if (!worldName.value.trim()) {
    return '世界名称不能为空，请先填写名称后再保存或使用 AI 优化。'
  }
  return ''
})

const worldStats = computed(() => ({
  themeCount: draftSettings.value.themes?.filter(Boolean).length ?? 0,
  ruleCount: draftSettings.value.core_rules?.filter(Boolean).length ?? 0,
  regionCount: draftSettings.value.regions?.filter((item) => item.name?.trim()).length ?? 0
}))

const isDirty = computed(() => {
  if (pageLoading.value) return false
  return getCurrentSnapshot() !== initialSnapshot.value
})

useUnsavedChangesGuard(isDirty, '世界设定尚未保存，确定离开当前页面吗？')

async function syncInitialSnapshot() {
  await nextTick()
  draftSettings.value = worldSettingsFormRef.value?.getSettings() ?? {}
  initialSnapshot.value = getCurrentSnapshot()
}

function handleSettingsChange() {
  formVersion.value += 1
  draftSettings.value = worldSettingsFormRef.value?.getSettings() ?? {}
}

function navigateBack() {
  if (redirectPath.value) {
    void router.push(redirectPath.value)
    return
  }

  if (isCreateMode.value) {
    void router.push({ name: 'Workshop' })
    return
  }

  void router.push({ name: 'WorldDetail', params: { worldId: worldId.value } })
}

async function loadPage() {
  pageError.value = ''

  if (isCreateMode.value) {
    world.value = null
    worldName.value = ''
    initialSettings.value = {}
    draftSettings.value = {}
    formRenderKey.value += 1
    pageLoading.value = false
    await syncInitialSnapshot()
    return
  }

  if (!Number.isInteger(worldId.value) || worldId.value <= 0) {
    pageError.value = '世界 ID 无效，无法进入编辑页面。'
    return
  }

  pageLoading.value = true
  try {
    const detail = await getWorldApi(worldId.value)
    world.value = detail
    worldName.value = detail.name
    initialSettings.value = worldToSettings(detail)
    draftSettings.value = initialSettings.value
    formRenderKey.value += 1
  } catch (err: any) {
    pageError.value = err?.message || '加载世界信息失败'
  } finally {
    pageLoading.value = false
  }

  if (!pageError.value) {
    await syncInitialSnapshot()
  }
}

async function handleEnhance() {
  const name = worldName.value.trim()
  if (!name) {
    message.warning('请先填写世界名称')
    return
  }

  const settings = worldSettingsFormRef.value?.getSettings() ?? {}
  if (Object.keys(settings).length === 0) {
    message.warning('请先填写至少一项世界设定')
    return
  }

  enhancing.value = true
  try {
    const response = await enhanceWorldSettingsApi({
      world_name: name,
      settings
    })
    worldSettingsFormRef.value?.reset(response.enhanced_settings)
    draftSettings.value = response.enhanced_settings
    formVersion.value += 1
    message.success('AI 已完成世界设定优化')
  } catch (err: any) {
    message.error(err?.message || 'AI 优化世界设定失败')
  } finally {
    enhancing.value = false
  }
}

async function handleSave() {
  const name = worldName.value.trim()
  if (!name) {
    message.warning('世界名称不能为空')
    return
  }

  saving.value = true
  try {
    const settings = worldSettingsFormRef.value?.getSettings() ?? {}

    if (isCreateMode.value) {
      const created = await createWorldApi({
        name,
        settings
      })
      world.value = created
      draftSettings.value = settings
      await syncInitialSnapshot()
      message.success('世界已创建')
      await router.replace({ name: 'WorldDetail', params: { worldId: created.id } })
      return
    }

    const updated = await updateWorldApi(worldId.value, {
      name,
      settings
    })
    world.value = updated
    draftSettings.value = settings
    await syncInitialSnapshot()
    message.success('世界信息已更新')
    navigateBack()
  } catch (err: any) {
    message.error(err?.message || '保存世界信息失败')
  } finally {
    saving.value = false
  }
}

watch(
  () => [route.name, route.params.worldId] as const,
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
          <NButton secondary :loading="enhancing" :disabled="saving || !!validationMessage" @click="handleEnhance">
            <template #icon>
              <NIcon><SparklesOutline /></NIcon>
            </template>
            AI 优化
          </NButton>
          <NButton type="primary" :loading="saving" :disabled="!!validationMessage" @click="handleSave">
            <template #icon>
              <NIcon><SaveOutline /></NIcon>
            </template>
            {{ isCreateMode ? '创建世界' : '保存修改' }}
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
                <span class="status-label">模式</span>
                <span class="status-value">{{ isCreateMode ? '新建' : '编辑' }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">未保存修改</span>
                <span class="status-value">{{ isDirty ? '有' : '无' }}</span>
              </div>
              <div class="status-item">
                <span class="status-label">返回目标</span>
                <span class="status-value">{{ redirectPath || (isCreateMode ? '/workshop' : `/worlds/${worldId}`) }}</span>
              </div>
            </div>
          </NCard>

          <div class="stat-grid">
            <NCard class="stat-card">
              <NStatistic label="主题数" :value="worldStats.themeCount" />
            </NCard>
            <NCard class="stat-card">
              <NStatistic label="规则数" :value="worldStats.ruleCount" />
            </NCard>
            <NCard class="stat-card">
              <NStatistic label="区域数" :value="worldStats.regionCount" />
            </NCard>
          </div>

          <NAlert v-if="validationMessage" type="warning" :show-icon="false">
            {{ validationMessage }}
          </NAlert>
          <NAlert v-else type="success" :show-icon="false">
            世界名称已填写，可继续使用 AI 优化或直接保存。
          </NAlert>
        </aside>

        <section class="editor-main">
          <NCard class="editor-card">
            <template #header>基础信息</template>
            <NForm label-placement="top">
              <NFormItem label="世界名称" required>
                <NInput
                  v-model:value="worldName"
                  placeholder="给你的世界取一个清晰、可识别的名字"
                  :status="validationMessage ? 'error' : undefined"
                />
                <div class="field-hint">
                  世界名称会作为当前页面标题和后续管理入口的主要识别字段。
                </div>
              </NFormItem>
            </NForm>
          </NCard>

          <NCard class="editor-card">
            <template #header>详细设定</template>
            <WorldSettingsForm
              :key="formRenderKey"
              ref="worldSettingsFormRef"
              :settings="initialSettings"
              page-mode
              @change="handleSettingsChange"
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
    radial-gradient(circle at top left, rgba(180, 142, 255, 0.14), transparent 26%),
    var(--color-bg-deep);
}

.editor-shell {
  max-width: 1440px;
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
  border: 1px solid rgba(180, 142, 255, 0.25);
  background: rgba(180, 142, 255, 0.08);
  color: var(--color-primary);
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
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-hint {
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.6;
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
