<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton, NInput, NModal, NForm, NFormItem, useMessage, NSpace,
  NIcon
} from 'naive-ui'
import { AddOutline, BookOutline, SettingsOutline } from '@vicons/ionicons5'
import { useAppStore } from '@/stores/app'
import { listWorldsApi, createWorldApi, getWorldApi, updateWorldApi, enhanceWorldSettingsApi } from '@/api'
import WorldSettingsForm from '@/components/world/WorldSettingsForm.vue'
import type { World, WorldSettings } from '@/types'

const router = useRouter()
const appStore = useAppStore()
const message = useMessage()

const worlds = ref<World[]>([])
const loading = ref(false)

// ==================== 创建世界 ====================

const showCreateModal = ref(false)
const newWorldName = ref('')
const creating = ref(false)
const enhancing = ref(false)
const createFormRef = ref<InstanceType<typeof WorldSettingsForm> | null>(null)

// ==================== 编辑世界 ====================

const showEditModal = ref(false)
const editingWorld = ref<World | null>(null)
const editWorldName = ref('')
const editing = ref(false)
const editFormRef = ref<InstanceType<typeof WorldSettingsForm> | null>(null)

// ==================== 数据加载 ====================

async function loadWorlds() {
  loading.value = true
  appStore.setGlobalLoading(true)
  try {
    const data = await listWorldsApi()
    worlds.value = data.worlds
  } catch (err: any) {
    message.error(err?.message || '加载世界观列表失败')
  } finally {
    loading.value = false
    appStore.setGlobalLoading(false)
  }
}

// ==================== 创建逻辑 ====================

async function handleCreateWorld() {
  if (!newWorldName.value.trim()) return
  creating.value = true
  try {
    const settings = createFormRef.value?.getSettings() ?? {}
    await createWorldApi({
      name: newWorldName.value.trim(),
      settings
    })
    message.success('世界观已创建')
    showCreateModal.value = false
    newWorldName.value = ''
    await loadWorlds()
  } catch (err: any) {
    message.error(err?.message || '创建失败')
  } finally {
    creating.value = false
  }
}

function openCreateModal() {
  newWorldName.value = ''
  showCreateModal.value = true
  createFormRef.value?.reset()
}

// ==================== AI 增强 ====================

async function handleCreateEnhance() {
  if (!newWorldName.value.trim()) {
    message.warning('请先输入世界名称')
    return
  }
  const settings = createFormRef.value?.getSettings() ?? {}
  if (Object.keys(settings).length === 0) {
    message.warning('请先填写一些设定内容')
    return
  }
  enhancing.value = true
  try {
    const resp = await enhanceWorldSettingsApi({
      world_name: newWorldName.value.trim(),
      settings
    })
    createFormRef.value?.reset(resp.enhanced_settings)
    message.success('AI 优化完成，设定已更新')
  } catch (err: any) {
    message.error(err?.message || 'AI 优化失败')
  } finally {
    enhancing.value = false
  }
}

async function handleEditEnhance() {
  if (!editWorldName.value.trim()) return
  const settings = editFormRef.value?.getSettings() ?? {}
  if (Object.keys(settings).length === 0) {
    message.warning('请先填写一些设定内容')
    return
  }
  enhancing.value = true
  try {
    const resp = await enhanceWorldSettingsApi({
      world_name: editWorldName.value.trim(),
      settings
    })
    // 更新 editingWorld，watch 会同步到表单
    if (editingWorld.value) {
      editingWorld.value = {
        ...editingWorld.value,
        ...resp.enhanced_settings
      }
    }
    message.success('AI 优化完成，设定已更新')
  } catch (err: any) {
    message.error(err?.message || 'AI 优化失败')
  } finally {
    enhancing.value = false
  }
}

// ==================== 编辑逻辑 ====================

/** 将扁平 World 字段转换为 WorldSettings 结构 */
function worldToSettings(world: World): WorldSettings {
  return {
    description: world.description,
    epoch: world.epoch,
    current_year: world.current_year,
    core_rules: world.core_rules,
    themes: world.themes,
    tags: world.tags,
    magic_system: world.magic_system,
    tech_level: world.tech_level,
    economy_type: world.economy_type,
    government: world.government,
    religion: world.religion,
    regions: world.regions,
    factions: world.factions,
    major_cities: world.major_cities,
    races: world.races,
    nsfw_enabled: world.nsfw_enabled,
    evolution_enabled: world.evolution_enabled,
    metadata: world.metadata
  }
}

