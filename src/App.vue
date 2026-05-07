<script setup lang="ts">
import { computed, onErrorCaptured, onMounted } from 'vue'
import {
  NConfigProvider,
  NGlobalStyle,
  NMessageProvider,
  NDialogProvider,
  NSpin,
  darkTheme,
  zhCN,
  dateZhCN
} from 'naive-ui'
import { useAppStore } from './stores/app'
import MessageApiSetter from './components/common/MessageApiSetter.vue'

const appStore = useAppStore()

const isDark = computed(() => {
  if (appStore.themeMode === 'auto') {
    return !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return appStore.themeMode === 'dark'
})

const theme = computed(() => (isDark.value ? darkTheme : null))

onMounted(() => {
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (appStore.themeMode === 'auto') {
        appStore.setThemeMode('auto')
      }
    })
  }
})

onErrorCaptured((err, _instance, info) => {
  console.error('[Global Error Boundary]', err, info)
  appStore.setGlobalError(err as Error)
  if (window.$message) {
    window.$message.error('发生渲染或交互错误，请尝试刷新页面。')
  }
  return false
})
</script>

<template>
  <n-config-provider
    :theme="theme"
    :locale="zhCN"
    :date-locale="dateZhCN"
    class="app-provider"
  >
    <n-global-style />
    <n-dialog-provider>
      <n-message-provider>
        <MessageApiSetter>
          <div class="app-container">
            <router-view v-slot="{ Component }">
              <transition name="page-fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
            <transition name="fade">
              <div v-if="appStore.isGlobalLoading" class="global-loading-overlay">
                <n-spin size="large" />
              </div>
            </transition>
          </div>
        </MessageApiSetter>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<style lang="scss">
.app-provider {
  height: 100vh;
  width: 100vw;
  background-color: var(--color-bg-deep);
}

.app-container {
  height: 100%;
  position: relative;
  background-color: var(--color-bg-deep);
}
</style>
