/**
 * narrative 组件模块统一导出入口。
 *
 * 设计原因：
 * 1. 舞台页属于 narrative 领域容器，统一从目录出口导入可以降低对具体文件结构的耦合。
 * 2. 组件、类型、消息映射逻辑集中从一个入口暴露，后续迁移或拆分目录时影响面更小。
 * 3. 统一出口风格也能让 `stores`、`api`、`composables`、`components` 保持一致。
 */
export { default as NarrativeCharacterSidebar } from './NarrativeCharacterSidebar.vue'
export { default as NarrativeChatPanel } from './NarrativeChatPanel.vue'
export { default as NarrativeSessionSidebar } from './NarrativeSessionSidebar.vue'
export { default as NarrativeWorldSidebar } from './NarrativeWorldSidebar.vue'
export { mapNarrativeSocketMessage } from './narrativeSocketMessageMapper'
export type {
  StageCharacterCard,
  StageChatMessage,
  StageSessionCard,
  StageWorldSection
} from './stageTypes'
