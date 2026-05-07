<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import {
  NInput, NSelect, NSwitch, NButton, NFormItem, NDivider, NIcon
} from 'naive-ui'
import { AddOutline, RemoveOutline } from '@vicons/ionicons5'
import type { WorldSettings, MagicType, TechLevel, EconomyType } from '@/types'

/** 魔法体系选项 */
const MAGIC_OPTIONS: { label: string; value: MagicType }[] = [
  { label: '无魔法', value: 'none' },
  { label: '低魔', value: 'low' },
  { label: '高魔', value: 'high' },
  { label: '独特体系', value: 'unique' }
]

/** 科技等级选项 */
const TECH_OPTIONS: { label: string; value: TechLevel }[] = [
  { label: '石器时代', value: 'stone_age' },
  { label: '中世纪', value: 'medieval' },
  { label: '文艺复兴', value: 'renaissance' },
  { label: '工业时代', value: 'industrial' },
  { label: '现代', value: 'modern' },
  { label: '未来', value: 'future' },
  { label: '科幻', value: 'scifi' }
]

/** 经济类型选项 */
const ECONOMY_OPTIONS: { label: string; value: EconomyType }[] = [
  { label: '以物易物', value: 'barter' },
  { label: '货币经济', value: 'currency' },
  { label: '资源配给', value: 'resource' },
  { label: '后稀缺', value: 'post_scarcity' }
]

// ==================== Props & Emits ====================

const props = defineProps<{
  settings?: WorldSettings
  pageMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'change'): void
}>()

// ==================== 表单数据 ====================

/** 创建默认的空白设定 */
function createDefaultSettings(src?: WorldSettings): WorldSettings {
  return {
    description: src?.description ?? '',
    epoch: src?.epoch ?? '',
    current_year: src?.current_year ?? undefined,
    core_rules: src?.core_rules ?? [],
    themes: src?.themes ?? [],
    tags: src?.tags ?? [],
    magic_system: src?.magic_system ?? undefined,
    tech_level: src?.tech_level ?? undefined,
    economy_type: src?.economy_type ?? undefined,
    government: src?.government ?? '',
    religion: src?.religion ?? '',
    regions: src?.regions ? src.regions.map(r => ({ ...r, notable_places: r.notable_places ?? [] })) : [],
    factions: src?.factions ?? [],
    major_cities: src?.major_cities ?? [],
    races: src?.races ?? [],
    nsfw_enabled: src?.nsfw_enabled ?? false,
    evolution_enabled: src?.evolution_enabled ?? false,
    metadata: src?.metadata ?? undefined
  }
}

const formData = reactive<WorldSettings>(createDefaultSettings(props.settings))

/** metadata 的 JSON 文本输入（用于表单绑定） */
const metadataJson = computed({
  get: () => {
    if (!formData.metadata) return ''
    try {
      return JSON.stringify(formData.metadata, null, 2)
    } catch {
      return String(formData.metadata)
    }
  },
  set: (val: string) => {
    if (!val.trim()) {
      formData.metadata = undefined
      return
    }
    try {
      formData.metadata = JSON.parse(val.trim())
    } catch {
      // 解析失败时保持原值，不更新
    }
  }
})

/** 监听外部 settings 变化（编辑模式下切换世界时自动更新表单） */
watch(() => props.settings, (val) => {
  reset(val)
}, { deep: true })

/**
 * 把内部表单变化同步通知给父级页面。
 * 页面层会基于这个事件更新“未保存状态”和实时校验提示，而不需要逐个关心所有字段。
 */
watch(
  formData,
  () => {
    emit('change')
  },
  { deep: true }
)

// ==================== 数组字段操作方法 ====================

function addArrayItem(field: keyof WorldSettings) {
  const arr = formData[field]
  if (Array.isArray(arr)) {
    ;(arr as any[]).push('')
  }
}

function removeArrayItem(field: keyof WorldSettings, index: number) {
  const arr = formData[field]
  if (Array.isArray(arr)) {
    arr.splice(index, 1)
  }
}

// ==================== Region 操作方法 ====================

function addRegion() {
  formData.regions!.push({ name: '', description: '', climate: '', notable_places: [] })
}

function removeRegion(index: number) {
  formData.regions!.splice(index, 1)
}

function addNotablePlace(regionIndex: number) {
  formData.regions![regionIndex].notable_places!.push('')
}

function removeNotablePlace(regionIndex: number, placeIndex: number) {
  formData.regions![regionIndex].notable_places!.splice(placeIndex, 1)
}

// ==================== 导出方法 ====================

