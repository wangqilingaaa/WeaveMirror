<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NButton, NSpace, NInputNumber, useMessage, NStatistic, NIcon } from 'naive-ui'
import { useWorldStore } from '../../stores/world'
import { useCharacterStore } from '../../stores/character'

const props = defineProps<{
  worldId: string
}>()

const worldStore = useWorldStore()
const characterStore = useCharacterStore()
const message = useMessage()

const isAdvancing = ref(false)
const customYears = ref<number>(5)

const handleAdvanceTime = async (years: number) => {
  if (years <= 0) return
  
  isAdvancing.value = true
  try {
    // 模拟推进时间 API 调用
    await worldStore.advanceTime(props.worldId, years)
    
    // 更新角色年龄
    characterStore.advanceAgeByWorld(props.worldId, years)
    
    message.success(`成功推进时间 ${years} 年`)
  } catch (error: any) {
    message.error(`推进时间失败: ${error.message || '未知错误'}`)
  } finally {
    isAdvancing.value = false
  }
}
</script>

<template>
  <n-card title="时间推进控制器" bordered>
    <n-space vertical size="large">
      <div class="time-display">
        <n-statistic label="世界当前时间">
          <template #prefix>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"><path d="M256 48C141.13 48 48 141.13 48 256s93.13 208 208 208s208-93.13 208-208S370.87 48 256 48zm96 240h-96a16 16 0 0 1-16-16V128a16 16 0 0 1 32 0v128h80a16 16 0 0 1 0 32z" fill="currentColor"></path></svg>
            </n-icon>
          </template>
          星历 {{ worldStore.worlds.find(w => w.id === worldId)?.currentYear || 0 }} 年
        </n-statistic>
      </div>

      <div class="controls">
        <n-space align="center">
          <n-button 
            type="primary" 
            ghost 
            :loading="isAdvancing" 
            @click="handleAdvanceTime(1)"
          >
            + 1 年
          </n-button>
          
          <n-button 
            type="primary" 
            ghost 
            :loading="isAdvancing" 
            @click="handleAdvanceTime(10)"
          >
            + 10 年
          </n-button>

          <n-space align="center" :wrap-item="false">
            <n-input-number 
              v-model:value="customYears" 
              :min="1" 
              :max="1000" 
              placeholder="自定义年数" 
              style="width: 120px"
            />
            <n-button 
              type="primary" 
              :loading="isAdvancing" 
              @click="handleAdvanceTime(customYears)"
            >
              推进
            </n-button>
          </n-space>
        </n-space>
      </div>
    </n-space>
  </n-card>
</template>

<style scoped>
.time-display {
  padding: 16px;
  background-color: var(--n-color-modal);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
}
</style>
