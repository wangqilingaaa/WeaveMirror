<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NSelect, NButton, NSpace } from 'naive-ui'
import { useWorldStore } from '../stores/world'
import { useAuthStore } from '../stores/auth'
import { useAppStore } from '../stores/app'

const router = useRouter()
const route = useRoute()
const worldStore = useWorldStore()
const authStore = useAuthStore()
const appStore = useAppStore()

onMounted(async () => {
  await worldStore.fetchWorlds()
})

const activeKey = computed(() => {
  if (route.path.startsWith('/workshop')) return 'workshop'
  if (route.path.startsWith('/stage')) return 'stage'
  if (route.path.startsWith('/worldbook')) return 'worldbook'
  if (route.path.startsWith('/console')) return 'console'
  return ''
})

const menuOptions = computed(() => {
  const wid = worldStore.currentWorldId
  return [
    { key: 'workshop', label: '工坊' },
    { key: 'stage', label: '叙事舞台', disabled: !wid },
    { key: 'worldbook', label: '世界之书', disabled: !wid },
    { key: 'console', label: '控制台', disabled: !wid }
  ]
})

const handleMenuUpdate = (key: string) => {
  const wid = worldStore.currentWorldId
  if (key === 'workshop') {
    router.push('/workshop')
  } else if (wid) {
    router.push(`/${key}/${wid}`)
  }
}

const worldOptions = computed(() => {
  return worldStore.worlds.map(w => ({
    label: w.name,
    value: w.id
  }))
})

// 当切换顶部当前世界时，如果是需要依赖世界 ID 的页面，自动重定向到该世界的对应页面
watch(() => worldStore.currentWorldId, (newWid) => {
  if (newWid) {
    if (route.name === 'stage') router.push(`/stage/${newWid}`)
    if (route.name === 'worldbook') router.push(`/worldbook/${newWid}`)
    if (route.name === 'console') router.push(`/console/${newWid}`)
  }
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const themeOptions = [
  { label: '跟随系统', value: 'auto' },
  { label: '浅色模式', value: 'light' },
  { label: '深色模式', value: 'dark' }
]
</script>

<template>
  <n-layout has-sider style="height: 100vh;">
    <!-- 侧边栏 -->
    <n-layout-sider
      bordered
      collapse-mode="width"
      :width="240"
      :collapsed-width="64"
      show-trigger="bar"
    >
      <div style="height: 64px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; border-bottom: 1px solid var(--n-border-color);">
        World Weaver
      </div>
      <n-menu
        :value="activeKey"
        :options="menuOptions"
        @update:value="handleMenuUpdate"
      />
    </n-layout-sider>

    <n-layout>
      <!-- 顶部导航 -->
      <n-layout-header bordered style="height: 64px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between;">
        <n-space align="center">
          <span style="font-size: 14px; font-weight: 500;">当前世界：</span>
          <n-select
            v-model:value="worldStore.currentWorldId"
            :options="worldOptions"
            style="width: 240px"
            placeholder="请选择或创建一个世界"
          />
        </n-space>
        
        <n-space align="center">
          <span style="font-size: 14px; font-weight: 500;">主题：</span>
          <n-select
            :value="appStore.themeMode"
            @update:value="appStore.setThemeMode"
            :options="themeOptions"
            style="width: 120px"
          />
          <span v-if="authStore.user" style="margin-left: 16px;">你好, {{ authStore.user.username }}</span>
          <n-button @click="handleLogout" type="error" ghost size="small">退出登录</n-button>
        </n-space>
      </n-layout-header>

      <!-- 页面内容 -->
      <n-layout-content content-style="padding: 24px; min-height: calc(100vh - 64px);">
        <router-view></router-view>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>
