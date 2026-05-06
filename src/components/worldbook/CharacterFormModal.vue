<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  NButton,
  NDivider,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NSpin,
  NSwitch,
  useMessage
} from 'naive-ui'
import {
  AddOutline,
  RemoveOutline,
  SparklesOutline
} from '@vicons/ionicons5'
import type {
  Character,
  CharacterInput
} from '@/types'
import {
  buildCharacterPayload,
  CHARACTER_STATE_OPTIONS,
  createDefaultFormData,
  formatJson,
  LIFE_STAGE_OPTIONS,
  NSFW_LEVEL_OPTIONS,
  type CharacterFormData,
  VIRILITY_OPTIONS
} from './characterForm'

const props = defineProps<{
  show: boolean
  worldId: number
  character?: Character | null
  loading?: boolean
  saving?: boolean
  enhancing?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'submit', payload: CharacterInput): void
  (e: 'enhance', payload: CharacterInput): void
}>()

const message = useMessage()

/**
 * 表单数据在弹窗内部维护。
 * 这样做的原因是：页面层只需要提供“当前编辑对象”和“是否显示”，不需要感知所有细碎字段。
 */
const formData = reactive<CharacterFormData>(createDefaultFormData(props.worldId))
const metadataJson = ref('')
const bodyBuildAdditionalJson = ref('')
const baseAttributesExtraJson = ref('')

const modalTitle = computed(() => (props.character?.id ? '编辑角色' : '创建角色'))

function resetForm(source?: Character | null) {
  Object.assign(formData, createDefaultFormData(props.worldId, source ?? undefined))
  metadataJson.value = formatJson(source?.metadata)
  bodyBuildAdditionalJson.value = formatJson(source?.body_build?.additional)
  baseAttributesExtraJson.value = formatJson(source?.base_attributes?.extra)
}

watch(
  () => [props.show, props.character, props.worldId] as const,
  ([show, character]) => {
    if (!show) return
    resetForm(character)
  },
  { immediate: true }
)