/** 获取当前表单数据，清理空值后返回 */
function getSettings(): WorldSettings {
  const result: WorldSettings = {}

  if (formData.description) result.description = formData.description
  if (formData.epoch) result.epoch = formData.epoch
  if (formData.current_year !== undefined && formData.current_year > 0) result.current_year = formData.current_year
  if (formData.core_rules!.length > 0) result.core_rules = [...formData.core_rules!]
  if (formData.themes!.length > 0) result.themes = [...formData.themes!]
  if (formData.tags!.length > 0) result.tags = [...formData.tags!]
  if (formData.magic_system) result.magic_system = formData.magic_system
  if (formData.tech_level) result.tech_level = formData.tech_level
  if (formData.economy_type) result.economy_type = formData.economy_type
  if (formData.government) result.government = formData.government
  if (formData.religion) result.religion = formData.religion
  if (formData.regions!.length > 0) {
    result.regions = formData.regions!.map(r => ({
      ...r,
      notable_places: r.notable_places && r.notable_places.length > 0
        ? r.notable_places.filter(p => p.trim())
        : undefined
    })).filter(r => r.name.trim())
  }
  if (formData.factions!.length > 0) result.factions = [...formData.factions!]
  if (formData.major_cities!.length > 0) result.major_cities = [...formData.major_cities!]
  if (formData.races!.length > 0) result.races = [...formData.races!]
  if (formData.nsfw_enabled) result.nsfw_enabled = true
  if (formData.evolution_enabled) result.evolution_enabled = true
  if (formData.metadata && Object.keys(formData.metadata).length > 0) result.metadata = { ...formData.metadata }

  return result
}

/** 重置表单 */
function reset(src?: WorldSettings) {
  Object.assign(formData, createDefaultSettings(src))
}

/**
 * 返回一个稳定的草稿快照字符串，供页面层判断是否存在未保存修改。
 * 这里直接基于表单原始值序列化，避免因为 `getSettings()` 会清理空值而丢失“用户正在编辑但尚未成型”的变化。
 */
function getDraftSnapshot(): string {
  return JSON.stringify({
    formData,
    metadataJson: metadataJson.value
  })
}

defineExpose({ getSettings, reset, getDraftSnapshot })
</script>

