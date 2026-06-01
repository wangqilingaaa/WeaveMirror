import { reactive, ref } from 'vue'
import type { Ref } from 'vue'
import type { Character, CharacterInput } from '@/types'
import {
  buildCharacterPayload,
  createDefaultFormData,
  formatJson,
  type CharacterFormData
} from './characterForm'

/**
 * 角色表单状态的共享封装。
 *
 * 设计原因：
 * 1. 页面版和弹窗版角色表单的字段结构完全一致，但之前各自维护一套脚本逻辑，修改成本很高。
 * 2. 这里抽离的是“状态、重置、构造 payload、AI 回填、增删数组项”等纯逻辑，不碰模板结构，避免一次性重写超大表单。
 * 3. 后续如果再增加第三种角色编辑入口，只需要复用这一个组合式函数即可。
 */
export function useCharacterFormState(worldId: Ref<number>) {
  const formData = reactive<CharacterFormData>(createDefaultFormData(worldId.value))
  const metadataJson = ref('')
  const bodyBuildAdditionalJson = ref('')
  const baseAttributesExtraJson = ref('')

  function resetForm(source?: Character | null) {
    Object.assign(formData, createDefaultFormData(worldId.value, source ?? undefined))
    metadataJson.value = formatJson(source?.metadata)
    bodyBuildAdditionalJson.value = formatJson(source?.body_build?.additional)
    baseAttributesExtraJson.value = formatJson(source?.base_attributes?.extra)
  }

  function addStringItem(list: string[]) {
    list.push('')
  }

  function removeStringItem(list: string[], index: number) {
    list.splice(index, 1)
  }

  function addDistinguishingMark() {
    formData.distinguishing_marks.push({
      type: '',
      location: '',
      description: '',
      size: '',
      visibility: ''
    })
  }

  function removeDistinguishingMark(index: number) {
    formData.distinguishing_marks.splice(index, 1)
  }

  function addSkill() {
    formData.skills.push({
      name: '',
      level: null,
      category: '',
      description: ''
    })
  }

  function removeSkill(index: number) {
    formData.skills.splice(index, 1)
  }

  /**
   * 统一构建角色请求体。
   * 页面保存、弹窗保存、AI 增强三条链路都依赖这里，保证清洗规则始终一致。
   */
  function buildPayload(): CharacterInput {
    return buildCharacterPayload(formData, {
      worldId: worldId.value,
      metadataJson: metadataJson.value,
      bodyBuildAdditionalJson: bodyBuildAdditionalJson.value,
      baseAttributesExtraJson: baseAttributesExtraJson.value
    })
  }

  function getDraftSnapshot(): string {
    return JSON.stringify({
      formData,
      metadataJson: metadataJson.value,
      bodyBuildAdditionalJson: bodyBuildAdditionalJson.value,
      baseAttributesExtraJson: baseAttributesExtraJson.value
    })
  }

  function applyGeneratedCharacter(payload?: CharacterInput | null) {
    if (!payload) {
      throw new Error('AI 返回的角色数据为空，无法回填到表单')
    }

    Object.assign(formData, createDefaultFormData(worldId.value, payload as Character))
    metadataJson.value = formatJson(payload.metadata)
    bodyBuildAdditionalJson.value = formatJson(payload.body_build?.additional)
    baseAttributesExtraJson.value = formatJson(payload.base_attributes?.extra)
  }

  return {
    formData,
    metadataJson,
    bodyBuildAdditionalJson,
    baseAttributesExtraJson,
    changeWatchSources: [formData, metadataJson, bodyBuildAdditionalJson, baseAttributesExtraJson] as const,
    resetForm,
    addStringItem,
    removeStringItem,
    addDistinguishingMark,
    removeDistinguishingMark,
    addSkill,
    removeSkill,
    buildPayload,
    getDraftSnapshot,
    applyGeneratedCharacter
  }
}
