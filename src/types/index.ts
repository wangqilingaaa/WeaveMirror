// ==================== 通用类型 ====================

/** 统一 API 响应包装 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/** 分页参数 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/** 分页响应 */
export interface PaginatedData<T> {
  total: number
  page: number
  limit: number
  [items: string]: T[] | number
}

/** 应用主题模式 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** 用户角色 */
export type UserRole = 'player' | 'admin'

// ==================== 认证模块 ====================

/** 登录请求参数 */
export interface LoginParams {
  username: string
  password: string
}

/** 注册请求参数 */
export interface RegisterParams {
  username: string
  password: string
  email: string
  birth_date?: string
}

/** 认证接口响应数据 */
export interface AuthResp {
  user_id: number
  token: string
}

// ==================== 用户模块 ====================

/** 用户信息（本地扩展，API /api/v1/me 仅返回 user_id） */
export interface UserInfo {
  id: number
  username: string
  email: string
  role: UserRole
  createdAt: string
}

/** 当前用户 API 响应 */
export interface CurrentUserResp {
  user_id: number
}

// ==================== 世界观模块 ====================

/** 创建世界观请求 */
export interface CreateWorldReq {
  name: string
  settings?: WorldSettings
}

/** 更新世界观请求 */
export interface UpdateWorldReq {
  name?: string
  settings?: WorldSettings
}

/** 世界观 */
// export interface World {
//   id: number
//   user_id: number
//   name: string
//   epoch: string
//   current_year: number
//   settings?: string
//   active_timeline_id: number | null
//   nsfw_enabled: boolean
//   evolution_enabled: boolean
//   created_at: string
//   updated_at: string
// }

export interface World {
  id: number;                        
  user_id: number;                   
  name: string;                      
  slug: string;                      
  description: string;               
  epoch: string;                     
  current_year: number;              
  core_rules?: string[];             
  themes?: string[];                 
  tags?: string[];                   
  magic_system?: MagicType;          
  tech_level?: TechLevel;            
  economy_type?: EconomyType;        
  government?: string;               
  religion?: string;                 
  regions?: Region[];                
  factions?: string[];               
  major_cities?: string[];           
  races?: string[];                  
  metadata?: Record<string, any>;    
  active_timeline_id?: number | null;
  nsfw_enabled: boolean;             
  evolution_enabled: boolean;        
  created_at: string;                
  updated_at: string;                
}

export interface WorldSettings {
  description?: string;
  epoch?: string;
  current_year?: number;
  core_rules?: string[];
  themes?: string[];
  tags?: string[];
  magic_system?: MagicType;
  tech_level?: TechLevel;
  economy_type?: EconomyType;
  government?: string;
  religion?: string;
  regions?: Region[];
  factions?: string[];
  major_cities?: string[];
  races?: string[];
  nsfw_enabled?: boolean;
  evolution_enabled?: boolean;
  metadata?: Record<string, any>;
}

export type MagicType = "none" | "low" | "high" | "unique";

export type TechLevel = 
  | "stone_age"
  | "medieval"
  | "renaissance"
  | "industrial"
  | "modern"
  | "future"
  | "scifi";

export type EconomyType = "barter" | "currency" | "resource" | "post_scarcity";

export interface Region {
  name: string;
  description?: string;
  climate?: string;
  notable_places?: string[];
}

/** 世界观列表响应 */
export interface WorldListData {
  worlds: World[]
  total: number
  page: number
  limit: number
}

/** 时间推进请求 */
export interface AdvanceTimeReq {
  years: number
}

/** 时间推进结果 */
export interface WorldTimeUpdate {
  world_id: number
  new_epoch: string
  new_year: number
  years_advanced: number
  aged_char_count: number
  death_names: string[]
  stage_change_count: number
  event_count: number
}

// ==================== 世界线分支模块 ====================

/** 创建分支请求 */
export interface CreateBranchReq {
  parent_id?: number
  choice_desc: string
}

/** 切换分支请求 */
export interface SwitchBranchReq {
  branch_id: number
}

