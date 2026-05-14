/**
 * 告诉 TypeScript：所有 `.vue` 文件都会导出一个 Vue 组件。
 * 否则像 `import('@/views/WorldDetail.vue')` 这样的写法在类型检查阶段
 * 会被当成“未知模块”，从而出现“找不到模块或其相应的类型声明”的报错。
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  /**
   * 使用宽松但安全的通用组件类型，
   * 让不同页面组件都可以被路由和其他 TS 文件正常导入。
   */
  const component: DefineComponent<Record<string, never>, Record<string, never>, any>
  export default component
}
