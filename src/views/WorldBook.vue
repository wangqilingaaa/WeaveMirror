<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import {
  createCharacterApi,
  generateCharacterApi,
  getCharacterApi,
  listCharactersApi,
  updateCharacterApi
} from '@/api'
import type {
  Character,
  CharacterInput
} from '@/types'
import WorldBookHeader from '@/components/worldbook/WorldBookHeader.vue'
import WorldBookCharacterList from '@/components/worldbook/WorldBookCharacterList.vue'
import CharacterFormModal from '@/components/worldbook/CharacterFormModal.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()

/** 页面级别只保留路由参数和数据流编排。 */
const worldId = computed(() => Number(route.params.worldId))
const characters = ref<Character[]>([])
const loading = ref(false)
const showFormModal = ref(false)
const modalLoading = ref(false)
const saving = ref(false)
const enhancing = ref(false)
const editingCharacterId = ref<number | null>(null)
const editingCharacter = ref<Character | null>(null)
const formModalRef = ref<InstanceType<typeof CharacterFormModal> | null>(null)

function goToWorkshop() {
  router.push({ name: 'Workshop' })
}

function goToStoryline(characterId: number) {
  router.push({ name: 'Storyline', params: { characterId } })
}

async function loadCharacters() {
  loading.value = true
  try {
    const data = await listCharactersApi({
      world_id: worldId.value,
      page: 1,
      limit: 100
    })
    characters.value = data.characters ?? []
  } catch (err: any) {
    message.error(err?.message || '加载角色列表失败')
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingCharacterId.value = null
  editingCharacter.value = null
  modalLoading.value = false
  showFormModal.value = true
}

async function openEditModal(characterId: number) {
  editingCharacterId.value = characterId
  editingCharacter.value = null
  modalLoading.value = true
  showFormModal.value = true
  try {
    // 详情接口现在依赖 URL 中的 world_id，因此这里显式传入当前路由世界观 ID。
    const detail = await getCharacterApi(worldId.value, characterId)
    editingCharacter.value = detail
  } catch (err: any) {
    showFormModal.value = false
    message.error(err?.message || '加载角色详情失败')
  } finally {
    modalLoading.value = false
  }
}

async function handleSubmit(payload: CharacterInput) {
  saving.value = true
  try {
    if (editingCharacterId.value) {
      // 更新接口和创建接口都要求 world_id 走路径参数，页面层负责把当前世界观上下文传下去。
      await updateCharacterApi(worldId.value, editingCharacterId.value, payload)
      message.success('角色已更新')
    } else {
      await createCharacterApi(worldId.value, payload)
      message.success('角色已创建')
    }
    showFormModal.value = false
    editingCharacter.value = null
    await loadCharacters()
  } catch (err: any) {
    message.error(err?.message || '保存角色失败')
  } finally {
    saving.value = false
  }
}

/**
 * 角色 AI 生成功能与世界模块保持同一职责分层：
 * 由弹窗负责收集当前表单数据，页面负责调用 API，并把返回结果再回填给弹窗。
 * 这里严格按前端 interface 发送 `CreateCharacterReq` 结构。
 * 同时根据联调得到的真实返回值，优先读取 `enhanced_character`，避免把包装对象本身误当成角色数据。
 */
async function handleEnhance(payload: CharacterInput) {
  enhancing.value = true
  try {
    const resp = await generateCharacterApi(payload)
    // 当前角色 AI 接口真实返回的是 { original_character, enhanced_character }。
    // 同时保留旧字段兼容，避免后端联调过程中字段名切换时再次导致表单无法回填。
    const generatedPayload =
      (resp as any)?.enhanced_character ??
      (resp as any)?.original_character ??
      (resp as any)?.enhanced_settings ??
      (resp as any)?.original_settings ??
      resp

    if (!generatedPayload || typeof generatedPayload !== 'object') {
      throw new Error('AI 返回数据格式不正确，无法回填表单')
    }

    formModalRef.value?.applyGeneratedCharacter(generatedPayload)
    message.success('AI 生成完成，角色设定已更新')
  } catch (err: any) {
    message.error(err?.message || 'AI 生成角色失败')
  } finally {
    enhancing.value = false
  }
}

watch(
  () => worldId.value,
  () => {
    void loadCharacters()
  },
  { immediate: true }
)
</script>

<template>
  <div class="worldbook-page">
    <WorldBookHeader
      :world-id="worldId"
      @back="goToWorkshop"
      @create="openCreateModal"
    />

    <WorldBookCharacterList
      :loading="loading"
      :characters="characters"
      @storyline="goToStoryline"
      @edit="openEditModal"
    />

    <CharacterFormModal
      ref="formModalRef"
      v-model:show="showFormModal"
      :world-id="worldId"
      :character="editingCharacter"
      :loading="modalLoading"
      :saving="saving"
      :enhancing="enhancing"
      @submit="handleSubmit"
      @enhance="handleEnhance"
    />
  </div>
</template>

<style scoped lang="scss">
.worldbook-page {
  min-height: 100vh;
  padding: 32px;
  background-color: var(--color-bg-deep);
}

@media (max-width: 768px) {
  .worldbook-page {
    padding: 20px;
  }
}
</style>
