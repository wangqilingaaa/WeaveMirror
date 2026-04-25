<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NSelect, NSpace, NList, NListItem, NThing, NTag } from 'naive-ui'
import EmptyState from '../common/EmptyState.vue'
import { useCharacterStore, type Character } from '../../stores/character'

const props = defineProps<{
  worldId: string
}>()

const emit = defineEmits<{
  (e: 'select', character: Character): void
}>()

const characterStore = useCharacterStore()

const searchQuery = ref('')
const filterStatus = ref<string>('')
const filterLifeStage = ref<string>('')

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '存活', value: '存活' },
  { label: '死亡', value: '死亡' },
  { label: '失踪', value: '失踪' },
  { label: '未知', value: '未知' }
]

const lifeStageOptions = [
  { label: '全部阶段', value: '' },
  { label: '幼年', value: '幼年' },
  { label: '少年', value: '少年' },
  { label: '青年', value: '青年' },
  { label: '中年', value: '中年' },
  { label: '老年', value: '老年' },
  { label: '未知', value: '未知' }
]

const filteredCharacters = computed(() => {
  let chars = characterStore.getCharactersByWorld(props.worldId)
  
  if (searchQuery.value.trim()) {
    chars = chars.filter(c => c.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
  }
  
  if (filterStatus.value) {
    chars = chars.filter(c => c.status === filterStatus.value)
  }
  
  if (filterLifeStage.value) {
    chars = chars.filter(c => c.lifeStage === filterLifeStage.value)
  }
  
  return chars
})

const selectedId = ref<string | null>(null)

const handleSelect = (char: Character) => {
  selectedId.value = char.id
  emit('select', char)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100%;">
    <!-- 筛选区 -->
    <div style="padding: 16px; border-bottom: 1px solid var(--n-border-color);">
      <n-space vertical>
        <n-input v-model:value="searchQuery" placeholder="搜索角色姓名..." clearable />
        <n-space>
          <n-select v-model:value="filterStatus" :options="statusOptions" style="width: 120px;" placeholder="状态" />
          <n-select v-model:value="filterLifeStage" :options="lifeStageOptions" style="width: 120px;" placeholder="生命阶段" />
        </n-space>
      </n-space>
    </div>

    <!-- 列表区 -->
    <div style="flex: 1; overflow-y: auto; padding: 12px; min-height: 0;">
      <n-list hoverable clickable v-if="filteredCharacters.length > 0">
        <n-list-item
          v-for="char in filteredCharacters"
          :key="char.id"
          :style="{ backgroundColor: selectedId === char.id ? 'var(--n-color-active)' : 'transparent', borderRadius: '4px', marginBottom: '8px' }"
          @click="handleSelect(char)"
        >
          <n-thing>
            <template #header>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 500;">{{ char.name }}</span>
                <n-tag v-if="char.isProtagonist" type="error" size="small">主角</n-tag>
              </div>
            </template>
            <template #description>
              <n-space size="small" style="margin-top: 4px;">
                <n-tag v-if="char.status" size="small" :type="char.status === '存活' ? 'success' : (char.status === '死亡' ? 'error' : 'default')">
                  {{ char.status }}
                </n-tag>
                <n-tag v-if="char.lifeStage" size="small" type="info">{{ char.lifeStage }}</n-tag>
              </n-space>
            </template>
          </n-thing>
        </n-list-item>
      </n-list>
      <div v-else style="height: 100%; display: flex; align-items: center; justify-content: center;">
        <EmptyState type="search" />
      </div>
    </div>
  </div>
</template>