async function openEditModal(worldId: number, event: MouseEvent) {
  event.stopPropagation()
  try {
    const world = await getWorldApi(worldId)
    editingWorld.value = world
    editWorldName.value = world.name
    showEditModal.value = true
    // WorldSettingsForm 的 watch 会自动同步 settings prop 到表单
  } catch (err: any) {
    message.error(err?.message || '加载世界观详情失败')
  }
}

async function handleEditWorld() {
  if (!editingWorld.value) return
  editing.value = true
  try {
    const settings = editFormRef.value?.getSettings() ?? {}
    await updateWorldApi(editingWorld.value.id, {
      name: editWorldName.value.trim() || undefined,
      settings
    })
    message.success('世界观已更新')
    showEditModal.value = false
    editingWorld.value = null
    await loadWorlds()
  } catch (err: any) {
    message.error(err?.message || '更新失败')
  } finally {
    editing.value = false
  }
}

// ==================== 导航 ====================

function enterWorld(worldId: number) {
  // 进入工坊卡片时优先进入完整的世界详情页，方便在一个入口下管理设定、分支和角色。
  router.push({ name: 'WorldDetail', params: { worldId } })
}

function openWorldBook(worldId: number, event: MouseEvent) {
  event.stopPropagation()
  // 原“世界之书”按钮也统一跳到新的聚合详情页，避免用户在多个页面之间来回切换。
  router.push({ name: 'WorldDetail', params: { worldId } })
}

function handleLogout() {
  appStore.logout()
  router.push({ name: 'Login' })
}

onMounted(loadWorlds)
</script>

<template>
  <div class="workshop-page">
    <header class="top-bar">
      <div class="top-bar-left">
        <svg class="top-bar-icon" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
            fill="currentColor"
          />
        </svg>
        <span class="top-bar-title">织世镜 · 创作工坊</span>
      </div>
      <div class="top-bar-right">
        <span class="user-greeting">{{ appStore.currentUser?.username }}</span>
        <NButton text class="btn-logout" @click="handleLogout">
          退出
        </NButton>
      </div>
    </header>

    <main class="main-content">
      <section class="welcome-section">
        <h2 class="welcome-title">你的世界</h2>
        <p class="welcome-desc">选择或创建一个世界观，开始编织故事。</p>
      </section>

      <div class="world-grid">
        <div
          v-for="world in worlds"
          :key="world.id"
          class="world-card"
          @click="enterWorld(world.id)"
        >
          <div class="world-card-head">
            <h3 class="world-name">{{ world.name }}</h3>
            <NButton
              text
              size="small"
              class="btn-edit"
              @click="openEditModal(world.id, $event)"
            >
              <template #icon>
                <n-icon size="18"><SettingsOutline /></n-icon>
              </template>
            </NButton>
          </div>
          <p class="world-meta">
            {{ world.epoch || '未知纪元' }} {{ world.current_year ? world.current_year + ' 年' : '' }} ·
            <span class="world-meta-tag">{{ world.nsfw_enabled ? 'NSFW' : 'SFW' }}</span>
          </p>
          <p v-if="world.description" class="world-desc">{{ world.description }}</p>
          <div v-if="world.tags?.length" class="world-tags">
            <span v-for="tag in world.tags.slice(0, 3)" :key="tag" class="world-tag">{{ tag }}</span>
          </div>
          <div class="world-actions">
            <NButton
              size="small"
              secondary
              class="btn-worldbook"
              @click="openWorldBook(world.id, $event)"
            >
              <template #icon>
                <n-icon size="16"><BookOutline /></n-icon>
              </template>
              世界详情
            </NButton>
          </div>
        </div>

        <div class="create-card" @click="openCreateModal">
          <n-icon size="28">
            <AddOutline />
          </n-icon>
          <span class="create-text">创造新世界</span>
        </div>
      </div>
    </main>

    <!-- ==================== 创建世界模态框 ==================== -->
    <NModal
      v-model:show="showCreateModal"
      title="创造新世界"
      preset="card"
      style="max-width: 600px"
      :mask-closable="false"
    >
      <NForm @submit.prevent="handleCreateWorld">
        <NFormItem label="世界名称" required>
          <NInput
            v-model:value="newWorldName"
            placeholder="给你的世界取一个名字"
            :disabled="creating"
            @keyup.enter="handleCreateWorld"
          />
        </NFormItem>

        <WorldSettingsForm
          ref="createFormRef"
          :enhancing="enhancing"
          @enhance="handleCreateEnhance"
        />

        <NSpace justify="end" style="margin-top: 20px">
          <NButton @click="showCreateModal = false" :disabled="creating">
            取消
          </NButton>
          <NButton type="primary" :loading="creating" @click="handleCreateWorld">
            创造世界
          </NButton>
        </NSpace>
      </NForm>
    </NModal>

    <!-- ==================== 编辑世界模态框 ==================== -->
    <NModal
      v-model:show="showEditModal"
      title="编辑世界观"
      preset="card"
      style="max-width: 600px"
      :mask-closable="false"
    >
      <NForm @submit.prevent="handleEditWorld">
        <NFormItem label="世界名称">
          <NInput
            v-model:value="editWorldName"
            placeholder="修改世界名称"
            :disabled="editing"
          />
        </NFormItem>

        <WorldSettingsForm
          ref="editFormRef"
          :settings="editingWorld ? worldToSettings(editingWorld) : undefined"
          :enhancing="enhancing"
          @enhance="handleEditEnhance"
        />

        <NSpace justify="end" style="margin-top: 20px">
          <NButton @click="showEditModal = false" :disabled="editing">
            取消
          </NButton>
          <NButton type="primary" :loading="editing" @click="handleEditWorld">
            保存修改
          </NButton>
        </NSpace>
      </NForm>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.workshop-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-deep);
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 32px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg-card);
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-bar-icon {
  width: 28px;
  height: 28px;
  color: var(--color-primary);
}

