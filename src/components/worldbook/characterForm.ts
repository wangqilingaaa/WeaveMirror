import type {
  Character,
  CharacterInput,
  CharacterState,
  LifeStage,
  NSFWLevel
} from '@/types'

/** 生命阶段选项，抽离后可供表单组件直接复用。 */
export const LIFE_STAGE_OPTIONS: { label: string; value: LifeStage }[] = [
  { label: '幼年期', value: '幼年期' },
  { label: '青年期', value: '青年期' },
  { label: '壮年期', value: '壮年期' },
  { label: '中年期', value: '中年期' },
  { label: '老年期', value: '老年期' },
  { label: '暮年期', value: '暮年期' }
]

/** 角色状态选项。 */
export const CHARACTER_STATE_OPTIONS: { label: string; value: CharacterState }[] = [
  { label: '活跃', value: '活跃' },
  { label: '休眠', value: '休眠' },
  { label: '潜伏', value: '潜伏' },
  { label: '死亡', value: '死亡' }
]

/** NSFW 等级选项。 */
export const NSFW_LEVEL_OPTIONS: { label: string; value: NSFWLevel }[] = [
  { label: 'SFW', value: 'sfw' },
  { label: 'Mild', value: 'mild' },
  { label: 'NSFW', value: 'nsfw' }
]

/** 表单中用字符串承载三态布尔值，便于与下拉框绑定。 */
export type VirilityFormValue = '' | 'true' | 'false' | 'null'

/** 生育 / 性能力选项。 */
export const VIRILITY_OPTIONS: { label: string; value: VirilityFormValue }[] = [
  { label: '未设置', value: '' },
  { label: '是', value: 'true' },
  { label: '否', value: 'false' },
  { label: '未知', value: 'null' }
]

/**
 * 创建稳定的表单默认值。
 * 这里故意把所有嵌套对象和数组都初始化出来，避免表单双向绑定时频繁判空。
 */