function closeModal() {
  emit('update:show', false)
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
 * 统一从当前表单构建请求体。
 * 提交保存和 AI 生成都依赖同一份清洗逻辑，集中在这里可以确保两条流程的数据结构完全一致。
 */
function buildCurrentPayload(): CharacterInput {
  return buildCharacterPayload(formData, {
      worldId: props.worldId,
      metadataJson: metadataJson.value,
      bodyBuildAdditionalJson: bodyBuildAdditionalJson.value,
      baseAttributesExtraJson: baseAttributesExtraJson.value
    })
}

/**
 * 将 AI 返回的结果重新铺回表单。
 * 这里继续复用默认值工厂，避免手写几十个字段的回填映射，降低后续字段扩展时的维护成本。
 */
function applyGeneratedCharacter(payload?: CharacterInput | null) {
  // AI 接口在联调阶段可能出现“包装层缺失 / 字段为空”的情况，这里先做保护，避免直接读取 undefined 报错。
  if (!payload) {
    throw new Error('AI 返回的角色数据为空，无法回填到表单')
  }

  Object.assign(formData, createDefaultFormData(props.worldId, payload as Character))
  metadataJson.value = formatJson(payload.metadata)
  bodyBuildAdditionalJson.value = formatJson(payload.body_build?.additional)
  baseAttributesExtraJson.value = formatJson(payload.base_attributes?.extra)
}

function handleSubmit() {
  try {
    const payload = buildCurrentPayload()
    emit('submit', payload)
  } catch (err: any) {
    message.error(err?.message || '表单数据有误')
  }
}

function handleEnhance() {
  try {
    const payload = buildCurrentPayload()
    emit('enhance', payload)
  } catch (err: any) {
    message.error(err?.message || '请先完善角色基础信息')
  }
}

defineExpose({
  applyGeneratedCharacter
})
</script>

<template>
  <NModal :show="show" @update:show="emit('update:show', $event)">
    <div class="character-modal">
      <div class="modal-head">
        <div>
          <h2 class="modal-title">{{ modalTitle }}</h2>
          <p class="modal-subtitle">基于最新角色接口填写完整角色档案，保存后会回到当前世界的角色列表。</p>
        </div>
      </div>

      <div v-if="loading" class="modal-loading">
        <NSpin size="large" />
      </div>

      <div v-else class="modal-body">
        <div class="ai-enhance-bar">
          <span class="ai-enhance-hint">填写角色基础信息后，可让 AI 帮你润色并补全角色设定</span>
          <NButton
            size="small"
            secondary
            :loading="enhancing"
            :disabled="enhancing || saving"
            @click="handleEnhance"
          >
            <template #icon>
              <NIcon><SparklesOutline /></NIcon>
            </template>
            AI 生成
          </NButton>
        </div>

        <NForm label-placement="top" :show-feedback="false">
          <NDivider title-placement="left">基础信息</NDivider>

          <div class="form-grid two-cols">
            <NFormItem label="角色名称">
              <NInput v-model:value="formData.name" placeholder="请输入角色名称" />
            </NFormItem>
            <NFormItem label="性别 / 性征">
              <NInput v-model:value="formData.sex" placeholder="如：男、女、无性、可变形" />
            </NFormItem>
          </div>

          <NFormItem label="别名">
            <div class="array-field">
              <div v-for="(alias, index) in formData.name_aliases" :key="`alias-${index}`" class="array-item">
                <NInput
                  :value="alias"
                  placeholder="输入别名"
                  @update:value="formData.name_aliases[index] = $event"
                />
                <NButton text type="error" @click="removeStringItem(formData.name_aliases, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.name_aliases)">
                <template #icon>
                  <NIcon><AddOutline /></NIcon>
                </template>
                添加别名
              </NButton>
            </div>
          </NFormItem>

          <NDivider title-placement="left">生命状态</NDivider>

          <div class="form-grid four-cols">
            <NFormItem label="年龄">
              <NInputNumber v-model:value="formData.age" :min="0" class="full-width" />
            </NFormItem>
            <NFormItem label="生命阶段">
              <NSelect v-model:value="formData.life_stage" :options="LIFE_STAGE_OPTIONS" clearable />
            </NFormItem>
            <NFormItem label="当前状态">
              <NSelect v-model:value="formData.state" :options="CHARACTER_STATE_OPTIONS" clearable />
            </NFormItem>
            <NFormItem label="NSFW 等级">
              <NSelect v-model:value="formData.nsfw_level" :options="NSFW_LEVEL_OPTIONS" clearable />
            </NFormItem>
          </div>

          <div class="form-grid two-cols">
            <NFormItem label="出生纪元">
              <NInput v-model:value="formData.birth_epoch" placeholder="如：神历 210 年" />
            </NFormItem>
            <NFormItem label="死亡纪元">
              <NInput v-model:value="formData.death_epoch" placeholder="未死亡可留空" />
            </NFormItem>
          </div>

          <NDivider title-placement="left">身体特征</NDivider>

          <div class="form-grid two-cols">
            <NFormItem label="种族">
              <NInput v-model:value="formData.species" placeholder="如：人类、精灵、龙裔" />
            </NFormItem>
            <NFormItem label="身高（cm）">
              <NInputNumber v-model:value="formData.height" :min="0" class="full-width" />
            </NFormItem>
          </div>

          <div class="form-grid five-cols">
            <NFormItem label="体型">
              <NInput v-model:value="formData.body_build.build" placeholder="如：匀称" />
            </NFormItem>
            <NFormItem label="肌肉量">
              <NInput v-model:value="formData.body_build.muscle_tone" placeholder="如：紧实" />
            </NFormItem>
            <NFormItem label="体脂">
              <NInput v-model:value="formData.body_build.body_fat" placeholder="如：偏低" />
            </NFormItem>
            <NFormItem label="姿态">
              <NInput v-model:value="formData.body_build.posture" placeholder="如：挺拔" />
            </NFormItem>
            <NFormItem label="四肢特征">
              <NInput v-model:value="formData.body_build.limbs" placeholder="如：修长" />
            </NFormItem>
          </div>

          <NFormItem label="体型附加信息（JSON）">
            <NInput
              v-model:value="bodyBuildAdditionalJson"
              type="textarea"
              :rows="3"
              placeholder='如：{"肩宽":"宽","体态":"军人感"}'
            />
          </NFormItem>

          <div class="form-grid five-cols">
            <NFormItem label="脸型">
              <NInput v-model:value="formData.facial_features.face_shape" />
            </NFormItem>
            <NFormItem label="胡须">
              <NInput v-model:value="formData.facial_features.facial_hair" />
            </NFormItem>
            <NFormItem label="痣">
              <NInput v-model:value="formData.facial_features.beauty_mark" />
            </NFormItem>
            <NFormItem label="表情气质">
              <NInput v-model:value="formData.facial_features.expression" />
            </NFormItem>
            <NFormItem label="雀斑">
              <div class="switch-wrap">
                <NSwitch v-model:value="formData.facial_features.freckles" />
              </div>
            </NFormItem>
          </div>

          <div class="form-grid three-cols">
            <NFormItem label="发色">
              <NInput v-model:value="formData.hair.color" />
            </NFormItem>
            <NFormItem label="发长">
              <NInput v-model:value="formData.hair.length" />
            </NFormItem>
            <NFormItem label="发型">
              <NInput v-model:value="formData.hair.style" />
            </NFormItem>
          </div>

          <div class="form-grid four-cols">
            <NFormItem label="瞳色">
              <NInput v-model:value="formData.eyes.color" />
            </NFormItem>
            <NFormItem label="眼型">
              <NInput v-model:value="formData.eyes.shape" />
            </NFormItem>
            <NFormItem label="眼睛大小">
              <NInput v-model:value="formData.eyes.size" />
            </NFormItem>
            <NFormItem label="瞳孔特征">
              <NInput v-model:value="formData.eyes.pupil" />
            </NFormItem>
          </div>

          <div class="form-grid two-cols">
            <NFormItem label="肤色 / 肤质">
              <NInput v-model:value="formData.skin.complexion" placeholder="肤色" />
            </NFormItem>
            <NFormItem label="皮肤纹理">
              <NInput v-model:value="formData.skin.texture" placeholder="如：细腻、粗糙" />
            </NFormItem>
          </div>

          <NFormItem label="瑕疵">
            <div class="array-field">
              <div v-for="(item, index) in formData.skin.blemishes" :key="`blemish-${index}`" class="array-item">
                <NInput :value="item" @update:value="formData.skin.blemishes[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.skin.blemishes, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.skin.blemishes)">
                添加瑕疵
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="纹身">
            <div class="array-field">
              <div v-for="(item, index) in formData.skin.tattoos" :key="`tattoo-${index}`" class="array-item">
                <NInput :value="item" @update:value="formData.skin.tattoos[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.skin.tattoos, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.skin.tattoos)">
                添加纹身
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="胎记">
            <div class="array-field">
              <div v-for="(item, index) in formData.skin.birthmarks" :key="`birthmark-${index}`" class="array-item">
                <NInput :value="item" @update:value="formData.skin.birthmarks[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.skin.birthmarks, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.skin.birthmarks)">
                添加胎记
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="特殊标记">
            <div class="array-field">
              <div
                v-for="(mark, index) in formData.distinguishing_marks"
                :key="`mark-${index}`"
                class="object-block"
              >
                <div class="form-grid five-cols">
                  <NInput v-model:value="mark.type" placeholder="类型" />
                  <NInput v-model:value="mark.location" placeholder="位置" />
                  <NInput v-model:value="mark.description" placeholder="描述" />
                  <NInput v-model:value="mark.size" placeholder="尺寸" />
                  <NInput v-model:value="mark.visibility" placeholder="可见度" />
                </div>
                <div class="object-actions">
                  <NButton text type="error" @click="removeDistinguishingMark(index)">
                    <template #icon>
                      <NIcon><RemoveOutline /></NIcon>
                    </template>
                    删除标记
                  </NButton>
                </div>
              </div>
              <NButton size="small" quaternary type="primary" @click="addDistinguishingMark">
                <template #icon>
                  <NIcon><AddOutline /></NIcon>
                </template>
                添加特殊标记
              </NButton>
            </div>
          </NFormItem>

          <NDivider title-placement="left">私密设定</NDivider>

          <div class="form-grid three-cols">
            <NFormItem label="胸部尺寸">
              <NInput v-model:value="formData.intimate_details.breast_size" />
            </NFormItem>
            <NFormItem label="体毛">
              <NInput v-model:value="formData.intimate_details.body_hair" />
            </NFormItem>
            <NFormItem label="阴毛样式">
              <NInput v-model:value="formData.intimate_details.pubic_hair_style" />
            </NFormItem>
          </div>

          <div class="form-grid three-cols">
            <NFormItem label="乳晕颜色">
              <NInput v-model:value="formData.intimate_details.areola_color" />
            </NFormItem>
            <NFormItem label="乳头特征">
              <NInput v-model:value="formData.intimate_details.nipple_type" />
            </NFormItem>
            <NFormItem label="处女膜状态">
              <NInput v-model:value="formData.intimate_details.hymen_status" />
            </NFormItem>
          </div>

          <NFormItem label="私密医疗备注">
            <NInput v-model:value="formData.intimate_details.medical_notes" type="textarea" :rows="2" />
          </NFormItem>

          <NFormItem label="私密疤痕">
            <div class="array-field">
              <div
                v-for="(item, index) in formData.intimate_details.scars_intimate"
                :key="`scar-intimate-${index}`"
                class="array-item"
              >
                <NInput :value="item" @update:value="formData.intimate_details.scars_intimate[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.intimate_details.scars_intimate, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.intimate_details.scars_intimate)">
                添加私密疤痕
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="私密穿孔">
            <div class="array-field">
              <div
                v-for="(item, index) in formData.intimate_details.piercings_intimate"
                :key="`piercing-intimate-${index}`"
                class="array-item"
              >
                <NInput :value="item" @update:value="formData.intimate_details.piercings_intimate[index] = $event" />
                <NButton
                  text
                  type="error"
                  @click="removeStringItem(formData.intimate_details.piercings_intimate, index)"
                >
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton
                size="small"
                quaternary
                type="primary"
                @click="addStringItem(formData.intimate_details.piercings_intimate)"
              >
                添加私密穿孔
              </NButton>
            </div>
          </NFormItem>

          <div class="form-grid three-cols">
            <NFormItem label="性欲水平">
              <NInput v-model:value="formData.intimacy_settings.libido_level" />
            </NFormItem>
            <NFormItem label="经验水平">
              <NInput v-model:value="formData.intimacy_settings.experience_level" />
            </NFormItem>
            <NFormItem label="生育 / 性能力">
              <NSelect v-model:value="formData.intimacy_settings.virility" :options="VIRILITY_OPTIONS" />
            </NFormItem>
          </div>

          <NFormItem label="偏好触发点">
            <div class="array-field">
              <div v-for="(item, index) in formData.intimacy_settings.turn_ons" :key="`turn-on-${index}`" class="array-item">
                <NInput :value="item" @update:value="formData.intimacy_settings.turn_ons[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.intimacy_settings.turn_ons, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.intimacy_settings.turn_ons)">
                添加偏好点
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="厌恶点">
            <div class="array-field">
              <div
                v-for="(item, index) in formData.intimacy_settings.turn_offs"
                :key="`turn-off-${index}`"
                class="array-item"
              >
                <NInput :value="item" @update:value="formData.intimacy_settings.turn_offs[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.intimacy_settings.turn_offs, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.intimacy_settings.turn_offs)">
                添加厌恶点
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="边界">
            <div class="array-field">
              <div
                v-for="(item, index) in formData.intimacy_settings.boundaries"
                :key="`boundary-${index}`"
                class="array-item"
              >
                <NInput :value="item" @update:value="formData.intimacy_settings.boundaries[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.intimacy_settings.boundaries, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.intimacy_settings.boundaries)">
                添加边界
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="偏好风格">
            <div class="array-field">
              <div
                v-for="(item, index) in formData.intimacy_settings.preferred_style"
                :key="`preferred-style-${index}`"
                class="array-item"
              >
                <NInput :value="item" @update:value="formData.intimacy_settings.preferred_style[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.intimacy_settings.preferred_style, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton
                size="small"
                quaternary
                type="primary"
                @click="addStringItem(formData.intimacy_settings.preferred_style)"
              >
                添加偏好风格
              </NButton>
            </div>
          </NFormItem>

          <NDivider title-placement="left">人格与心理</NDivider>

          <NFormItem label="核心欲望">
            <NInput v-model:value="formData.core_desire" type="textarea" :rows="2" />
          </NFormItem>

          <div class="form-grid five-cols">
            <NFormItem label="开放性">
              <NInputNumber v-model:value="formData.personality_traits.openness" :min="0" :max="100" class="full-width" />
            </NFormItem>
            <NFormItem label="尽责性">
              <NInputNumber
                v-model:value="formData.personality_traits.conscientiousness"
                :min="0"
                :max="100"
                class="full-width"
              />
            </NFormItem>
            <NFormItem label="外向性">
              <NInputNumber v-model:value="formData.personality_traits.extraversion" :min="0" :max="100" class="full-width" />
            </NFormItem>
            <NFormItem label="宜人性">
              <NInputNumber v-model:value="formData.personality_traits.agreeableness" :min="0" :max="100" class="full-width" />
            </NFormItem>
            <NFormItem label="神经质">
              <NInputNumber v-model:value="formData.personality_traits.neuroticism" :min="0" :max="100" class="full-width" />
            </NFormItem>
          </div>

          <NFormItem label="人格标签">
            <div class="array-field">
              <div v-for="(item, index) in formData.personality_traits.tags" :key="`trait-tag-${index}`" class="array-item">
                <NInput :value="item" @update:value="formData.personality_traits.tags[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.personality_traits.tags, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.personality_traits.tags)">
                添加人格标签
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="价值观">
            <div class="array-field">
              <div v-for="(item, index) in formData.personality_traits.values" :key="`value-${index}`" class="array-item">
                <NInput :value="item" @update:value="formData.personality_traits.values[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.personality_traits.values, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.personality_traits.values)">
                添加价值观
              </NButton>
            </div>
          </NFormItem>

          <div class="form-grid four-cols">
            <NFormItem label="主要情绪">
              <NInput v-model:value="formData.emotional_state.primary" />
            </NFormItem>
            <NFormItem label="情绪强度">
              <NInputNumber v-model:value="formData.emotional_state.intensity" :min="0" :max="100" class="full-width" />
            </NFormItem>
            <NFormItem label="心境">
              <NInput v-model:value="formData.emotional_state.mood" />
            </NFormItem>
            <NFormItem label="稳定性">
              <NInput v-model:value="formData.emotional_state.stability" />
            </NFormItem>
          </div>

          <NFormItem label="次级情绪">
            <div class="array-field">
              <div v-for="(item, index) in formData.emotional_state.secondary" :key="`secondary-${index}`" class="array-item">
                <NInput :value="item" @update:value="formData.emotional_state.secondary[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.emotional_state.secondary, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.emotional_state.secondary)">
                添加次级情绪
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="恐惧">
            <div class="array-field">
              <div v-for="(item, index) in formData.fears.fears" :key="`fear-${index}`" class="array-item">
                <NInput :value="item" @update:value="formData.fears.fears[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.fears.fears, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.fears.fears)">添加恐惧</NButton>
            </div>
          </NFormItem>

          <NFormItem label="恐惧症">
            <div class="array-field">
              <div v-for="(item, index) in formData.fears.phobias" :key="`phobia-${index}`" class="array-item">
                <NInput :value="item" @update:value="formData.fears.phobias[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.fears.phobias, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.fears.phobias)">
                添加恐惧症
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="弱点">
            <div class="array-field">
              <div v-for="(item, index) in formData.fears.weaknesses" :key="`weakness-${index}`" class="array-item">
                <NInput :value="item" @update:value="formData.fears.weaknesses[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.fears.weaknesses, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.fears.weaknesses)">
                添加弱点
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="触发点">
            <div class="array-field">
              <div v-for="(item, index) in formData.fears.triggers" :key="`trigger-${index}`" class="array-item">
                <NInput :value="item" @update:value="formData.fears.triggers[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.fears.triggers, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.fears.triggers)">添加触发点</NButton>
            </div>
          </NFormItem>

          <NFormItem label="不安全感">
            <div class="array-field">
              <div
                v-for="(item, index) in formData.fears.insecurities"
                :key="`insecurity-${index}`"
                class="array-item"
              >
                <NInput :value="item" @update:value="formData.fears.insecurities[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.fears.insecurities, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.fears.insecurities)">
                添加不安全感
              </NButton>
            </div>
          </NFormItem>

          <div class="form-grid three-cols">
            <NFormItem label="道德阵营">
              <NInput v-model:value="formData.moral_compass.alignment" />
            </NFormItem>
            <NFormItem label="灰色地带">
              <NInput v-model:value="formData.moral_compass.moral_gray" />
            </NFormItem>
            <NFormItem label="忠诚对象">
              <NInput v-model:value="formData.moral_compass.loyalty" />
            </NFormItem>
          </div>

          <NFormItem label="道德原则">
            <div class="array-field">
              <div
                v-for="(item, index) in formData.moral_compass.principles"
                :key="`principle-${index}`"
                class="array-item"
              >
                <NInput :value="item" @update:value="formData.moral_compass.principles[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.moral_compass.principles, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.moral_compass.principles)">
                添加原则
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="禁忌">
            <div class="array-field">
              <div v-for="(item, index) in formData.moral_compass.taboos" :key="`taboo-${index}`" class="array-item">
                <NInput :value="item" @update:value="formData.moral_compass.taboos[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.moral_compass.taboos, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.moral_compass.taboos)">添加禁忌</NButton>
            </div>
          </NFormItem>

          <NDivider title-placement="left">属性与技能</NDivider>

          <div class="form-grid six-cols">
            <NFormItem label="力量">
              <NInputNumber v-model:value="formData.base_attributes.strength" class="full-width" />
            </NFormItem>
            <NFormItem label="敏捷">
              <NInputNumber v-model:value="formData.base_attributes.dexterity" class="full-width" />
            </NFormItem>
            <NFormItem label="体质">
              <NInputNumber v-model:value="formData.base_attributes.constitution" class="full-width" />
            </NFormItem>
            <NFormItem label="智力">
              <NInputNumber v-model:value="formData.base_attributes.intelligence" class="full-width" />
            </NFormItem>
            <NFormItem label="感知">
              <NInputNumber v-model:value="formData.base_attributes.wisdom" class="full-width" />
            </NFormItem>
            <NFormItem label="魅力">
              <NInputNumber v-model:value="formData.base_attributes.charisma" class="full-width" />
            </NFormItem>
          </div>

          <NFormItem label="基础属性扩展字段（JSON）">
            <NInput
              v-model:value="baseAttributesExtraJson"
              type="textarea"
              :rows="3"
              placeholder='如：{"luck":80,"mana":120}'
            />
          </NFormItem>

          <NFormItem label="技能">
            <div class="array-field">
              <div v-for="(skill, index) in formData.skills" :key="`skill-${index}`" class="object-block">
                <div class="form-grid four-cols">
                  <NInput v-model:value="skill.name" placeholder="技能名" />
                  <NInputNumber v-model:value="skill.level" :min="0" :max="100" class="full-width" placeholder="熟练度" />
                  <NInput v-model:value="skill.category" placeholder="分类" />
                  <NInput v-model:value="skill.description" placeholder="描述" />
                </div>
                <div class="object-actions">
                  <NButton text type="error" @click="removeSkill(index)">
                    <template #icon>
                      <NIcon><RemoveOutline /></NIcon>
                    </template>
                    删除技能
                  </NButton>
                </div>
              </div>
              <NButton size="small" quaternary type="primary" @click="addSkill">
                <template #icon>
                  <NIcon><AddOutline /></NIcon>
                </template>
                添加技能
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="疤痕">
            <div class="array-field">
              <div v-for="(item, index) in formData.scars_conditions.scars" :key="`scar-${index}`" class="array-item">
                <NInput :value="item" @update:value="formData.scars_conditions.scars[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.scars_conditions.scars, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.scars_conditions.scars)">添加疤痕</NButton>
            </div>
          </NFormItem>

          <NFormItem label="伤病">
            <div class="array-field">
              <div
                v-for="(item, index) in formData.scars_conditions.injuries"
                :key="`injury-${index}`"
                class="array-item"
              >
                <NInput :value="item" @update:value="formData.scars_conditions.injuries[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.scars_conditions.injuries, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.scars_conditions.injuries)">
                添加伤病
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="慢性病">
            <div class="array-field">
              <div
                v-for="(item, index) in formData.scars_conditions.chronic_disease"
                :key="`chronic-${index}`"
                class="array-item"
              >
                <NInput :value="item" @update:value="formData.scars_conditions.chronic_disease[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.scars_conditions.chronic_disease, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton
                size="small"
                quaternary
                type="primary"
                @click="addStringItem(formData.scars_conditions.chronic_disease)"
              >
                添加慢性病
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="残障">
            <div class="array-field">
              <div
                v-for="(item, index) in formData.scars_conditions.disabilities"
                :key="`disability-${index}`"
                class="array-item"
              >
                <NInput :value="item" @update:value="formData.scars_conditions.disabilities[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.scars_conditions.disabilities, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.scars_conditions.disabilities)">
                添加残障
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="义体 / 假肢">
            <div class="array-field">
              <div
                v-for="(item, index) in formData.scars_conditions.prosthetics"
                :key="`prosthetic-${index}`"
                class="array-item"
              >
                <NInput :value="item" @update:value="formData.scars_conditions.prosthetics[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.scars_conditions.prosthetics, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.scars_conditions.prosthetics)">
                添加义体
              </NButton>
            </div>
          </NFormItem>

          <NFormItem label="精神创伤">
            <div class="array-field">
              <div
                v-for="(item, index) in formData.scars_conditions.mental_trauma"
                :key="`trauma-${index}`"
                class="array-item"
              >
                <NInput :value="item" @update:value="formData.scars_conditions.mental_trauma[index] = $event" />
                <NButton text type="error" @click="removeStringItem(formData.scars_conditions.mental_trauma, index)">
                  <template #icon>
                    <NIcon><RemoveOutline /></NIcon>
                  </template>
                </NButton>
              </div>
              <NButton size="small" quaternary type="primary" @click="addStringItem(formData.scars_conditions.mental_trauma)">
                添加精神创伤
              </NButton>
            </div>
          </NFormItem>

          <NDivider title-placement="left">背景与扩展</NDivider>

          <NFormItem label="外观描述">
            <NInput v-model:value="formData.appearance" type="textarea" :rows="3" />
          </NFormItem>

          <NFormItem label="背景故事">
            <NInput v-model:value="formData.backstory" type="textarea" :rows="4" />
          </NFormItem>

          <NFormItem label="当前位置">
            <NInput v-model:value="formData.current_location" />
          </NFormItem>

          <NFormItem label="元数据（JSON）">
            <NInput
              v-model:value="metadataJson"
              type="textarea"
              :rows="4"
              placeholder='如：{"阵营":"北境","身份":"王室顾问"}'
            />
          </NFormItem>
        </NForm>
      </div>

      <div class="modal-footer">
        <NSpace justify="end">
          <NButton @click="closeModal">取消</NButton>
          <NButton type="primary" :loading="saving" @click="handleSubmit">保存</NButton>
        </NSpace>
      </div>
    </div>
  </NModal>
</template>

<style scoped lang="scss">
.character-modal {
  width: min(1100px, calc(100vw - 32px));
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.modal-head {
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  margin: 0 0 8px;
  font-size: 24px;
  color: var(--color-text-body);
}

.modal-subtitle {
  margin: 0;
  color: var(--color-text-desc);
  line-height: 1.7;
}

.modal-loading {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  flex: 1;
  padding: 8px 24px 24px;
  overflow: auto;
}

.ai-enhance-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 14px;
  border: 1px solid rgba(180, 142, 255, 0.18);
  border-radius: var(--radius-md);
  background: rgba(180, 142, 255, 0.06);
}

.ai-enhance-hint {
  color: var(--color-text-desc);
  line-height: 1.7;
}

.modal-footer {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--color-border);
}

.form-grid {
  display: grid;
  gap: 12px;
}

.two-cols {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.three-cols {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.four-cols {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.five-cols {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.six-cols {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.array-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.array-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.object-block {
  padding: 12px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.02);
}

.object-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.switch-wrap {
  min-height: 40px;
  display: flex;
  align-items: center;
}

.full-width {
  width: 100%;
}

@media (max-width: 1024px) {
  .three-cols,
  .four-cols,
  .five-cols,
  .six-cols {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .ai-enhance-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .two-cols,
  .three-cols,
  .four-cols,
  .five-cols,
  .six-cols {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>
