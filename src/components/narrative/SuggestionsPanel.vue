<script setup lang="ts">
import { computed } from 'vue'
import { NSpace, NButton, useThemeVars } from 'naive-ui'
import { useNarrativeStore } from '../../stores/narrative'

const narrativeStore = useNarrativeStore()
const themeVars = useThemeVars()

const emit = defineEmits<{
  (e: 'select', option: string): void
}>()

// 获取最后一条消息（如果是 AI 的消息，且有 options）
const latestOptions = computed(() => {
  const msgs = narrativeStore.messages
  if (msgs.length === 0) return []
  
  const lastMsg = msgs[msgs.length - 1]
  if (lastMsg.role === 'assistant' && lastMsg.options && lastMsg.options.length > 0) {
    return lastMsg.options
  }
  return []
})

const handleSelect = (opt: string) => {
  if (narrativeStore.isTyping) return
  emit('select', opt)
}
</script>

<template>
  <div v-if="latestOptions.length > 0" :style="{ padding: '12px 16px', background: themeVars.bodyColor, borderTop: `1px solid ${themeVars.borderColor}` }">
    <div :style="{ fontSize: '12px', marginBottom: '8px', color: themeVars.textColor3 }">💡 建议分支：</div>
    <n-space>
      <n-button 
        v-for="opt in latestOptions" 
        :key="opt" 
        size="small" 
        ghost 
        type="info"
        :disabled="narrativeStore.isTyping"
        @click="handleSelect(opt)"
      >
        {{ opt }}
      </n-button>
    </n-space>
  </div>
</template>
