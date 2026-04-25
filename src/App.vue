<script setup lang="ts">
import { computed, onErrorCaptured, onMounted } from 'vue'
import { NConfigProvider, NGlobalStyle, NMessageProvider, NDialogProvider, NSpin, darkTheme } from 'naive-ui'
import { useAppStore } from './stores/app'
import MessageApiSetter from './components/common/MessageApiSetter.vue'

const appStore = useAppStore()

// Theme configuration
const isDark = computed(() => {
  if (appStore.themeMode === 'auto') {
    return !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return appStore.themeMode === 'dark'
})

const theme = computed(() => (isDark.value ? darkTheme : null))

// Setup system theme detection
onMounted(() => {
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (appStore.themeMode === 'auto') {
        // Force reactivity update if in auto mode
        appStore.setThemeMode('auto')
      }
    })
  }
})

// Global Error Boundary
onErrorCaptured((err, _instance, info) => {
  console.error('[Global Error Boundary]', err, info)
  // Save to global error state if needed, or trigger a dialog/message
  appStore.setGlobalError(err as Error)
  if (window.$message) {
    window.$message.error('发生渲染或交互错误，请尝试刷新页面。')
  }
  return false // prevent error from propagating further if handled
})
</script>

<template>
  <n-config-provider :theme="theme" class="app-provider">
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
            
            <!-- Global Loading Indicator -->
            <transition name="fade">
              <div v-if="appStore.isGlobalLoading" class="global-loading-overlay">
                <n-spin size="large" description="正在加载中，请稍候..." />
              </div>
            </transition>
          </div>
        </MessageApiSetter>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<style>
/* CSS Variable setup and smooth transitions */
:root {
  --app-transition-duration: 0.5s;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  scroll-behavior: smooth; /* 实现滚动行为的平滑优化 */
}

/* 焦点状态键盘可访问性 */
*:focus-visible {
  outline: 2px solid #2080f0;
  outline-offset: 2px;
}

.app-provider {
  height: 100vh;
  width: 100vw;
  transition: background-color var(--app-transition-duration) ease, color var(--app-transition-duration) ease;
}

.app-container {
  height: 100%;
  position: relative;
}

/* Global loading overlay */
.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

html.dark .global-loading-overlay {
  background-color: rgba(0, 0, 0, 0.6);
}

/* Page transitions */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Empty/Loading Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 8px Grid Utility Classes */
.mb-1 { margin-bottom: 8px; }
.mb-2 { margin-bottom: 16px; }
.mb-3 { margin-bottom: 24px; }
.mb-4 { margin-bottom: 32px; }

.p-1 { padding: 8px; }
.p-2 { padding: 16px; }
.p-3 { padding: 24px; }
.p-4 { padding: 32px; }
</style>
