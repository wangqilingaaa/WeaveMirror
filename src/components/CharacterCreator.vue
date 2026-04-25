<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NForm, NFormItem, NInput, NInputNumber, NDynamicTags,
  NSlider, NButton, NSpace, NSwitch, useMessage, NCard, NSelect
} from 'naive-ui'
import { useCharacterStore, type Character } from '../stores/character'

const props = defineProps<{
  worldId: string
}>()

const emit = defineEmits<{
  (e: 'created'): void
}>()

const characterStore = useCharacterStore()
const message = useMessage()

const isGenerating = ref(false)
const aiKeyword = ref('')

const defaultForm = (): Omit<Character, 'id' | 'worldId'> => ({
  name: '',
  age: 18,
  tags: [],
  attributes: {
    strength: 50,
    intelligence: 50,
    agility: 50
  },
  status: '存活',
  lifeStage: '青年',
  currentGoal: '生存与探索',
  isProtagonist: false
})

const formValue = ref(defaultForm())

// 检查是否已经存在主角
const hasProtagonist = computed(() => {
  const chars = characterStore.getCharactersByWorld(props.worldId)
  return chars.some(c => c.isProtagonist)
})

const handleCreate = () => {
  if (!formValue.value.name.trim()) {
    message.error('角色姓名不能为空')
    return
  }
  
  if (formValue.value.isProtagonist && hasProtagonist.value) {
    message.error('该世界已经存在主角，请先取消其他主角身份')
    return
  }

  characterStore.addCharacter({
    id: 'c_' + Date.now(),
    worldId: props.worldId,
    ...formValue.value
  })
  
  message.success('角色创建成功')
  formValue.value = defaultForm()
  // @ts-ignore
  emit('created')
}

const handleAiGenerate = async () => {
  if (!aiKeyword.value.trim()) {
    message.warning('请输入 AI 补全关键词')
    return
  }

  isGenerating.value = true
  try {
    const generatedChar = await characterStore.generateCharacter(props.worldId, aiKeyword.value)
    // 用生成的数据填充表单，而不是直接创建，给用户确认的机会
    formValue.value.name = generatedChar.name
    formValue.value.age = generatedChar.age
    formValue.value.tags = generatedChar.tags
    formValue.value.attributes = generatedChar.attributes
    message.success('AI 已为您生成基础模板，可继续调整')
  } catch (e: any) {
    message.error('AI 生成失败: ' + e.message)
  } finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <n-card title="创建新角色" bordered>
    <!-- AI 辅助工具区 -->
    <n-space align="center" style="margin-bottom: 24px; padding: 12px; background: var(--n-color-modal); border-radius: 8px;">
      <span style="font-weight: bold; color: var(--n-primary-color);">✨ AI 灵感补全：</span>
      <n-input v-model:value="aiKeyword" placeholder="输入关键词 (如：流浪法师)" style="width: 200px;" />
      <n-button type="info" :loading="isGenerating" @click="handleAiGenerate">一键生成模板</n-button>
    </n-space>

    <!-- 角色表单 -->
    <n-form :model="formValue" label-placement="left" label-width="100">
      <n-form-item label="角色姓名" required>
        <n-input v-model:value="formValue.name" placeholder="请输入姓名" />
      </n-form-item>

      <n-form-item label="是否为主角">
        <n-switch v-model:value="formValue.isProtagonist" :disabled="hasProtagonist && !formValue.isProtagonist" />
        <span v-if="hasProtagonist && !formValue.isProtagonist" style="margin-left: 8px; color: var(--n-text-color-3); font-size: 12px;">(已存在主角)</span>
      </n-form-item>

      <n-form-item label="年龄">
        <n-input-number v-model:value="formValue.age" :min="0" :max="1000" />
      </n-form-item>

      <n-form-item label="生命阶段">
        <n-select v-model:value="formValue.lifeStage" :options="[{label:'幼年',value:'幼年'},{label:'少年',value:'少年'},{label:'青年',value:'青年'},{label:'中年',value:'中年'},{label:'老年',value:'老年'},{label:'未知',value:'未知'}]" />
      </n-form-item>

      <n-form-item label="状态">
        <n-select v-model:value="formValue.status" :options="[{label:'存活',value:'存活'},{label:'死亡',value:'死亡'},{label:'失踪',value:'失踪'},{label:'未知',value:'未知'}]" />
      </n-form-item>

      <n-form-item label="当前目标">
        <n-input v-model:value="formValue.currentGoal" placeholder="输入当前目标" />
      </n-form-item>

      <n-form-item label="性格标签">
        <n-dynamic-tags v-model:value="formValue.tags" />
      </n-form-item>

      <n-form-item label="力量">
        <n-slider v-model:value="formValue.attributes.strength" :step="1" :max="100" />
        <span style="margin-left: 12px; width: 30px;">{{ formValue.attributes.strength }}</span>
      </n-form-item>

      <n-form-item label="智力">
        <n-slider v-model:value="formValue.attributes.intelligence" :step="1" :max="100" />
        <span style="margin-left: 12px; width: 30px;">{{ formValue.attributes.intelligence }}</span>
      </n-form-item>

      <n-form-item label="敏捷">
        <n-slider v-model:value="formValue.attributes.agility" :step="1" :max="100" />
        <span style="margin-left: 12px; width: 30px;">{{ formValue.attributes.agility }}</span>
      </n-form-item>

      <n-space justify="end">
        <n-button type="primary" @click="handleCreate">创建并保存</n-button>
      </n-space>
    </n-form>
  </n-card>
</template>
