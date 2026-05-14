<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { NButton, NInput, NTag } from 'naive-ui'
import type { StageChatMessage } from './stageTypes'

const props = defineProps<{
  contextTag: string
  activeCharacterName: string
  messages: StageChatMessage[]
  draft: string
  sending: boolean
}>()

const emit = defineEmits<{
  'update:draft': [value: string]
  submit: []
}>()

const messageViewportRef = ref<HTMLElement | null>(null)

function updateDraft(value: string) {
  emit('update:draft', value)
}

function submitMessage() {
  emit('submit')
}

async function scrollToBottom() {
  await nextTick()
  const viewport = messageViewportRef.value
  if (!viewport) return
  viewport.scrollTop = viewport.scrollHeight
}

watch(
  () => [props.messages.length, props.sending] as const,
  () => {
    void scrollToBottom()
  }
)

onMounted(() => {
  void scrollToBottom()
})
</script>

<template>
  <section class="chat-panel">
    <header class="chat-panel__header">
      <div>
        <p class="chat-panel__eyebrow">剧情主交互区</p>
        <h2 class="chat-panel__title">叙事对话</h2>
      </div>
      <div class="chat-panel__meta">
        <NTag size="small" round type="info">{{ contextTag }}</NTag>
        <NTag size="small" round>{{ activeCharacterName }}</NTag>
      </div>
    </header>

    <div ref="messageViewportRef" class="chat-panel__messages">
      <article
        v-for="message in messages"
        :key="message.id"
        class="chat-bubble-row"
        :class="`chat-bubble-row--${message.sender}`"
      >
        <div class="chat-bubble" :class="`chat-bubble--${message.sender}`">
          <div class="chat-bubble__meta">
            <span class="chat-bubble__title">{{ message.title }}</span>
            <span class="chat-bubble__timestamp">{{ message.timestamp }}</span>
          </div>
          <p v-if="message.subtitle" class="chat-bubble__subtitle">{{ message.subtitle }}</p>
          <p class="chat-bubble__content">{{ message.content }}</p>
        </div>
      </article>
    </div>

    <footer class="chat-panel__composer">
      <NInput
        :value="draft"
        type="textarea"
        :rows="4"
        placeholder="例如：我向祁烬追问祭台讯号的真正来源，并要求他立刻说出隐瞒的事实。"
        @update:value="updateDraft"
        @keydown.ctrl.enter.prevent="submitMessage"
      />

      <div class="chat-panel__composer-actions">
        <span class="chat-panel__composer-tip">按 `Ctrl + Enter` 可快速发送</span>
        <div class="chat-panel__composer-buttons">
          <NButton secondary @click="updateDraft('')">清空</NButton>
          <NButton type="primary" :loading="sending" @click="submitMessage">发送消息</NButton>
        </div>
      </div>
    </footer>
  </section>
</template>

<style scoped lang="scss">
.chat-panel {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(22, 19, 31, 0.86);
  backdrop-filter: blur(10px);
}

.chat-panel__header,
.chat-panel__composer-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.chat-panel__eyebrow {
  margin: 0 0 6px;
  color: var(--color-text-muted);
  font-size: 12px;
  letter-spacing: 1px;
}

.chat-panel__title {
  margin: 0;
  color: var(--color-text-body);
}

.chat-panel__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.chat-panel__messages {
  min-height: 0;
  overflow-y: auto;
  padding: 8px 6px 8px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chat-bubble-row {
  display: flex;
}

.chat-bubble-row--user {
  justify-content: flex-end;
}

.chat-bubble-row--system {
  justify-content: flex-start;
}

.chat-bubble {
  max-width: min(82%, 760px);
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid rgba(180, 142, 255, 0.08);
  box-shadow: var(--shadow-sm);
  animation: bubble-enter 220ms ease;
}

.chat-bubble--user {
  background: linear-gradient(135deg, rgba(180, 142, 255, 0.24), rgba(180, 142, 255, 0.12));
  border-bottom-right-radius: 8px;
}

.chat-bubble--system {
  background: rgba(255, 255, 255, 0.04);
  border-bottom-left-radius: 8px;
}

.chat-bubble__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.chat-bubble__title {
  color: var(--color-text-body);
  font-weight: 600;
}

.chat-bubble__timestamp,
.chat-bubble__subtitle,
.chat-panel__composer-tip {
  color: var(--color-text-muted);
}

.chat-bubble__subtitle {
  margin: 0 0 8px;
  line-height: 1.6;
}

.chat-bubble__content {
  margin: 0;
  color: var(--color-text-desc);
  line-height: 1.85;
  white-space: pre-wrap;
}

.chat-panel__composer {
  padding-top: 4px;
  border-top: 1px solid rgba(180, 142, 255, 0.08);
}

.chat-panel__composer-actions {
  margin-top: 12px;
  align-items: center;
}

.chat-panel__composer-buttons {
  display: flex;
  gap: 10px;
}

@keyframes bubble-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .chat-panel__header,
  .chat-panel__composer-actions {
    flex-direction: column;
  }

  .chat-panel__meta,
  .chat-panel__composer-buttons {
    justify-content: flex-start;
  }

  .chat-bubble {
    max-width: 100%;
  }
}
</style>
