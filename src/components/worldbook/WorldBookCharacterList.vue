<script setup lang="ts">
import {
  NButton,
  NEmpty,
  NIcon,
  NSpace,
  NSpin,
  NTag
} from 'naive-ui'
import {
  BookOutline,
  CreateOutline
} from '@vicons/ionicons5'
import type { Character } from '@/types'

defineProps<{
  loading: boolean
  characters: Character[]
}>()

const emit = defineEmits<{
  (e: 'edit', characterId: number): void
  (e: 'storyline', characterId: number): void
}>()
</script>

<template>
  <div v-if="loading" class="loading-wrap">
    <NSpin size="large" />
  </div>

  <div v-else-if="characters.length === 0" class="empty-wrap">
    <NEmpty description="当前世界还没有角色，先创建一个吧。" />
  </div>

  <div v-else class="character-grid">
    <div v-for="character in characters" :key="character.id" class="character-card">
      <div class="card-head">
        <div>
          <h3 class="character-name">{{ character.name }}</h3>
          <p class="character-meta">
            {{ character.species || '未设置种族' }}
            <span v-if="character.age !== undefined"> · {{ character.age }} 岁</span>
            <span v-if="character.current_location"> · {{ character.current_location }}</span>
          </p>
        </div>
        <NSpace size="small">
          <NButton size="small" secondary @click="emit('storyline', character.id)">
            <template #icon>
              <NIcon><BookOutline /></NIcon>
            </template>
            故事线
          </NButton>
          <NButton size="small" quaternary type="primary" @click="emit('edit', character.id)">
            <template #icon>
              <NIcon><CreateOutline /></NIcon>
            </template>
            编辑
          </NButton>
        </NSpace>
      </div>

      <div class="tag-row">
        <NTag size="small" round>{{ character.state || '未设置状态' }}</NTag>
        <NTag v-if="character.life_stage" size="small" round type="info">{{ character.life_stage }}</NTag>
        <NTag v-if="character.nsfw_level" size="small" round type="warning">{{ character.nsfw_level }}</NTag>
      </div>

      <p v-if="character.appearance" class="card-desc">{{ character.appearance }}</p>
      <p v-else-if="character.backstory" class="card-desc">{{ character.backstory }}</p>
      <p v-else class="card-desc empty-desc">暂未填写外观或背景描述。</p>

      <div v-if="character.name_aliases?.length" class="alias-row">
        <span class="alias-label">别名</span>
        <span class="alias-value">{{ character.name_aliases.join(' / ') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.loading-wrap,
.empty-wrap {
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.character-card {
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-sm);
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.character-name {
  margin: 0 0 6px;
  font-size: 18px;
  color: var(--color-text-body);
}

.character-meta {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.card-desc {
  margin: 0 0 14px;
  color: var(--color-text-desc);
  line-height: 1.7;
  white-space: pre-wrap;
}

.empty-desc {
  color: var(--color-text-muted);
}

.alias-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.alias-label {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.alias-value {
  color: var(--color-text-desc);
}

@media (max-width: 768px) {
  .card-head {
    flex-direction: column;
  }
}
</style>
