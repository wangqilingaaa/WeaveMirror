<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NIcon, NText } from 'naive-ui'
import { useNarrativeStore } from '../../stores/narrative'

const narrativeStore = useNarrativeStore()

const show = computed(() => !!narrativeStore.currentRippleBrief)
const brief = computed(() => narrativeStore.currentRippleBrief)

const handleClose = () => {
  narrativeStore.clearRippleBrief()
}
</script>

<template>
  <Transition name="ripple-slide">
    <div v-if="show" class="ripple-brief-container">
      <n-card
        closable
        @close="handleClose"
        :bordered="true"
        class="ripple-card"
        size="small"
      >
        <template #header>
          <div class="ripple-header">
            <n-icon size="20" color="#2080f0" class="ripple-icon">
              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"><path d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192s192-86 192-192z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"></path><path d="M350.67 150.93l-117.2 115.36a16 16 0 0 1-22.77-.12l-65.74-66.51" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></path><path d="M256 96a160 160 0 1 0 160 160A160 160 0 0 0 256 96z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"></path></svg>
            </n-icon>
            <n-text strong>{{ brief?.title || '涟漪影响' }}</n-text>
          </div>
        </template>
        <div class="ripple-content">
          {{ brief?.content }}
        </div>
      </n-card>
    </div>
  </Transition>
</template>

<style scoped>
.ripple-brief-container {
  position: fixed;
  top: 80px;
  right: 24px;
  z-index: 9999;
  width: 320px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.ripple-card {
  border-radius: 8px;
  background: var(--n-color);
  backdrop-filter: blur(10px);
}

.ripple-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ripple-icon {
  animation: pulse 2s infinite;
}

.ripple-content {
  font-size: 14px;
  color: var(--n-text-color-3);
  line-height: 1.5;
}

/* 浮层动画 */
.ripple-slide-enter-active,
.ripple-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.ripple-slide-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.ripple-slide-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
