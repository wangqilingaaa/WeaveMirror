<script setup lang="ts">
import { NButton, NSpin, NTag } from 'naive-ui'
import type { StageSessionCard } from './stageTypes'

defineProps<{
  title: string
  subtitle: string
  sessions: StageSessionCard[]
  activeSessionId: number | null
  loading?: boolean
  creating?: boolean
  error?: string
}>()

const emit = defineEmits<{
  create: []
  select: [sessionId: number]
}>()
</script>

<template>
  <aside class="session-sidebar">
    <header class="session-sidebar__header">
      <div>
        <p class="session-sidebar__eyebrow">会话管理</p>
        <h2 class="session-sidebar__title">{{ title }}</h2>
      </div>
      <NButton size="small" type="primary" :loading="creating" @click="emit('create')">
        新建会话
      </NButton>
    </header>

    <p class="session-sidebar__subtitle">{{ subtitle }}</p>

    <div v-if="error" class="session-sidebar__notice session-sidebar__notice--warning">
      {{ error }}
    </div>

    <div v-if="loading" class="session-sidebar__loading">
      <NSpin size="small" />
      <span>会话列表加载中...</span>
    </div>

    <div v-else-if="sessions.length" class="session-sidebar__list">
      <button
        v-for="session in sessions"
        :key="session.id"
        type="button"
        class="session-sidebar__item"
        :class="{ 'session-sidebar__item--active': activeSessionId === session.id }"
        @click="emit('select', session.id)"
      >
        <div class="session-sidebar__item-head">
          <strong class="session-sidebar__item-title">{{ session.title }}</strong>
          <NTag size="small" round>{{ session.sessionTypeLabel }}</NTag>
        </div>

        <p class="session-sidebar__item-summary">{{ session.summary }}</p>

        <div class="session-sidebar__item-meta">
          <span>{{ session.characterName }}</span>
          <span>{{ session.messageCountText }}</span>
        </div>

        <p class="session-sidebar__item-time">{{ session.lastMessageAtText }}</p>
      </button>
    </div>

    <div v-else class="session-sidebar__notice">
      当前世界还没有会话记录。你可以先新建一个会话，再开始推进剧情。
    </div>
  </aside>
</template>

<style scoped lang="scss">
.session-sidebar {
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

.session-sidebar__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.session-sidebar__eyebrow {
  margin: 0 0 6px;
  color: var(--color-text-muted);
  font-size: 12px;
  letter-spacing: 1px;
}

.session-sidebar__title {
  margin: 0;
  color: var(--color-text-body);
  font-size: 22px;
}

.session-sidebar__subtitle {
  margin: 10px 0 16px;
  color: var(--color-text-desc);
  line-height: 1.7;
}

.session-sidebar__notice,
.session-sidebar__loading {
  padding: 12px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text-desc);
}

.session-sidebar__notice--warning {
  background: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.18);
  color: #f4d27a;
}

.session-sidebar__loading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.session-sidebar__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 6px;
}

.session-sidebar__item {
  width: 100%;
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

.session-sidebar__item:hover,
.session-sidebar__item--active {
  transform: translateY(-1px);
  border-color: rgba(180, 142, 255, 0.24);
  background: rgba(180, 142, 255, 0.08);
}

.session-sidebar__item-head,
.session-sidebar__item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.session-sidebar__item-title {
  color: var(--color-text-body);
  line-height: 1.5;
}

.session-sidebar__item-summary,
.session-sidebar__item-time {
  margin: 8px 0 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.session-sidebar__item-summary {
  color: var(--color-text-desc);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.session-sidebar__item-meta {
  margin-top: 10px;
  color: var(--color-text-muted);
  font-size: 12px;
}

@media (max-width: 768px) {
  .session-sidebar__header,
  .session-sidebar__item-head,
  .session-sidebar__item-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
