/**
 * composables 统一导出入口。
 *
 * 设计原因：
 * 1. 页面层统一从 `@/composables` 导入，避免显式依赖具体文件名。
 * 2. 后续新增组合式函数时，只需要补这一处导出，不必全项目调整路径。
 * 3. 统一目录出口后，模块边界会更稳定，也更方便后续做领域化拆分。
 */
export { useNarrativeWebSocket } from './useNarrativeWebSocket'
export { useUnsavedChangesGuard } from './useUnsavedChangesGuard'
