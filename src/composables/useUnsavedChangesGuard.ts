import { onBeforeUnmount, watch, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/**
 * 统一处理“未保存内容离开页面”的保护逻辑。
 *
 * 设计原因：
 * 1. 页面内路由跳转和浏览器刷新/关闭是两套触发链路，分散写很容易漏掉其一。
 * 2. 本次世界编辑页和角色编辑页都需要这套能力，抽成 composable 后可复用且更稳定。
 * 3. 这里使用浏览器原生确认框，避免在路由守卫阶段引入异步弹窗导致导航状态复杂化。
 */
export function useUnsavedChangesGuard(isDirty: Ref<boolean>, message = '当前内容尚未保存，确定离开吗？') {
  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (!isDirty.value) {
      return
    }

    event.preventDefault()
    event.returnValue = message
  }

  watch(
    isDirty,
    (dirty) => {
      if (dirty) {
        window.addEventListener('beforeunload', handleBeforeUnload)
      } else {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    },
    { immediate: true }
  )

  onBeforeRouteLeave(() => {
    if (!isDirty.value) {
      return true
    }

    return window.confirm(message)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })
}