export function createDefaultFormData(targetWorldId: number, source?: Character) {
  return {
    world_id: targetWorldId,
    name: source?.name ?? '',
    sex: source?.sex ?? '',
    name_aliases: source?.name_aliases ? [...source.name_aliases] : [],
    age: source?.age ?? null,
    life_stage: source?.life_stage ?? null,
    state: source?.state ?? null,
    birth_epoch: source?.birth_epoch ?? '',
    death_epoch: source?.death_epoch ?? '',
    species: source?.species ?? '',
    height: source?.height ?? null,
    body_build: {
      build: source?.body_build?.build ?? '',
      muscle_tone: source?.body_build?.muscle_tone ?? '',
      body_fat: source?.body_build?.body_fat ?? '',
      posture: source?.body_build?.posture ?? '',
      limbs: source?.body_build?.limbs ?? ''
    },
    facial_features: {
      face_shape: source?.facial_features?.face_shape ?? '',
      facial_hair: source?.facial_features?.facial_hair ?? '',
      freckles: source?.facial_features?.freckles ?? false,
      beauty_mark: source?.facial_features?.beauty_mark ?? '',
      expression: source?.facial_features?.expression ?? ''
    },
    hair: {
      color: source?.hair?.color ?? '',
      length: source?.hair?.length ?? '',
      style: source?.hair?.style ?? ''
    },
    eyes: {
      color: source?.eyes?.color ?? '',
      shape: source?.eyes?.shape ?? '',
      size: source?.eyes?.size ?? '',
      pupil: source?.eyes?.pupil ?? ''
    },
    skin: {
      complexion: source?.skin?.complexion ?? '',
      texture: source?.skin?.texture ?? '',
      blemishes: source?.skin?.blemishes ? [...source.skin.blemishes] : [],
      tattoos: source?.skin?.tattoos ? [...source.skin.tattoos] : [],
      birthmarks: source?.skin?.birthmarks ? [...source.skin.birthmarks] : []
    },
    distinguishing_marks: source?.distinguishing_marks
      ? source.distinguishing_marks.map(mark => ({
          type: mark.type ?? '',
          location: mark.location ?? '',
          description: mark.description ?? '',
          size: mark.size ?? '',
          visibility: mark.visibility ?? ''
        }))
      : [],
    nsfw_level: source?.nsfw_level ?? null,
    intimate_details: {
      breast_size: source?.intimate_details?.breast_size ?? '',
      body_hair: source?.intimate_details?.body_hair ?? '',
      pubic_hair_style: source?.intimate_details?.pubic_hair_style ?? '',
      areola_color: source?.intimate_details?.areola_color ?? '',
      nipple_type: source?.intimate_details?.nipple_type ?? '',
      hymen_status: source?.intimate_details?.hymen_status ?? '',
      scars_intimate: source?.intimate_details?.scars_intimate
        ? [...source.intimate_details.scars_intimate]
        : [],
      piercings_intimate: source?.intimate_details?.piercings_intimate
        ? [...source.intimate_details.piercings_intimate]
        : [],
      medical_notes: source?.intimate_details?.medical_notes ?? ''
    },
    intimacy_settings: {
      libido_level: source?.intimacy_settings?.libido_level ?? '',
      experience_level: source?.intimacy_settings?.experience_level ?? '',
      turn_ons: source?.intimacy_settings?.turn_ons ? [...source.intimacy_settings.turn_ons] : [],
      turn_offs: source?.intimacy_settings?.turn_offs ? [...source.intimacy_settings.turn_offs] : [],
      boundaries: source?.intimacy_settings?.boundaries ? [...source.intimacy_settings.boundaries] : [],
      preferred_style: source?.intimacy_settings?.preferred_style
        ? [...source.intimacy_settings.preferred_style]
        : [],
      virility:
        source?.intimacy_settings?.virility === true
          ? 'true'
          : source?.intimacy_settings?.virility === false
            ? 'false'
            : source?.intimacy_settings?.virility === null
              ? 'null'
              : ''
    },
    core_desire: source?.core_desire ?? '',
    personality_traits: {
      openness: source?.personality_traits?.openness ?? null,
      conscientiousness: source?.personality_traits?.conscientiousness ?? null,
      extraversion: source?.personality_traits?.extraversion ?? null,
      agreeableness: source?.personality_traits?.agreeableness ?? null,
      neuroticism: source?.personality_traits?.neuroticism ?? null,
      tags: source?.personality_traits?.tags ? [...source.personality_traits.tags] : [],
      values: source?.personality_traits?.values ? [...source.personality_traits.values] : []
    },
    emotional_state: {
      primary: source?.emotional_state?.primary ?? '',
      intensity: source?.emotional_state?.intensity ?? null,
      secondary: source?.emotional_state?.secondary ? [...source.emotional_state.secondary] : [],
      mood: source?.emotional_state?.mood ?? '',
      stability: source?.emotional_state?.stability ?? ''
    },
    fears: {
      fears: source?.fears?.fears ? [...source.fears.fears] : [],
      phobias: source?.fears?.phobias ? [...source.fears.phobias] : [],
      weaknesses: source?.fears?.weaknesses ? [...source.fears.weaknesses] : [],
      triggers: source?.fears?.triggers ? [...source.fears.triggers] : [],
      insecurities: source?.fears?.insecurities ? [...source.fears.insecurities] : []
    },
    moral_compass: {
      alignment: source?.moral_compass?.alignment ?? '',
      principles: source?.moral_compass?.principles ? [...source.moral_compass.principles] : [],
      moral_gray: source?.moral_compass?.moral_gray ?? '',
      taboos: source?.moral_compass?.taboos ? [...source.moral_compass.taboos] : [],
      loyalty: source?.moral_compass?.loyalty ?? ''
    },
    base_attributes: {
      strength: source?.base_attributes?.strength ?? null,
      dexterity: source?.base_attributes?.dexterity ?? null,
      constitution: source?.base_attributes?.constitution ?? null,
      intelligence: source?.base_attributes?.intelligence ?? null,
      wisdom: source?.base_attributes?.wisdom ?? null,
      charisma: source?.base_attributes?.charisma ?? null
    },
    skills: source?.skills
      ? source.skills.map(skill => ({
          name: skill.name ?? '',
          level: skill.level ?? null,
          category: skill.category ?? '',
          description: skill.description ?? ''
        }))
      : [],
    scars_conditions: {
      scars: source?.scars_conditions?.scars ? [...source.scars_conditions.scars] : [],
      injuries: source?.scars_conditions?.injuries ? [...source.scars_conditions.injuries] : [],
      chronic_disease: source?.scars_conditions?.chronic_disease
        ? [...source.scars_conditions.chronic_disease]
        : [],
      disabilities: source?.scars_conditions?.disabilities ? [...source.scars_conditions.disabilities] : [],
      prosthetics: source?.scars_conditions?.prosthetics ? [...source.scars_conditions.prosthetics] : [],
      mental_trauma: source?.scars_conditions?.mental_trauma
        ? [...source.scars_conditions.mental_trauma]
        : []
    },
    appearance: source?.appearance ?? '',
    backstory: source?.backstory ?? '',
    current_location: source?.current_location ?? ''
  }
}

