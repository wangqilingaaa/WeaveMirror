<script setup lang="ts">
import { NButton, NIcon, NSpace } from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'

defineProps<{
  worldId: number
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'create'): void
}>()
</script>

<template>
  <header class="page-header">
    <div>
      <h1 class="page-title">世界之书</h1>
      <p class="page-subtitle">管理世界 `{{ worldId }}` 下的角色档案，支持新增与编辑。</p>
    </div>
    <NSpace>
      <NButton secondary @click="emit('back')">返回工坊</NButton>
      <NButton type="primary" @click="emit('create')">
        <template #icon>
          <NIcon><AddOutline /></NIcon>
        </template>
        创建角色
      </NButton>
    </NSpace>
  </header>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.page-title {
  margin: 0 0 8px;
  font-family: var(--font-title);
  font-size: 30px;
  font-weight: 700;
  color: var(--color-text-body);
}

.page-subtitle {
  margin: 0;
  color: var(--color-text-desc);
  line-height: 1.7;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
}
</style>
