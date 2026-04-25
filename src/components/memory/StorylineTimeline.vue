<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NVirtualList, NButton, NTag, NInput, NSpace } from 'naive-ui'
import { useMemoryStore } from '../../stores/memory'
import EmptyState from '../common/EmptyState.vue'

const props = defineProps<{
  characterId: string
}>()

const memoryStore = useMemoryStore()

// 展开/收起的记忆状态
const expandedIds = ref<Set<string>>(new Set())

// 生成数据
watch(() => props.characterId, (newId) => {
  if (newId) {
    memoryStore.generateFakeMemories(newId)
    expandedIds.value.clear()
  }
}, { immediate: true })

const memories = computed(() => {
  return memoryStore.getMemoriesByCharacter(props.characterId)
})

const toggleExpand = (id: string) => {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

const toggleCore = (id: string, e: Event) => {
  e.stopPropagation()
  memoryStore.toggleCoreMemory(id)
}

const deleteMemory = (id: string, e: Event) => {
  e.stopPropagation()
  memoryStore.deleteMemory(id)
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  }
}

const handleNoteUpdate = (id: string, value: string) => {
  memoryStore.updateUserNote(id, value)
}

</script>

<template>
  <div style="height: 100%; display: flex; flex-direction: column;">
    <div style="padding: 16px; border-bottom: 1px solid var(--n-border-color);">
      <h3 style="margin: 0; font-size: 16px;">角色个人史诗</h3>
      <p style="margin: 4px 0 0 0; color: var(--n-text-color-3); font-size: 13px;">记录着该角色的重要生平和记忆，您可以进行标记或遗忘。</p>
    </div>

    <div style="flex: 1; min-height: 0;">
      <n-virtual-list
        v-if="memories.length > 0"
        :items="memories"
        :item-size="120"
        style="height: 100%; padding: 16px;"
      >
        <template #default="{ item }">
          <div class="timeline-item" :key="item.id" @click="toggleExpand(item.id)">
            <!-- 左侧轴线 -->
            <div class="timeline-axis">
              <div class="timeline-dot" :class="{ 'is-core': item.isCore }"></div>
              <div class="timeline-line"></div>
            </div>

            <!-- 右侧内容 -->
            <div class="timeline-content">
              <div class="timeline-header">
                <div class="timeline-title">
                  <span class="timeline-time">{{ item.timestamp }}</span>
                  <span v-if="item.isCore" class="core-pin">📌 核心记忆</span>
                </div>
                <div class="timeline-actions">
                  <n-button size="tiny" tertiary :type="item.isCore ? 'warning' : 'default'" @click="toggleCore(item.id, $event)">
                    {{ item.isCore ? '取消固定' : '固定核心' }}
                  </n-button>
                  <n-button size="tiny" tertiary type="error" @click="deleteMemory(item.id, $event)">
                    遗忘
                  </n-button>
                </div>
              </div>

              <div class="timeline-summary">{{ item.summary }}</div>
              
              <n-space size="small" style="margin-top: 8px;">
                <n-tag v-for="tag in item.tags" :key="tag" size="small" type="info" bordered>
                  {{ tag }}
                </n-tag>
              </n-space>

              <!-- 展开详情区域 -->
              <div v-if="expandedIds.has(item.id)" class="timeline-detail" @click.stop>
                <div style="color: var(--n-text-color-3); margin-bottom: 12px;">{{ item.detail }}</div>
                <div>
                  <span style="font-size: 12px; color: var(--n-text-color-3); margin-bottom: 4px; display: block;">用户笔记：</span>
                  <n-input
                    type="textarea"
                    placeholder="在这里记录关于这个记忆的灵感..."
                    :value="item.userNote"
                    @update:value="(val) => handleNoteUpdate(item.id, val)"
                    rows="2"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </n-virtual-list>
      <div v-else style="height: 100%; display: flex; align-items: center; justify-content: center;">
        <EmptyState type="default" description="该角色暂无任何记忆或故事记录。" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-item {
  display: flex;
  margin-bottom: 16px;
  cursor: pointer;
  transition: background 0.3s;
  padding: 8px;
  border-radius: 8px;
}
.timeline-item:hover {
  background: var(--n-color-hover);
}
.timeline-axis {
  position: relative;
  width: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--n-info-color);
  margin-top: 4px;
  z-index: 2;
  box-shadow: 0 0 0 2px var(--n-color);
}
.timeline-dot.is-core {
  background: var(--n-error-color);
}
.timeline-line {
  position: absolute;
  top: 16px;
  bottom: -24px;
  width: 2px;
  background: var(--n-border-color);
  z-index: 1;
}
.timeline-item:last-child .timeline-line {
  display: none;
}
.timeline-content {
  flex: 1;
  padding-left: 12px;
  min-width: 0;
}
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.timeline-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.timeline-time {
  font-weight: bold;
  font-size: 14px;
  color: var(--n-text-color);
}
.core-pin {
  font-size: 12px;
  color: var(--n-error-color);
  background: var(--n-color-modal);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--n-error-color);
}
.timeline-actions {
  display: flex;
  gap: 8px;
}
.timeline-summary {
  font-size: 14px;
  color: var(--n-text-color);
}
.timeline-detail {
  margin-top: 16px;
  padding: 12px;
  background: var(--n-color-modal);
  border-radius: 6px;
  border: 1px solid var(--n-border-color);
}
</style>