/** 通过默认值工厂直接推导表单结构，避免维护额外的大型 interface。 */
export type CharacterFormData = ReturnType<typeof createDefaultFormData>

/** 将对象格式化为 JSON 文本，便于在 textarea 中编辑。 */
export function formatJson(value: unknown): string {
  if (!value || (typeof value === 'object' && Object.keys(value as Record<string, unknown>).length === 0)) {
    return ''
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ''
  }
}

function cleanString(value: string | undefined | null): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function cleanStringArray(values: string[]): string[] | undefined {
  const result = values.map(item => item.trim()).filter(Boolean)
  return result.length > 0 ? result : undefined
}

function hasObjectContent(value: Record<string, unknown>): boolean {
  return Object.values(value).some(item => {
    if (typeof item === 'string') return item.trim().length > 0
    if (typeof item === 'number') return Number.isFinite(item)
    if (typeof item === 'boolean') return true
    if (Array.isArray(item)) return item.length > 0
    if (item && typeof item === 'object') return Object.keys(item as Record<string, unknown>).length > 0
    return item !== null && item !== undefined
  })
}

function parseJsonObject<T extends Record<string, unknown>>(text: string, label: string): T | undefined {
  if (!text.trim()) return undefined
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`${label} 需要是合法的 JSON`)
  }
}

/**
 * 把表单值转换成后端需要的 payload。
 * 该函数集中处理所有“清理空值、解析 JSON、压缩无意义字段”的逻辑。
 */
