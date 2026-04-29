<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NInput, NModal, NForm, NFormItem, useMessage } from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'
import { useAppStore } from '@/stores/app'
import { listWorldsApi, createWorldApi } from '@/api'
import type { World } from '@/types'

const router = useRouter()
const appStore = useAppStore()
const message = useMessage()

const worlds = ref<World[]>([])
const loading = ref(false)

const showCreateModal = ref(false)
const newWorldName = ref('')
const creating = ref(false)

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

async function handleCreateWorld() {
  if (!newWorldName.value.trim()) return
  creating.value = true
  try {
    await createWorldApi({ name: newWorldName.value.trim() })
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

function enterWorld(worldId: number) {
  router.push({ name: 'Stage', params: { worldId } })
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
          <h3 class="world-name">{{ world.name }}</h3>
          <p class="world-meta">
            {{ world.epoch }} 年 {{ world.current_year }} 年 ·
            <span class="world-meta-tag">{{ world.nsfw_enabled ? 'NSFW' : 'SFW' }}</span>
          </p>
          <p v-if="world.settings" class="world-settings">{{ world.settings }}</p>
        </div>

        <div class="create-card" @click="showCreateModal = true">
          <n-icon size="28">
            <AddOutline />
          </n-icon>
          <span class="create-text">创造新世界</span>
        </div>
      </div>
    </main>

    <NModal v-model:show="showCreateModal" title="创造新世界" preset="card" style="max-width: 420px">
      <NForm @submit.prevent="handleCreateWorld">
        <NFormItem label="世界名称" required>
          <NInput
            v-model:value="newWorldName"
            placeholder="给你的世界取一个名字"
            :disabled="creating"
            @keyup.enter="handleCreateWorld"
          />
        </NFormItem>
        <NButton type="primary" :loading="creating" block @click="handleCreateWorld">
          创造
        </NButton>
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

.world-name {
  margin: 0 0 8px;
  font-family: var(--font-title);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-body);
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

.world-settings {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-desc);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
</style>