.top-bar-title {
  font-family: var(--font-title);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--color-text-body);
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-greeting {
  font-size: 14px;
  color: var(--color-text-desc);
}

.btn-logout {
  font-size: 13px;
  color: var(--color-text-muted);
  transition: color var(--transition-fast);

  &:hover {
    color: var(--color-error) !important;
  }
}

.main-content {
  flex: 1;
  padding: 32px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.welcome-section {
  margin-bottom: 32px;
}

.welcome-title {
  margin: 0 0 6px;
  font-family: var(--font-title);
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text-body);
}

.welcome-desc {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-desc);
}

.world-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.world-card {
  position: relative;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 24px;
  cursor: pointer;
  transition: border-color var(--transition-fast), transform var(--transition-fast);

  &:hover {
    border-color: var(--color-border-hover);
    transform: translateY(-2px);
  }
}

.world-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.world-name {
  margin: 0;
  font-family: var(--font-title);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-body);
}

.btn-edit {
  flex-shrink: 0;
  color: var(--color-text-desc);
  opacity: 0.75;
  transition: opacity var(--transition-fast), color var(--transition-fast);

  &:hover {
    opacity: 1;
    color: var(--color-primary) !important;
  }
}

.world-meta {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 4px;
}

.world-meta-tag {
  font-size: 13px;
  color: var(--color-primary);
}

.world-desc {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-desc);
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.world-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.world-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.btn-worldbook {
  color: var(--color-text-desc);

  &:hover {
    color: var(--color-primary) !important;
  }
}

.world-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
  background-color: rgba(180, 142, 255, 0.1);
  color: var(--color-primary);
  line-height: 1.6;
}

.create-card {
  background-color: transparent;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  cursor: pointer;
  gap: 8px;

  &:hover {
    border-color: var(--color-primary);
    background-color: rgba(180, 142, 255, 0.04);
  }

  :deep(.n-icon) {
    color: var(--color-text-muted);
    font-size: 28px;
  }

  &:hover :deep(.n-icon) {
    color: var(--color-primary);
  }
}

.create-text {
  font-size: 14px;
  color: var(--color-text-muted);
}

// ==================== 模态框样式 ====================
:deep(.n-modal) {
  max-height: 85vh;
  display: flex;
  flex-direction: column;

  .n-card-header {
    flex-shrink: 0;
  }

  .n-card__content {
    flex: 1;
    overflow: hidden;
  }
}
</style>
