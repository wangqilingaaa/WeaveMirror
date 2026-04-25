<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { NScrollbar, NSpin, NIcon } from 'naive-ui'
import { useNarrativeStore } from '../../stores/narrative'

const narrativeStore = useNarrativeStore()
const scrollbarRef = ref<any>(null)

watch(() => narrativeStore.messages, () => {
  nextTick(() => {
    if (scrollbarRef.value) {
      scrollbarRef.value.scrollTo({ position: 'bottom', behavior: 'smooth' })
    }
  })
}, { deep: true })
</script>

<template>
  <div style="flex: 1; overflow: hidden; padding: 16px; background-color: var(--n-color);">
    <n-scrollbar ref="scrollbarRef" style="height: 100%;">
      <div style="max-width: 800px; margin: 0 auto; padding-bottom: 20px;">
        <div v-for="msg in narrativeStore.messages" :key="msg.id" style="margin-bottom: 24px;">
          <!-- 系统/传闻类型消息 -->
          <div v-if="msg.role === 'system'" style="display: flex; justify-content: center; margin: 16px 0;">
            <div style="padding: 10px 20px; background-color: var(--n-warning-color-suppl, rgba(255, 170, 0, 0.1)); border: 1px solid var(--n-warning-color, rgba(255, 170, 0, 0.3)); border-radius: 8px; color: var(--n-warning-color, #d46b08); font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; max-width: 80%;">
              <n-icon size="16">
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"><path d="M428.16 384.81c-16.71-33.84-48-81.25-96.69-106.18A145.45 145.45 0 0 0 352 192c0-82.52-70.19-150-155.85-150C108.83 42 40 109.48 40 192s68.83 150 156.15 150a149.33 149.33 0 0 0 50-8.52c42.17 23.36 67.8 62.7 82 93.33M200 128a32 32 0 1 1-32 32a32 32 0 0 1 32-32zm0 160a32 32 0 1 1 32-32a32 32 0 0 1-32 32zm80-80a32 32 0 1 1 32-32a32 32 0 0 1-32 32z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></path></svg>
              </n-icon>
              {{ msg.content }}
            </div>
          </div>
          
          <!-- 旁白类型消息 (独立显示) -->
          <div v-else-if="msg.role === 'narrator'" style="display: flex; justify-content: center; margin: 16px 0;">
            <div style="padding: 8px 16px; background-color: var(--n-color-modal); border-radius: 8px; color: var(--n-text-color-3); font-size: 13px; font-style: italic;">
              {{ msg.content }}
            </div>
          </div>
          
          <!-- 对话类型消息 -->
          <div v-else :style="{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }">
            <div 
              :style="{ 
                maxWidth: '75%', 
                padding: '14px 18px', 
                borderRadius: '16px', 
                backgroundColor: msg.role === 'user' ? 'var(--n-primary-color)' : 'var(--n-card-color)',
                color: msg.role === 'user' ? '#fff' : 'var(--n-text-color)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                lineHeight: '1.6',
                fontSize: '15px',
                borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px'
              }"
            >
              {{ msg.content }}
            </div>
          </div>
        </div>

        <!-- 正在输入提示 -->
        <div v-if="narrativeStore.isTyping" style="display: flex; margin-bottom: 24px; justify-content: flex-start;">
          <div style="padding: 12px 16px; border-radius: 16px; border-top-left-radius: 4px; background-color: var(--n-card-color); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <n-spin size="small" />
          </div>
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>