export function buildCharacterPayload(
  formData: CharacterFormData,
  options: {
    worldId: number
    metadataJson: string
    bodyBuildAdditionalJson: string
    baseAttributesExtraJson: string
  }
): CharacterInput {
  const payload: CharacterInput = {
    world_id: options.worldId
  }

  const metadata = parseJsonObject<Record<string, any>>(options.metadataJson, '元数据')
  const bodyBuildAdditional = parseJsonObject<Record<string, any>>(options.bodyBuildAdditionalJson, '体型附加信息')
  const baseAttributesExtra = parseJsonObject<Record<string, number>>(options.baseAttributesExtraJson, '基础属性扩展字段')

  const name = cleanString(formData.name)
  if (!name) {
    throw new Error('角色名称不能为空')
  }
  payload.name = name

  const sex = cleanString(formData.sex)
  if (sex) payload.sex = sex

  const aliases = cleanStringArray(formData.name_aliases)
  if (aliases) payload.name_aliases = aliases

  if (formData.age !== null) payload.age = formData.age
  if (formData.life_stage) payload.life_stage = formData.life_stage
  if (formData.state) payload.state = formData.state

  const birthEpoch = cleanString(formData.birth_epoch)
  const deathEpoch = cleanString(formData.death_epoch)
  if (birthEpoch) payload.birth_epoch = birthEpoch
  if (deathEpoch) payload.death_epoch = deathEpoch

  const species = cleanString(formData.species)
  if (species) payload.species = species
  if (formData.height !== null) payload.height = formData.height

  const bodyBuild = {
    build: cleanString(formData.body_build.build),
    muscle_tone: cleanString(formData.body_build.muscle_tone),
    body_fat: cleanString(formData.body_build.body_fat),
    posture: cleanString(formData.body_build.posture),
    limbs: cleanString(formData.body_build.limbs),
    additional: bodyBuildAdditional
  }
  if (hasObjectContent(bodyBuild as Record<string, unknown>)) {
    payload.body_build = bodyBuild
  }

  const facialFeatures = {
    face_shape: cleanString(formData.facial_features.face_shape),
    facial_hair: cleanString(formData.facial_features.facial_hair),
    freckles: formData.facial_features.freckles || undefined,
    beauty_mark: cleanString(formData.facial_features.beauty_mark),
    expression: cleanString(formData.facial_features.expression)
  }
  if (hasObjectContent(facialFeatures as Record<string, unknown>)) {
    payload.facial_features = facialFeatures
  }

  const hair = {
    color: cleanString(formData.hair.color),
    length: cleanString(formData.hair.length),
    style: cleanString(formData.hair.style)
  }
  if (hasObjectContent(hair as Record<string, unknown>)) {
    payload.hair = hair
  }

  const eyes = {
    color: cleanString(formData.eyes.color),
    shape: cleanString(formData.eyes.shape),
    size: cleanString(formData.eyes.size),
    pupil: cleanString(formData.eyes.pupil)
  }
  if (hasObjectContent(eyes as Record<string, unknown>)) {
    payload.eyes = eyes
  }

  const skin = {
    complexion: cleanString(formData.skin.complexion),
    texture: cleanString(formData.skin.texture),
    blemishes: cleanStringArray(formData.skin.blemishes),
    tattoos: cleanStringArray(formData.skin.tattoos),
    birthmarks: cleanStringArray(formData.skin.birthmarks)
  }
  if (hasObjectContent(skin as Record<string, unknown>)) {
    payload.skin = skin
  }

  const marks = formData.distinguishing_marks
    .map(item => ({
      type: cleanString(item.type),
      location: cleanString(item.location),
      description: cleanString(item.description),
      size: cleanString(item.size),
      visibility: cleanString(item.visibility)
    }))
    .filter(item => item.type && item.location && item.description)
  if (marks.length > 0) {
    payload.distinguishing_marks = marks as NonNullable<CharacterInput['distinguishing_marks']>
  }

  if (formData.nsfw_level) payload.nsfw_level = formData.nsfw_level

  const intimateDetails = {
    breast_size: cleanString(formData.intimate_details.breast_size),
    body_hair: cleanString(formData.intimate_details.body_hair),
    pubic_hair_style: cleanString(formData.intimate_details.pubic_hair_style),
    areola_color: cleanString(formData.intimate_details.areola_color),
    nipple_type: cleanString(formData.intimate_details.nipple_type),
    hymen_status: cleanString(formData.intimate_details.hymen_status),
    scars_intimate: cleanStringArray(formData.intimate_details.scars_intimate),
    piercings_intimate: cleanStringArray(formData.intimate_details.piercings_intimate),
    medical_notes: cleanString(formData.intimate_details.medical_notes)
  }
  if (hasObjectContent(intimateDetails as Record<string, unknown>)) {
    payload.intimate_details = intimateDetails
  }

  const intimacySettings = {
    libido_level: cleanString(formData.intimacy_settings.libido_level),
    experience_level: cleanString(formData.intimacy_settings.experience_level),
    turn_ons: cleanStringArray(formData.intimacy_settings.turn_ons),
    turn_offs: cleanStringArray(formData.intimacy_settings.turn_offs),
    boundaries: cleanStringArray(formData.intimacy_settings.boundaries),
    preferred_style: cleanStringArray(formData.intimacy_settings.preferred_style),
    virility:
      formData.intimacy_settings.virility === 'true'
        ? true
        : formData.intimacy_settings.virility === 'false'
          ? false
          : formData.intimacy_settings.virility === 'null'
            ? null
            : undefined
  }
  if (hasObjectContent(intimacySettings as Record<string, unknown>)) {
    payload.intimacy_settings = intimacySettings
  }

  const coreDesire = cleanString(formData.core_desire)
  if (coreDesire) payload.core_desire = coreDesire

  const personalityTraits = {
    openness: formData.personality_traits.openness ?? undefined,
    conscientiousness: formData.personality_traits.conscientiousness ?? undefined,
    extraversion: formData.personality_traits.extraversion ?? undefined,
    agreeableness: formData.personality_traits.agreeableness ?? undefined,
    neuroticism: formData.personality_traits.neuroticism ?? undefined,
    tags: cleanStringArray(formData.personality_traits.tags),
    values: cleanStringArray(formData.personality_traits.values)
  }
  if (hasObjectContent(personalityTraits as Record<string, unknown>)) {
    payload.personality_traits = personalityTraits
  }

  const emotionalPrimary = cleanString(formData.emotional_state.primary)
  const emotionalSecondary = cleanStringArray(formData.emotional_state.secondary)
  const emotionalMood = cleanString(formData.emotional_state.mood)
  const emotionalStability = cleanString(formData.emotional_state.stability)
  if (
    emotionalPrimary ||
    formData.emotional_state.intensity !== null ||
    emotionalSecondary ||
    emotionalMood ||
    emotionalStability
  ) {
    payload.emotional_state = {
      primary: emotionalPrimary ?? '',
      intensity: formData.emotional_state.intensity ?? 0,
      secondary: emotionalSecondary,
      mood: emotionalMood,
      stability: emotionalStability
    }
  }

  const fears = {
    fears: cleanStringArray(formData.fears.fears),
    phobias: cleanStringArray(formData.fears.phobias),
    weaknesses: cleanStringArray(formData.fears.weaknesses),
    triggers: cleanStringArray(formData.fears.triggers),
    insecurities: cleanStringArray(formData.fears.insecurities)
  }
  if (hasObjectContent(fears as Record<string, unknown>)) {
    payload.fears = fears
  }

  const moralCompass = {
    alignment: cleanString(formData.moral_compass.alignment),
    principles: cleanStringArray(formData.moral_compass.principles),
    moral_gray: cleanString(formData.moral_compass.moral_gray),
    taboos: cleanStringArray(formData.moral_compass.taboos),
    loyalty: cleanString(formData.moral_compass.loyalty)
  }
  if (hasObjectContent(moralCompass as Record<string, unknown>)) {
    payload.moral_compass = moralCompass
  }

  const baseAttributes = {
    strength: formData.base_attributes.strength ?? 0,
    dexterity: formData.base_attributes.dexterity ?? 0,
    constitution: formData.base_attributes.constitution ?? 0,
    intelligence: formData.base_attributes.intelligence ?? 0,
    wisdom: formData.base_attributes.wisdom ?? 0,
    charisma: formData.base_attributes.charisma ?? 0,
    extra: baseAttributesExtra
  }
  const hasBaseAttributes =
    formData.base_attributes.strength !== null ||
    formData.base_attributes.dexterity !== null ||
    formData.base_attributes.constitution !== null ||
    formData.base_attributes.intelligence !== null ||
    formData.base_attributes.wisdom !== null ||
    formData.base_attributes.charisma !== null ||
    !!baseAttributesExtra
  if (hasBaseAttributes) {
    payload.base_attributes = baseAttributes
  }

  const skills = formData.skills
    .map(item => ({
      name: cleanString(item.name),
      level: item.level ?? undefined,
      category: cleanString(item.category),
      description: cleanString(item.description)
    }))
    .filter(item => item.name || item.level !== undefined || item.category || item.description)
  if (skills.length > 0) {
    payload.skills = skills
  }

  const scarsConditions = {
    scars: cleanStringArray(formData.scars_conditions.scars),
    injuries: cleanStringArray(formData.scars_conditions.injuries),
    chronic_disease: cleanStringArray(formData.scars_conditions.chronic_disease),
    disabilities: cleanStringArray(formData.scars_conditions.disabilities),
    prosthetics: cleanStringArray(formData.scars_conditions.prosthetics),
    mental_trauma: cleanStringArray(formData.scars_conditions.mental_trauma)
  }
  if (hasObjectContent(scarsConditions as Record<string, unknown>)) {
    payload.scars_conditions = scarsConditions
  }

  const appearance = cleanString(formData.appearance)
  const backstory = cleanString(formData.backstory)
  const currentLocation = cleanString(formData.current_location)
  if (appearance) payload.appearance = appearance
  if (backstory) payload.backstory = backstory
  if (currentLocation) payload.current_location = currentLocation

  if (metadata) payload.metadata = metadata

  return payload
}
