// ==================== 角色模块 ====================

// /** 创建角色请求 */
// export interface CreateCharacterReq {
//   name: string
//   name_aliases?: string
//   world_id: number
//   age?: number
//   gender?: string
//   species?: string
//   body_build?: string
//   height?: number
//   facial_features?: string
//   hair?: string
//   eyes?: string
//   skin?: string
//   distinguishing_marks?: string
//   voice?: string
//   nsfw_level?: string
//   intimate_details?: string
//   intimacy_settings?: string
//   core_desire?: string
//   personality_traits?: string
//   emotional_state?: string
//   fears?: string
//   moral_compass?: string
//   base_attributes: string
//   skills?: string
//   scars_conditions?: string
//   appearance?: string
//   backstory?: string
//   current_location?: string
//   birth_epoch?: string
//   death_epoch?: string
//   metadata?: string
// }

// /** 更新角色请求（所有字段可选） */
// export interface UpdateCharacterReq {
//   name?: string
//   name_aliases?: string
//   age?: number
//   gender?: string
//   species?: string
//   body_build?: string
//   height?: number
//   facial_features?: string
//   hair?: string
//   eyes?: string
//   skin?: string
//   distinguishing_marks?: string
//   voice?: string
//   nsfw_level?: string
//   intimate_details?: string
//   intimacy_settings?: string
//   core_desire?: string
//   personality_traits?: string
//   emotional_state?: string
//   fears?: string
//   moral_compass?: string
//   base_attributes?: string
//   skills?: string
//   scars_conditions?: string
//   appearance?: string
//   backstory?: string
//   current_location?: string
//   metadata?: string
// }

// /** 角色 */
// export interface Character {
//   id: number
//   world_id: number
//   user_id: number
//   name: string
//   name_aliases?: string
//   age: number
//   gender?: string
//   species?: string
//   body_build?: string
//   height?: number
//   facial_features?: string
//   hair?: string
//   eyes?: string
//   skin?: string
//   distinguishing_marks?: string
//   voice?: string
//   nsfw_level: string
//   intimate_details?: string
//   intimacy_settings?: string
//   core_desire?: string
//   personality_traits?: string
//   emotional_state?: string
//   fears?: string
//   moral_compass?: string
//   base_attributes?: string
//   skills?: string
//   scars_conditions?: string
//   appearance?: string
//   backstory?: string
//   current_location?: string
//   birth_epoch?: string
//   death_epoch?: string
//   state: string
//   life_stage: string
//   birth_year?: number
//   death_year?: number | null
//   metadata?: string
//   created_at: string
//   updated_at: string
// }

// /** 角色列表响应 */
// export interface CharacterListData {
//   characters: Character[]
//   total: number
//   page: number
//   limit: number
// }

// /** 变更角色状态请求 */
// export interface ChangeStateReq {
//   new_state: string
//   force?: boolean
// }

// ======================== 子结构体接口 ========================

/** 体型信息 */
export interface BodyBuild {
  build?: string;
  muscle_tone?: string;
  body_fat?: string;
  posture?: string;
  limbs?: string;
  additional?: Record<string, any>;
}

/** 面部特征 */
export interface FacialFeatures {
  face_shape?: string;
  facial_hair?: string;
  freckles?: boolean;
  beauty_mark?: string;
  expression?: string;
}

/** 头发信息 */
export interface Hair {
  color?: string;
  length?: string;
  style?: string;
}

/** 眼睛信息 */
export interface Eyes {
  color?: string;
  shape?: string;
  size?: string;
  pupil?: string;
}

/** 皮肤信息 */
export interface Skin {
  complexion?: string;
  texture?: string;
  blemishes?: string[];
  tattoos?: string[];
  birthmarks?: string[];
}

/** 特殊标记 */
export interface DistinguishingMark {
  type: string;         // 疤痕/胎记/纹身/义肢等
  location: string;     // 身体部位
  description: string;
  size?: string;
  visibility?: string;  // 明显/隐蔽
}

/** 私密身体信息 */
export interface IntimateDetails {
  breast_size?: string;
  body_hair?: string;
  pubic_hair_style?: string;
  areola_color?: string;
  nipple_type?: string;
  hymen_status?: string;
  scars_intimate?: string[];
  piercings_intimate?: string[];
  medical_notes?: string;
}

/** 亲密互动偏好 */
export interface IntimacySettings {
  libido_level?: string;     // 冷淡/正常/旺盛
  experience_level?: string; // 无/少量/丰富
  turn_ons?: string[];
  turn_offs?: string[];
  boundaries?: string[];
  preferred_style?: string[];
  virility?: boolean | null; // 可以为 null
}

/** 性格特质 */
export interface PersonalityTraits {
  openness?: number;          // 0-100
  conscientiousness?: number;
  extraversion?: number;
  agreeableness?: number;
  neuroticism?: number;
  tags?: string[];
  values?: string[];
}

/** 情绪状态 */
export interface EmotionalState {
  primary: string;      // 主要情绪
  intensity: number;    // 0-100
  secondary?: string[];
  mood?: string;
  stability?: string;   // 稳定/波动/暴躁
}

