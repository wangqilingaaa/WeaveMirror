<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NSelect, NTag, NAlert } from 'naive-ui'
import EmptyState from '../common/EmptyState.vue'
import { useCharacterStore } from '../../stores/character'
import { useMemoryStore, type Memory } from '../../stores/memory'

const props = defineProps<{
  worldId: string
}>()

const characterStore = useCharacterStore()
const memoryStore = useMemoryStore()

// 可选角色列表
const characterOptions = computed(() => {
  return characterStore.getCharactersByWorld(props.worldId).map(c => ({
    label: c.name,
    value: c.id
  }))
})

// 用户选择的对比角色（最多3个）
const selectedCharacterIds = ref<string[]>([])

const handleSelectUpdate = (values: string[]) => {
  if (values.length <= 3) {
    selectedCharacterIds.value = values
  }
}

watch(() => props.worldId, () => {
  // 世界切换时清空
  selectedCharacterIds.value = []
})

// 获取选中角色的详情，方便展示名字等
const selectedCharacters = computed(() => {
  return selectedCharacterIds.value.map(id => characterStore.characters.find(c => c.id === id)).filter(Boolean) as any[]
})

// 当选择了角色后，触发假数据生成（如果没有的话）
watch(selectedCharacterIds, (newIds) => {
  newIds.forEach(id => {
    memoryStore.generateFakeMemories(id)
  })
}, { deep: true })

// 统合时间轴结构
interface UnifiedTimeRow {
  timestamp: string
  sortKey: number
  events: Record<string, Memory> // characterId -> Memory
  isShared: boolean
}

const unifiedTimeline = computed(() => {
  if (selectedCharacterIds.value.length === 0) return []

  const rowMap = new Map<string, UnifiedTimeRow>()

  selectedCharacterIds.value.forEach(charId => {
    const mems = memoryStore.getMemoriesByCharacter(charId)
    mems.forEach(mem => {
      if (!rowMap.has(mem.timestamp)) {
        rowMap.set(mem.timestamp, {
          timestamp: mem.timestamp,
          sortKey: memoryStore.parseTimestamp(mem.timestamp),
          events: {},
          isShared: false
        })
      }
      const row = rowMap.get(mem.timestamp)!
      row.events[charId] = mem
    })
  })

  const rows = Array.from(rowMap.values())
  // 计算 isShared (如果超过1个角色在这一天有事件)
  rows.forEach(row => {
    row.isShared = Object.keys(row.events).length > 1
  })

  // 按时间排序
  return rows.sort((a, b) => a.sortKey - b.sortKey)
})

// 高亮状态：鼠标悬浮在共享时间戳时联动高亮
const hoveredTimestamp = ref<string | null>(null)
</script>

<template>
  <div class="multi-perspective-container">
    <div class="control-panel">
      <span class="control-label">选择对比角色 (最多3个):</span>
      <n-select
        :value="selectedCharacterIds"
        @update:value="handleSelectUpdate"
        multiple
        :options="characterOptions"
        placeholder="请选择要对比的角色"
        style="width: 400px;"
      />
      <n-alert type="info" :show-icon="false" style="margin-left: 16px; padding: 4px 12px;">
        <span style="font-size: 13px;">选择多个角色，相同的发生时间会自动对齐并高亮显示</span>
      </n-alert>
    </div>

    <div v-if="selectedCharacterIds.length === 0" class="empty-state">
      <EmptyState type="default" description="请先在上方选择 2-3 个角色开始对比" />
    </div>

    <div v-else class="timeline-board">
      <!-- 表头：角色名字 -->
      <div class="timeline-header">
        <div class="time-column-header">时间点</div>
        <div class="char-column-header" v-for="char in selectedCharacters" :key="char.id">
          {{ char.name }}
          <n-tag v-if="char.isProtagonist" type="error" size="small" style="margin-left: 8px;">主角</n-tag>
        </div>
      </div>

      <!-- 内容区：滚动展示统合时间轴 -->
      <div class="timeline-body">
        <div 
          v-for="row in unifiedTimeline" 
          :key="row.timestamp"
          class="timeline-row"
          :class="{ 'is-shared': row.isShared, 'is-hovered': hoveredTimestamp === row.timestamp }"
          @mouseenter="row.isShared ? hoveredTimestamp = row.timestamp : null"
          @mouseleave="hoveredTimestamp = null"
        >
          <!-- 时间列 -->
          <div class="time-column">
            <div class="timestamp-box" :class="{ 'shared-timestamp': row.isShared }">
              {{ row.timestamp }}
            </div>
            <div v-if="row.isShared" class="shared-indicator">
              <span class="indicator-line"></span>
            </div>
          </div>

          <!-- 角色事件列 -->
          <div class="char-column" v-for="char in selectedCharacters" :key="char.id">
            <div v-if="row.events[char.id]" class="event-card" :class="{ 'core-event': row.events[char.id].isCore }">
              <div class="event-title">
                <span v-if="row.events[char.id].isCore" class="core-pin">📌</span>
                {{ row.events[char.id].summary }}
              </div>
              <div class="event-detail">{{ row.events[char.id].detail }}</div>
              <div class="event-tags">
                <n-tag v-for="tag in row.events[char.id].tags" :key="tag" size="tiny" type="primary" ghost>
                  {{ tag }}
                </n-tag>
              </div>
            </div>
            <div v-else class="empty-event">
              <!-- 该角色此时刻无记录 -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.multi-perspective-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  background-color: var(--n-color);
}

