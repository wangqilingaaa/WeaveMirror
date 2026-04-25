<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { NGrid, NGridItem, NInput, NButton } from 'naive-ui'
import { useNarrativeStore } from '../stores/narrative'
import { useWorldStore } from '../stores/world'
import ChatPanel from '../components/narrative/ChatPanel.vue'
import NarratorSidebar from '../components/narrative/NarratorSidebar.vue'
import SuggestionsPanel from '../components/narrative/SuggestionsPanel.vue'
import CharacterStatusBar from '../components/narrative/CharacterStatusBar.vue'
import RippleBrief from '../components/narrative/RippleBrief.vue'

const route = useRoute()
const narrativeStore = useNarrativeStore()
const worldStore = useWorldStore()
const inputContent = ref('')

const worldId = route.params.worldId as string
const currentWorld = worldStore.worlds.find(w => w.id === worldId)

onMounted(() => {
  narrativeStore.connect(worldId)
})

onUnmounted(() => {
  narrativeStore.disconnect()
  narrativeStore.clearMessages()
})

const handleSend = () => {
  if (!inputContent.value.trim() || narrativeStore.isTyping) return
  narrativeStore.sendTurn(inputContent.value)
  inputContent.value = ''
}

const handleOptionSelect = (option: string) => {
  narrativeStore.sendTurn(option)
}
</script>

<template>
  <div style="max-width: 1400px; margin: 0 auto; height: calc(100vh - 112px); display: flex; flex-direction: column;">
    <div style="margin-bottom: 16px;">
      <h2 style="margin: 0; font-size: 24px; color: var(--n-text-color);">叙事舞台</h2>
      <p style="color: var(--n-text-color-3); margin-top: 8px;">
        正在连接至世界: {{ currentWorld?.name || worldId }} 
        <span :style="{ color: narrativeStore.isConnected ? 'var(--n-success-color)' : 'var(--n-error-color)' }">
          ({{ narrativeStore.isConnected ? '已连接' : '未连接' }})
        </span>
      </p>
    </div>

    <n-grid x-gap="24" cols="1 l:4" style="flex: 1; min-height: 0;" responsive="screen">
      <!-- 左侧：主聊天区域 (占 3 份) -->
      <n-grid-item span="3" style="display: flex; flex-direction: column; height: 100%; border: 1px solid var(--n-border-color); border-radius: 8px; overflow: hidden;">
        <!-- 聊天气泡列表 -->
        <ChatPanel />

        <!-- 建议选项面板 -->
        <SuggestionsPanel @select="handleOptionSelect" />

        <!-- 输入区域 -->
        <div style="padding: 16px; border-top: 1px solid var(--n-border-color); background: var(--n-color);">
          <div style="display: flex; gap: 16px; align-items: flex-end;">
            <n-input 
              v-model:value="inputContent" 
              type="textarea" 
              :autosize="{ minRows: 1, maxRows: 4 }" 
              placeholder="输入你的行动或对话..." 
              style="flex: 1;"
              @keyup.enter.prevent="handleSend"
            />
            <n-button type="primary" style="height: 34px;" :disabled="!narrativeStore.isConnected || narrativeStore.isTyping" @click="handleSend">
              发送
            </n-button>
          </div>
        </div>
      </n-grid-item>

      <!-- 右侧：侧边栏状态与旁白 (占 1 份) -->
      <n-grid-item span="1" style="display: flex; flex-direction: column; height: 100%;">
        <!-- 角色状态栏 -->
        <CharacterStatusBar :worldId="worldId" />

        <!-- 旁白环境面板 -->
        <NarratorSidebar style="flex: 1; overflow: hidden;" />
      </n-grid-item>
    </n-grid>

    <!-- 涟漪简报浮层 -->
    <RippleBrief />
  </div>
</template>
