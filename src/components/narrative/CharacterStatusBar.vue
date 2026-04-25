<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NAvatar, NSpace, NTag, NProgress } from 'naive-ui'
import { useCharacterStore } from '../../stores/character'

const props = defineProps<{
  worldId: string
}>()

const characterStore = useCharacterStore()

// 尝试获取当前世界的主角
const protagonist = computed(() => {
  const chars = characterStore.getCharactersByWorld(props.worldId)
  return chars.find(c => c.isProtagonist) || null
})

// 状态 mock 数据
const status = {
  health: 80,
  sanity: 90,
  time: '星历 214年 秋'
}
</script>

<template>
  <n-card size="small" bordered style="margin-bottom: 16px;">
    <div v-if="protagonist" style="display: flex; align-items: center; gap: 16px;">
      <n-avatar
        round
        size="large"
        src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg"
      />
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-weight: bold; font-size: 16px;">{{ protagonist.name }}</span>
          <span style="font-size: 12px; color: var(--n-text-color-3);">{{ status.time }}</span>
        </div>
        <n-space size="small" style="margin-bottom: 8px;">
          <n-tag v-for="tag in protagonist.tags.slice(0, 3)" :key="tag" size="small" type="primary" round>
            {{ tag }}
          </n-tag>
        </n-space>
        
        <div style="display: flex; gap: 12px; font-size: 12px;">
          <div style="flex: 1;">
            <div style="margin-bottom: 2px; color: var(--n-text-color-3);">生命</div>
            <n-progress type="line" :percentage="status.health" color="var(--n-error-color)" :show-indicator="false" :height="4" />
          </div>
          <div style="flex: 1;">
            <div style="margin-bottom: 2px; color: var(--n-text-color-3);">理智</div>
            <n-progress type="line" :percentage="status.sanity" color="var(--n-info-color)" :show-indicator="false" :height="4" />
          </div>
        </div>
      </div>
    </div>
    <div v-else style="text-align: center; color: var(--n-text-color-3); padding: 16px 0;">
      尚未在世界之书创建主角
    </div>
  </n-card>
</template>
