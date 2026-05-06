/**
 * API 模块统一导出入口
 *
 * 模块划分对应 openapi.yaml 中的 tags：
 * - auth       → 认证（登录/注册）
 * - user       → 用户信息
 * - world      → 世界观 CRUD、时间推进、分支、年鉴
 * - character  → 角色 CRUD、状态变更
 * - relationship → 关系 CRUD、关系图谱
 * - storyline  → 故事线查询、固定/删除条目
 */

export { default as client, extractData } from './client'

export {
  loginApi,
  registerApi
} from './auth'

export {
  getCurrentUserIdApi
} from './user'

export {
  createWorldApi,
  listWorldsApi,
  getWorldApi,
  updateWorldApi,
  advanceTimeApi,
  createBranchApi,
  getBranchTreeApi,
  switchActiveTimelineApi,
  getYearbookApi,
  enhanceWorldSettingsApi
} from './world'

export {
  createCharacterApi,
  listCharactersApi,
  getCharacterApi,
  updateCharacterApi,
  deleteCharacterApi,
  changeCharacterStateApi,
  generateCharacterApi
} from './character'

export {
  createRelationshipApi,
  getCharacterRelationsApi,
  updateRelationshipApi,
  deleteRelationshipApi,
  getRelationMapApi
} from './relationship'

export {
  getStorylineApi,
  pinEntryApi,
  deleteEntryApi
} from './storyline'