.control-panel {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  background: var(--n-card-color);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  flex-shrink: 0;
}

.control-label {
  font-weight: 500;
  margin-right: 16px;
  color: var(--n-text-color);
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--n-card-color);
  border-radius: 8px;
  border: 1px dashed var(--n-border-color);
}

.timeline-board {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--n-card-color);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  overflow: hidden;
  min-height: 0;
}

.timeline-header {
  display: flex;
  border-bottom: 1px solid var(--n-border-color);
  background: var(--n-color-modal);
  font-weight: 600;
  color: var(--n-text-color);
}

.time-column-header {
  width: 140px;
  padding: 16px;
  text-align: center;
  border-right: 1px solid var(--n-border-color);
  flex-shrink: 0;
}

.char-column-header {
  flex: 1;
  padding: 16px;
  text-align: center;
  border-right: 1px solid var(--n-border-color);
  display: flex;
  align-items: center;
  justify-content: center;
}
.char-column-header:last-child {
  border-right: none;
}

.timeline-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.timeline-row {
  display: flex;
  padding: 16px 0;
  border-bottom: 1px dashed var(--n-border-color);
  transition: background-color 0.2s;
}

.timeline-row:last-child {
  border-bottom: none;
}

.timeline-row.is-shared {
  background-color: var(--n-color-active); /* 提示共同事件 */
}

.timeline-row.is-hovered {
  background-color: var(--n-color-hover); /* 悬浮时更深的颜色 */
}

.time-column {
  width: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 0 12px;
  flex-shrink: 0;
  border-right: 1px solid var(--n-border-color);
  position: relative;
}

.timestamp-box {
  background: var(--n-color-modal);
  color: var(--n-text-color-3);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s;
}

.timestamp-box.shared-timestamp {
  background: var(--n-primary-color);
  color: white;
  box-shadow: 0 2px 4px rgba(24, 160, 88, 0.3);
}

.shared-indicator {
  position: absolute;
  right: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 2px;
  background: var(--n-primary-color);
}

.char-column {
  flex: 1;
  padding: 0 16px;
  border-right: 1px solid var(--n-border-color);
}
.char-column:last-child {
  border-right: none;
}

.event-card {
  background: var(--n-card-color);
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  padding: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.event-card.core-event {
  border-left: 3px solid var(--n-error-color);
  background: var(--n-color-modal);
}

.timeline-row.is-hovered .event-card {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border-color: var(--n-primary-color);
}

.event-title {
  font-weight: 600;
  color: var(--n-text-color);
  margin-bottom: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.core-pin {
  margin-right: 4px;
  font-size: 12px;
}

.event-detail {
  font-size: 13px;
  color: var(--n-text-color-3);
  line-height: 1.5;
  margin-bottom: 10px;
}

.event-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.empty-event {
  height: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