<template>
  <div class="settings-form" :class="{ 'settings-form--page': pageMode }">
    <!-- ==================== 基础设定 ==================== -->
    <NDivider title-placement="left">基础设定</NDivider>

    <NFormItem label="描述" label-placement="top">
      <NInput
        v-model:value="formData.description!"
        type="textarea"
        placeholder="世界观的简要描述……"
        :rows="3"
      />
    </NFormItem>

    <div class="form-row">
      <NFormItem label="纪元名称" label-placement="top" class="flex-1">
        <NInput
          v-model:value="formData.epoch!"
          placeholder="如：大陆历、星元历"
        />
      </NFormItem>
      <NFormItem label="当前年份" label-placement="top" class="flex-1">
        <NInput
          :value="formData.current_year?.toString() ?? ''"
          placeholder="如：1024"
          @update:value="(v: string) => { formData.current_year = v ? parseInt(v, 10) : undefined }"
        />
      </NFormItem>
    </div>

    <!-- ==================== 核心规则 ==================== -->
    <NDivider title-placement="left">核心规则</NDivider>

    <NFormItem label="核心规则" label-placement="top">
      <div class="array-field">
        <div
          v-for="(rule, idx) in formData.core_rules"
          :key="`rule-${idx}`"
          class="array-item"
        >
          <NInput
            :value="rule"
            @update:value="formData.core_rules![idx] = $event"
            placeholder="一条核心规则……"
          />
          <NButton
            text
            type="error"
            class="array-remove-btn"
            @click="removeArrayItem('core_rules', idx)"
          >
            <template #icon>
              <n-icon><RemoveOutline /></n-icon>
            </template>
          </NButton>
        </div>
        <NButton size="small" quaternary type="primary" @click="addArrayItem('core_rules')">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          添加规则
        </NButton>
      </div>
    </NFormItem>

    <NFormItem label="主题" label-placement="top">
      <div class="array-field">
        <div
          v-for="(theme, idx) in formData.themes"
          :key="`theme-${idx}`"
          class="array-item"
        >
          <NInput
            :value="theme"
            @update:value="formData.themes![idx] = $event"
            placeholder="如：黑暗奇幻、蒸汽朋克"
          />
          <NButton
            text
            type="error"
            class="array-remove-btn"
            @click="removeArrayItem('themes', idx)"
          >
            <template #icon>
              <n-icon><RemoveOutline /></n-icon>
            </template>
          </NButton>
        </div>
        <NButton size="small" quaternary type="primary" @click="addArrayItem('themes')">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          添加主题
        </NButton>
      </div>
    </NFormItem>

    <NFormItem label="标签" label-placement="top">
      <div class="array-field">
        <div
          v-for="(tag, idx) in formData.tags"
          :key="`tag-${idx}`"
          class="array-item"
        >
          <NInput
            :value="tag"
            @update:value="formData.tags![idx] = $event"
            placeholder="如：中世纪、政治斗争"
          />
          <NButton
            text
            type="error"
            class="array-remove-btn"
            @click="removeArrayItem('tags', idx)"
          >
            <template #icon>
              <n-icon><RemoveOutline /></n-icon>
            </template>
          </NButton>
        </div>
        <NButton size="small" quaternary type="primary" @click="addArrayItem('tags')">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          添加标签
        </NButton>
      </div>
    </NFormItem>

    <!-- ==================== 世界类型 ==================== -->
    <NDivider title-placement="left">世界类型</NDivider>

    <div class="form-row form-row--3col">
      <NFormItem label="魔法体系" label-placement="top">
        <NSelect
          v-model:value="formData.magic_system"
          :options="MAGIC_OPTIONS"
          placeholder="选择魔法体系"
          clearable
        />
      </NFormItem>
      <NFormItem label="科技等级" label-placement="top">
        <NSelect
          v-model:value="formData.tech_level"
          :options="TECH_OPTIONS"
          placeholder="选择科技等级"
          clearable
        />
      </NFormItem>
      <NFormItem label="经济类型" label-placement="top">
        <NSelect
          v-model:value="formData.economy_type"
          :options="ECONOMY_OPTIONS"
          placeholder="选择经济类型"
          clearable
        />
      </NFormItem>
    </div>

    <!-- ==================== 社会结构 ==================== -->
    <NDivider title-placement="left">社会结构</NDivider>

    <div class="form-row">
      <NFormItem label="政治制度" label-placement="top" class="flex-1">
        <NInput v-model:value="formData.government!" placeholder="如：君主制、联邦制、神权制" />
      </NFormItem>
      <NFormItem label="宗教信仰" label-placement="top" class="flex-1">
        <NInput v-model:value="formData.religion!" placeholder="如：光明圣教、先祖崇拜" />
      </NFormItem>
    </div>

    <NFormItem label="主要势力" label-placement="top">
      <div class="array-field">
        <div
          v-for="(faction, idx) in formData.factions"
          :key="`faction-${idx}`"
          class="array-item"
        >
          <NInput
            :value="faction"
            @update:value="formData.factions![idx] = $event"
            placeholder="如：暗影兄弟会"
          />
          <NButton
            text
            type="error"
            class="array-remove-btn"
            @click="removeArrayItem('factions', idx)"
          >
            <template #icon>
              <n-icon><RemoveOutline /></n-icon>
            </template>
          </NButton>
        </div>
        <NButton size="small" quaternary type="primary" @click="addArrayItem('factions')">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          添加势力
        </NButton>
      </div>
    </NFormItem>

    <NFormItem label="主要城市" label-placement="top">
      <div class="array-field">
        <div
          v-for="(city, idx) in formData.major_cities"
          :key="`city-${idx}`"
          class="array-item"
        >
          <NInput
            :value="city"
            @update:value="formData.major_cities![idx] = $event"
            placeholder="如：王都·艾尔登"
          />
          <NButton
            text
            type="error"
            class="array-remove-btn"
            @click="removeArrayItem('major_cities', idx)"
          >
            <template #icon>
              <n-icon><RemoveOutline /></n-icon>
            </template>
          </NButton>
        </div>
        <NButton size="small" quaternary type="primary" @click="addArrayItem('major_cities')">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          添加城市
        </NButton>
      </div>
    </NFormItem>

    <NFormItem label="种族" label-placement="top">
      <div class="array-field">
        <div
          v-for="(race, idx) in formData.races"
          :key="`race-${idx}`"
          class="array-item"
        >
          <NInput
            :value="race"
            @update:value="formData.races![idx] = $event"
            placeholder="如：人类、精灵、矮人"
          />
          <NButton
            text
            type="error"
            class="array-remove-btn"
            @click="removeArrayItem('races', idx)"
          >
            <template #icon>
              <n-icon><RemoveOutline /></n-icon>
            </template>
          </NButton>
        </div>
        <NButton size="small" quaternary type="primary" @click="addArrayItem('races')">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          添加种族
        </NButton>
      </div>
    </NFormItem>

    <!-- ==================== 地理区域 ==================== -->
    <NDivider title-placement="left">地理区域</NDivider>

    <div class="regions-field">
      <div
        v-for="(region, rIdx) in formData.regions"
        :key="`region-${rIdx}`"
        class="region-card"
      >
        <div class="region-card-header">
          <span class="region-card-title">区域 {{ rIdx + 1 }}</span>
          <NButton text type="error" size="small" @click="removeRegion(rIdx)">
            <template #icon>
              <n-icon><RemoveOutline /></n-icon>
            </template>
            删除
          </NButton>
        </div>
        <div class="form-row">
          <NFormItem label="名称" label-placement="top" class="flex-1">
            <NInput v-model:value="region.name" placeholder="区域名称" />
          </NFormItem>
          <NFormItem label="气候" label-placement="top" class="flex-1">
            <NInput v-model:value="region.climate!" placeholder="如：温带海洋性" />
          </NFormItem>
        </div>
        <NFormItem label="描述" label-placement="top">
          <NInput
            v-model:value="region.description!"
            type="textarea"
            :rows="2"
            placeholder="区域的详细描述……"
          />
        </NFormItem>
        <NFormItem label="著名地点" label-placement="top">
          <div class="array-field">
            <div
              v-for="(place, pIdx) in region.notable_places"
              :key="`place-${rIdx}-${pIdx}`"
              class="array-item"
            >
              <NInput
                :value="place"
                @update:value="region.notable_places![pIdx] = $event"
                placeholder="如：龙脊峰"
              />
              <NButton
                text
                type="error"
                class="array-remove-btn"
                @click="removeNotablePlace(rIdx, pIdx)"
              >
                <template #icon>
                  <n-icon><RemoveOutline /></n-icon>
                </template>
              </NButton>
            </div>
            <NButton size="small" quaternary type="primary" @click="addNotablePlace(rIdx)">
              <template #icon>
                <n-icon><AddOutline /></n-icon>
              </template>
              添加地点
            </NButton>
          </div>
        </NFormItem>
      </div>
      <NButton size="small" quaternary type="primary" @click="addRegion">
        <template #icon>
          <n-icon><AddOutline /></n-icon>
        </template>
        添加区域
      </NButton>
    </div>

    <!-- ==================== 高级选项 ==================== -->
    <NDivider title-placement="left">高级选项</NDivider>

    <div class="form-row">
      <NFormItem label="NSFW 内容" label-placement="top">
        <NSwitch v-model:value="formData.nsfw_enabled!" />
      </NFormItem>
      <NFormItem label="世界演化" label-placement="top">
        <NSwitch v-model:value="formData.evolution_enabled!" />
      </NFormItem>
    </div>

    <NFormItem label="元数据 (JSON)" label-placement="top">
      <NInput
        v-model:value="metadataJson"
        type="textarea"
        :rows="4"
        placeholder='如：{"source": "原创", "mood": "黑暗"}'
      />
    </NFormItem>
  </div>
