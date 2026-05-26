<script setup lang="ts">
import { NAvatar, NTag } from 'naive-ui'
import type { StageCharacterCard } from './stageTypes'

defineProps<{
  title: string
  subtitle: string
  characters: StageCharacterCard[]
  activeCharacterId: number | null
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  select: [character: StageCharacterCard]
  storyline: [character: StageCharacterCard]
}>()
</script>

<template>
  <aside class="character-sidebar">
    <header class="character-sidebar__header">
      <div>
        <p class="character-sidebar__eyebrow">场景关联角色</p>
        <h2 class="character-sidebar__title">{{ title }}</h2>
      </div>
      <NTag size="small" round>{{ characters.length }} 人</NTag>
    </header>

    <p class="character-sidebar__subtitle">{{ subtitle }}</p>

    <div v-if="error" class="character-sidebar__notice character-sidebar__notice--warning">
      {{ error }}
    </div>

    <div v-if="loading" class="character-sidebar__notice">
      角色信息加载中...
    </div>

    <div v-else class="character-list">
      <article
        v-for="character in characters"
        :key="character.id"
        class="character-card"
        :class="{ 'character-card--active': activeCharacterId === character.id }"
      >
        <button
          type="button"
          class="character-item"
          :class="{ 'character-item--active': activeCharacterId === character.id }"
          @click="emit('select', character)"
        >
          <div class="character-item__avatar">
            <NAvatar round :size="44">
              {{ character.avatarText }}
            </NAvatar>
          </div>

          <div class="character-item__body">
            <div class="character-item__head">
              <strong class="character-item__name">{{ character.name }}</strong>
              <NTag size="small" round type="info">{{ character.role }}</NTag>
            </div>
            <p class="character-item__hint">
              {{ activeCharacterId === character.id ? '当前角色，发送消息时会以该角色身份行动。' : '点击切换为当前角色。' }}
            </p>
          </div>
        </button>

        <button
          type="button"
          class="character-storyline-button"
          @click="emit('storyline', character)"
        >
          查看故事线
        </button>
      </article>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.character-sidebar {
  height: 100%;
  min-height: 0;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(22, 19, 31, 0.82);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.character-sidebar__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.character-sidebar__eyebrow {
  margin: 0 0 6px;
  color: var(--color-text-muted);
  font-size: 12px;
  letter-spacing: 1px;
}

.character-sidebar__title {
  margin: 0;
  color: var(--color-text-body);
  font-size: 22px;
}

.character-sidebar__subtitle {
  margin: 10px 0 16px;
  color: var(--color-text-desc);
  line-height: 1.7;
}

.character-sidebar__notice {
  padding: 12px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text-desc);
}

.character-sidebar__notice--warning {
  background: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.18);
  color: #f4d27a;
}

.character-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 6px;
}

.character-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.character-item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(180, 142, 255, 0.08);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.02);
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background-color var(--transition-fast);
}

.character-item:hover,
.character-item--active {
  transform: translateY(-1px);
  border-color: rgba(180, 142, 255, 0.24);
  background: rgba(180, 142, 255, 0.08);
}

.character-card--active .character-storyline-button {
  border-color: rgba(180, 142, 255, 0.26);
  color: var(--color-primary);
}

.character-item__body {
  min-width: 0;
  flex: 1;
}

.character-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.character-item__name {
  color: var(--color-text-body);
  line-height: 1.5;
}

.character-item__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.character-storyline-button {
  width: 100%;
  padding: 10px 12px;
  border: 1px dashed rgba(180, 142, 255, 0.18);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.02);
  color: var(--color-text-desc);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.character-storyline-button:hover {
  border-color: rgba(180, 142, 255, 0.26);
  background: rgba(180, 142, 255, 0.06);
  color: var(--color-text-body);
}

@media (max-width: 768px) {
  .character-sidebar__header,
  .character-item__head {
    flex-direction: column;
  }
}
</style>
