<script setup lang="ts">
import { computed, onErrorCaptured, onMounted } from 'vue'
import { NConfigProvider, NGlobalStyle, NMessageProvider, NDialogProvider, NSpin } from 'naive-ui'
import { useAppStore } from './stores/app'
import MessageApiSetter from './components/common/MessageApiSetter.vue'

const appStore = useAppStore()

const isDark = computed(() => {
  if (appStore.themeMode === 'auto') {
    return !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return appStore.themeMode === 'dark'
})

const theme = computed(() => (isDark.value ? null : null))

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

<style>
:root {
  --color-bg-deep: #07060b;
  --color-bg-main: #0e0c14;
  --color-bg-card: #16131f;
  --color-primary: #b48eff;
  --color-text-body: #eee8f5;
  --color-text-desc: #a99ec2;
  --color-text-muted: #6b607a;
  --color-border: rgba(180, 142, 255, 0.12);
  --color-border-hover: rgba(180, 142, 255, 0.3);
  --color-error: #f5717a;
  --color-tag-pink: #ff7eb3;
  --color-tag-cyan: #5ce0d8;

  --font-title: 'Noto Serif SC', 'Georgia', 'Times New Roman', serif;
  --font-body: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;

  --transition-fast: 200ms ease;
  --transition-normal: 300ms ease;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text-body);
  background-color: var(--color-bg-deep);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.app-provider {
  height: 100vh;
  width: 100vw;
}

.app-container {
  height: 100%;
  position: relative;
}

.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(7, 6, 11, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