</template>

<style scoped lang="scss">
.settings-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;

  // 滚动条美化
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--color-border);
    border-radius: 2px;
  }
}

.settings-form--page {
  max-height: none;
  overflow: visible;
  padding-right: 0;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row--3col {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.flex-1 {
  flex: 1;
}

// ==================== 数组字段（标签/规则等） ====================
.array-field {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.array-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.array-remove-btn {
  flex-shrink: 0;
}

// ==================== 区域卡片 ====================
.regions-field {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.region-card {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: rgba(255, 255, 255, 0.02);
}

.region-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.region-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-body);
}

// ==================== Naive UI 样式覆盖 ====================
:deep(.n-form-item-label) {
  font-size: 13px;
  color: var(--color-text-desc);
}

:deep(.n-divider) {
  margin-top: 24px;
  margin-bottom: 16px;

  .n-divider__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-body);
  }
}

:deep(.n-input) {
  --n-color: rgba(255, 255, 255, 0.04);
  --n-color-focus: rgba(255, 255, 255, 0.06);
  --n-border: 1px solid var(--color-border);
  --n-border-focus: 1px solid var(--color-primary);
  --n-box-shadow-focus: 0 0 0 3px rgba(180, 142, 255, 0.15);
  --n-text-color: var(--color-text-body);
  --n-placeholder-color: var(--color-text-muted);
  --n-caret-color: var(--color-primary);
  --n-border-hover: 1px solid var(--color-border-hover);
  border-radius: var(--radius-sm);
}

:deep(.n-select) {
  .n-base-selection {
    --n-color: rgba(255, 255, 255, 0.04);
    --n-color-focus: rgba(255, 255, 255, 0.06);
    --n-border: 1px solid var(--color-border);
    --n-border-focus: 1px solid var(--color-primary);
    --n-box-shadow-focus: 0 0 0 3px rgba(180, 142, 255, 0.15);
    --n-text-color: var(--color-text-body);
    --n-placeholder-color: var(--color-text-muted);
    --n-caret-color: var(--color-primary);
    --n-border-hover: 1px solid var(--color-border-hover);
    border-radius: var(--radius-sm);
  }
}

</style>
