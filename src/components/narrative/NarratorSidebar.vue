<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NScrollbar, NEmpty, NDivider } from 'naive-ui'
import { useNarrativeStore } from '../../stores/narrative'

const narrativeStore = useNarrativeStore()

// 获取最近一条带有旁白信息的 AI 回复
const latestNarratorText = computed(() => {
  const msgs = narrativeStore.messages
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === 'assistant' && msgs[i].narratorText) {
      return msgs[i].narratorText
    }
  }
  return ''
})
</script>

<template>
  <n-card title="旁白记录" size="small" bordered style="height: 100%; display: flex; flex-direction: column;" :content-style="{ flex: 1, overflow: 'hidden', padding: 0 }">
    <n-scrollbar style="height: 100%;">
      <div style="padding: 16px;">
        <template v-if="latestNarratorText">
          <div style="font-size: 14px; line-height: 1.8; color: var(--n-text-color-3); white-space: pre-wrap; font-style: italic;">
            {{ latestNarratorText }}
          </div>
        </template>
        <template v-else>
          <n-empty description="暂无环境或动作描写" style="margin-top: 40px;" />
        </template>
        
        <!-- 这里预留给未来添加场景状态、天气等更多微表情/环境提示的占位 -->
        <n-divider dashed />
        <div style="font-size: 12px; color: var(--n-text-color-3);">
          <p>📍 场景：未定</p>
          <p>⏱️ 时间：未知</p>
        </div>
      </div>
    </n-scrollbar>
  </n-card>
</template>
