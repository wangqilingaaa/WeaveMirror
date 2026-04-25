<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorldStore } from '../stores/world'
import {
  NButton, NCard, NGrid, NGridItem, NModal, NForm,
  NFormItem, NInput, NDynamicTags, useMessage, NSpace, NTag, NEmpty, NSpin
} from 'naive-ui'

const router = useRouter()
const worldStore = useWorldStore()
const message = useMessage()

const isLoading = ref(true)
const showModal = ref(false)
const isGenerating = ref(false)

const formValue = ref({
  name: '',
  tags: [] as string[]
})

onMounted(async () => {
  isLoading.value = true
  if (worldStore.worlds.length === 0) {
    await worldStore.fetchWorlds()
  }
  isLoading.value = false
})

const handleCreate = async () => {
  if (!formValue.value.name.trim()) {
    message.error('请输入世界名称')
    return
  }

  isGenerating.value = true
  try {
    if (formValue.value.tags && formValue.value.tags.length > 0) {
      // 填写了标签，触发 AI 生成
      await worldStore.generateWorld(formValue.value.name, formValue.value.tags)
      message.success('基于主题标签的 AI 世界生成成功')
    } else {
      // 未填写标签，基础创建
      await worldStore.createWorld(formValue.value.name)
      message.success('基础世界创建成功')
    }
    showModal.value = false
    // 重置表单
    formValue.value = { name: '', tags: [] }
  } catch (e: any) {
    message.error('创建失败: ' + e.message)
  } finally {
    isGenerating.value = false
  }
}

const enterWorld = (id: string) => {
  worldStore.setCurrentWorldId(id)
  router.push(`/stage/${id}`)
}
</script>

<template>
  <div style="max-width: 1200px; margin: 0 auto;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 style="margin: 0; font-size: 24px;">我的创作工坊</h2>
      <n-button type="primary" size="large" @click="showModal = true">
        创建新世界
      </n-button>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px 0;">
      <n-spin size="large" />
    </div>

    <!-- 列表为空 -->
    <n-empty v-else-if="worldStore.worlds.length === 0" description="这里空空如也，快去创建一个属于你的世界吧" style="margin-top: 60px;" />

    <!-- 世界卡片网格 -->
    <n-grid v-else x-gap="24" y-gap="24" cols="1 s:2 m:3 l:4" responsive="screen">
      <n-grid-item v-for="world in worldStore.worlds" :key="world.id">
        <n-card 
          :title="world.name" 
          hoverable 
          style="height: 100%; cursor: pointer; display: flex; flex-direction: column;"
          @click="enterWorld(world.id)"
        >
          <p style="color: var(--n-text-color-3); flex: 1; line-height: 1.6;">
            {{ world.description || '暂无描述' }}
          </p>
          <template #footer>
            <n-space v-if="world.tags && world.tags.length > 0">
              <n-tag v-for="tag in world.tags" :key="tag" size="small" type="info">{{ tag }}</n-tag>
            </n-space>
            <n-space v-else>
              <n-tag size="small" :bordered="false">基础设定</n-tag>
            </n-space>
          </template>
        </n-card>
      </n-grid-item>
    </n-grid>

    <!-- 创建世界的 Modal -->
    <n-modal v-model:show="showModal" preset="card" title="构建新世界" style="width: 500px">
      <n-form :model="formValue" @submit.prevent>
        <n-form-item label="世界名称" path="name" required>
          <n-input v-model:value="formValue.name" placeholder="请输入为世界命名的称呼" />
        </n-form-item>
        
        <n-form-item label="主题标签 (可选)" path="tags">
          <n-dynamic-tags v-model:value="formValue.tags" />
          <template #feedback>
            输入标签后回车确认。如果填写了主题标签，系统将自动使用 AI 帮您生成详细的世界观背景。
          </template>
        </n-form-item>

        <n-space justify="end" style="margin-top: 24px;">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="isGenerating" @click="handleCreate">
            {{ formValue.tags && formValue.tags.length > 0 ? 'AI 魔法生成' : '基础创建' }}
          </n-button>
        </n-space>
      </n-form>
    </n-modal>
  </div>
</template>

<style scoped>
/* 避免卡片底部被挤压 */
:deep(.n-card__content) {
  flex: 1;
}
</style>