/** 故事分支 */
export interface StoryBranch {
  id: number
  world_id: number
  parent_id: number | null
  choice_desc: string
  snapshot_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/** 分支树节点 */
export interface BranchNode {
  branch: StoryBranch
  children: BranchNode[]
}

/** 分支树响应 */
export interface BranchTreeData {
  roots: BranchNode[]
}

/** 切换分支响应 */
export interface SwitchBranchResp {
  active_timeline_id: number
}

// ==================== 年鉴事件模块 ====================

/** 世界观事件 */
export interface WorldEvent {
  id: number
  world_id: number
  epoch: string
  description: string
  related_chars?: string
  event_type: string
  created_at: string
  updated_at: string
}

/** 年鉴事件列表响应 */
export interface YearbookData {
  events: WorldEvent[]
  total: number
  page: number
  limit: number
}

// ==================== 角色模块 ====================

/** 创建角色请求 */
export interface CreateCharacterReq {
  name: string
  name_aliases?: string
  world_id: number
  age?: number
  gender?: string
  species?: string
  body_build?: string
  height?: number
  facial_features?: string
  hair?: string
  eyes?: string
  skin?: string
  distinguishing_marks?: string
  voice?: string
  nsfw_level?: string
  intimate_details?: string
  intimacy_settings?: string
  core_desire?: string
  personality_traits?: string
  emotional_state?: string
  fears?: string
  moral_compass?: string
  base_attributes: string
  skills?: string
  scars_conditions?: string
  appearance?: string
  backstory?: string
  current_location?: string
  birth_epoch?: string
  death_epoch?: string
  metadata?: string
}

/** 更新角色请求（所有字段可选） */
export interface UpdateCharacterReq {
  name?: string
  name_aliases?: string
  age?: number
  gender?: string
  species?: string
  body_build?: string
  height?: number
  facial_features?: string
  hair?: string
  eyes?: string
  skin?: string
  distinguishing_marks?: string
  voice?: string
  nsfw_level?: string
  intimate_details?: string
  intimacy_settings?: string
  core_desire?: string
  personality_traits?: string
  emotional_state?: string
  fears?: string
  moral_compass?: string
  base_attributes?: string
  skills?: string
  scars_conditions?: string
  appearance?: string
  backstory?: string
  current_location?: string
  metadata?: string
}

/** 角色 */
export interface Character {
  id: number
  world_id: number
  user_id: number
  name: string
  name_aliases?: string
  age: number
  gender?: string
  species?: string
  body_build?: string
  height?: number
  facial_features?: string
  hair?: string
  eyes?: string
  skin?: string
  distinguishing_marks?: string
  voice?: string
  nsfw_level: string
  intimate_details?: string
  intimacy_settings?: string
  core_desire?: string
  personality_traits?: string
  emotional_state?: string
  fears?: string
  moral_compass?: string
  base_attributes?: string
  skills?: string
  scars_conditions?: string
  appearance?: string
  backstory?: string
  current_location?: string
  birth_epoch?: string
  death_epoch?: string
  state: string
  life_stage: string
  birth_year?: number
  death_year?: number | null
  metadata?: string
  created_at: string
  updated_at: string
}

/** 角色列表响应 */
export interface CharacterListData {
  characters: Character[]
  total: number
  page: number
  limit: number
}

/** 变更角色状态请求 */
export interface ChangeStateReq {
  new_state: string
  force?: boolean
}

/** 删除操作响应 */
export interface DeleteResp {
  message: string
}

// ==================== 关系模块 ====================

/** 创建关系请求 */
export interface CreateRelationshipReq {
  source_id: number
  target_id: number
  rel_type: string
  strength?: number
  is_secret?: boolean
  metadata?: string
}

/** 更新关系请求 */
export interface UpdateRelationshipReq {
  rel_type?: string
  strength?: number
  is_secret?: boolean
  metadata?: string
}

/** 关系 */
export interface Relationship {
  id: number
  world_id: number
  source_id: number
  target_id: number
  rel_type: string
  strength: number
  is_secret: boolean
  metadata?: string
  created_at: string
  updated_at: string
}

/** 角色关系列表响应 */
export interface RelationshipListData {
  relationships: Relationship[]
  total: number
}

/** 关系图谱节点 */
export interface RelationMapNode {
  id: number
  name: string
  state: string
}

/** 关系图谱边 */
export interface RelationMapEdge {
  source_id: number
  target_id: number
  rel_type: string
  strength: number
  is_secret: boolean
}

/** 关系图谱数据 */
export interface RelationMapData {
  nodes: RelationMapNode[]
  edges: RelationMapEdge[]
}

// ==================== 故事线模块 ====================

/** 故事线条目 */
export interface StorylineEntry {
  id: string
  timestamp: string
  location?: string
  summary: string
  tags?: string[]
  emotion_tag?: string
  is_core_memory: boolean
  related_character_ids?: number[]
  created_at: string
}

/** 故事线条目列表响应 */
export interface StorylineData {
  entries: StorylineEntry[]
  total: number
  page: number
  limit: number
}

/** 固定/取消固定请求 */
export interface PinEntryReq {
  is_core_memory: boolean
}

/** 固定操作响应 */
export interface PinEntryResp {
  message: string
}

// ==================== WebSocket 消息类型 ====================

/** 客户端 WebSocket 消息 */
export interface WSClientMessage {
  type: 'turn_submit'
  data: {
    character_id: number
    content: string
  }
}

/** 服务端 WebSocket 消息 */
export interface WSServerMessage {
  type: 'narrative_stream' | 'narrative_complete' | 'narrative_error' | 'world_time_update' | 'background_event'
  content?: string
  entry_id?: string
  data?: object
}

// ==================== AI 增强模块 ====================

/** AI 增强世界观设定请求 */
export interface AIEnhanceSettingsReq {
  world_name: string
  settings: WorldSettings
}

/** AI 增强世界观设定响应 */
export interface AIEnhanceSettingsResp {
  original_settings: WorldSettings
  enhanced_settings: WorldSettings
}