/** 恐惧与弱点 */
export interface FearsWeaknesses {
  fears?: string[];
  phobias?: string[];
  weaknesses?: string[];
  triggers?: string[];
  insecurities?: string[];
}

/** 道德取向 */
export interface MoralCompass {
  alignment?: string;   // 守序善良/混乱邪恶等
  principles?: string[];
  moral_gray?: string;
  taboos?: string[];
  loyalty?: string;
}

/** 基础六维属性 */
export interface BaseAttributes {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  extra?: Record<string, number>;
}

/** 技能项 */
export interface Skill {
  name?: string;
  level?: number;       // 0-100
  category?: string;    // 战斗/生活/学术
  description?: string;
}

/** 伤病/永久性特质 */
export interface ScarsConditions {
  scars?: string[];
  injuries?: string[];
  chronic_disease?: string[];
  disabilities?: string[];
  prosthetics?: string[];
  mental_trauma?: string[];
}

/** 扩展元数据 */
export type Metadata = Record<string, any>;

// ======================== 枚举类型（联合字符串） ========================

export type LifeStage =
  | '幼年期'
  | '青年期'
  | '壮年期'
  | '中年期'
  | '老年期'
  | '暮年期';

export type CharacterState = '活跃' | '休眠' | '潜伏' | '死亡';

export type NSFWLevel = 'sfw' | 'mild' | 'nsfw';

// ======================== 全量数据接口（响应体） ========================

/** 角色完整数据，包含只读字段（id、时间戳等） */
export interface CharacterFull {
  // 基础标识
  world_id: number;                // 所属世界观 ID
  name: string;                    // 角色名称
  sex?: string;
  name_aliases?: string[];

  // 生命状态
  age: number;                     // 年龄
  life_stage?: LifeStage;
  state?: CharacterState;
  birth_epoch?: string;
  death_epoch?: string;

  // 身体特征（基础）
  species?: string;
  body_build?: BodyBuild;
  height?: number;                 // 身高（cm）
  facial_features?: FacialFeatures;
  hair?: Hair;
  eyes?: Eyes;
  skin?: Skin;
  distinguishing_marks?: DistinguishingMark[];

  // 身体特征（私密/成人）
  nsfw_level?: NSFWLevel;
  intimate_details?: IntimateDetails;
  intimacy_settings?: IntimacySettings;

  // 心理与人格
  core_desire?: string;
  personality_traits?: PersonalityTraits;
  emotional_state?: EmotionalState;
  fears?: FearsWeaknesses;
  moral_compass?: MoralCompass;

  // 能力与属性
  base_attributes?: BaseAttributes;   // 创建时必填，但响应中可能出现
  skills?: Skill[];
  scars_conditions?: ScarsConditions;

  // 背景与外观
  appearance?: string;
  backstory?: string;
  current_location?: string;

  // 元数据
  metadata?: Metadata;
}

// ======================== 创建/修改请求体接口 ========================

/**
 * 用于创建和修改角色的请求体。
 * 排除了只读字段：id, created_at, updated_at。
 * 所有字段均为可选，便于同时用于新增和部分更新。
 */
export interface CharacterInput {
  // 基础标识
  world_id?: number;
  name?: string;
  sex?: string;
  name_aliases?: string[];

  // 生命状态
  age?: number;
  life_stage?: LifeStage;
  state?: CharacterState;
  birth_epoch?: string;
  death_epoch?: string;

  // 身体特征（基础）
  species?: string;
  body_build?: BodyBuild;
  height?: number;
  facial_features?: FacialFeatures;
  hair?: Hair;
  eyes?: Eyes;
  skin?: Skin;
  distinguishing_marks?: DistinguishingMark[];

  // 身体特征（私密/成人）
  nsfw_level?: NSFWLevel;
  intimate_details?: IntimateDetails;
  intimacy_settings?: IntimacySettings;

  // 心理与人格
  core_desire?: string;
  personality_traits?: PersonalityTraits;
  emotional_state?: EmotionalState;
  fears?: FearsWeaknesses;
  moral_compass?: MoralCompass;

  // 能力与属性
  base_attributes?: BaseAttributes;
  skills?: Skill[];
  scars_conditions?: ScarsConditions;

  // 背景与外观
  appearance?: string;
  backstory?: string;
  current_location?: string;

  // 元数据
  metadata?: Metadata;
}

// ======================== 兼容业务层的导出类型 ========================

/**
 * 角色完整响应。
 * 在 `CharacterFull` 的基础上补充服务端常见的只读字段，
 * 这样页面在读取详情和列表时可以直接使用统一类型。
 */
export interface Character extends CharacterFull {
  id: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  birth_year?: number;
  death_year?: number | null;
}

/**
 * 创建角色请求。
 * 目前直接复用最新的输入结构，避免维护两套含义重复的接口。
 */
export type CreateCharacterReq = CharacterInput;

/**
 * 更新角色请求。
 * 更新接口同样复用输入结构，因为大多数字段本身已经是可选的。
 */
export type UpdateCharacterReq = CharacterInput;

/** 角色列表响应 */
export interface CharacterListData {
  characters: Character[];
  total: number;
  page: number;
  limit: number;
}

/** 角色状态变更请求 */
export interface ChangeStateReq {
  new_state: CharacterState;
  force?: boolean;
}
