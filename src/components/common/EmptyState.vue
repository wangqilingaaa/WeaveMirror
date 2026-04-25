<script setup lang="ts">
import { computed } from 'vue'
import { NEmpty, NButton } from 'naive-ui'

const props = defineProps<{
  type?: 'search' | '403' | '404' | 'network' | 'default'
  title?: string
  description?: string
  showAction?: boolean
  actionText?: string
}>()

const emit = defineEmits<{
  (e: 'action'): void
}>()

const emptyConfig = computed(() => {
  switch (props.type) {
    case 'search':
      return {
        title: props.title || '无搜索结果',
        description: props.description || '尝试更换关键词或减少筛选条件',
        icon: 'search',
        actionText: props.actionText || '重置筛选'
      }
    case '403':
      return {
        title: props.title || '无访问权限',
        description: props.description || '您没有权限查看此内容',
        icon: 'lock',
        actionText: props.actionText || '返回首页'
      }
    case '404':
      return {
        title: props.title || '内容不存在',
        description: props.description || '您查找的内容已被删除或不存在',
        icon: 'file',
        actionText: props.actionText || '返回上一页'
      }
    case 'network':
      return {
        title: props.title || '网络异常',
        description: props.description || '无法连接到服务器，请检查网络设置',
        icon: 'wifi',
        actionText: props.actionText || '重新加载'
      }
    case 'default':
    default:
      return {
        title: props.title || '暂无数据',
        description: props.description || '这里空空如也',
        icon: 'box',
        actionText: props.actionText || '刷新试试'
      }
  }
})
</script>

<template>
  <Transition name="fade" appear>
    <div class="empty-state-wrapper">
      <n-empty :description="emptyConfig.title">
        <template #icon>
          <!-- Using simple SVG paths for icons to keep it self-contained -->
          <svg v-if="emptyConfig.icon === 'search'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="48" height="48" fill="currentColor">
            <path d="M456.69 421.39L362.6 327.3a173.81 173.81 0 0034.84-104.58C397.44 126.38 319.06 48 222.72 48S48 126.38 48 222.72s78.38 174.72 174.72 174.72A173.81 173.81 0 00327.3 362.6l94.09 94.09a25 25 0 0035.3-35.3zM97.92 222.72a124.8 124.8 0 11124.8 124.8a124.95 124.95 0 01-124.8-124.8z"/>
          </svg>
          <svg v-else-if="emptyConfig.icon === 'lock'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="48" height="48" fill="currentColor">
            <path d="M336 208v-95a80 80 0 00-160 0v95" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
            <rect x="96" y="208" width="320" height="272" rx="48" ry="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
          </svg>
          <svg v-else-if="emptyConfig.icon === 'wifi'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="48" height="48" fill="currentColor">
            <path d="M332.69 320a115 115 0 00-152.8 0M393.39 259.4a201.26 201.26 0 00-274.31 0M447.72 201.36a288 288 0 00-383.08 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
            <circle cx="256" cy="400" r="24" fill="currentColor"/>
          </svg>
          <svg v-else-if="emptyConfig.icon === 'file'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="48" height="48" fill="currentColor">
            <path d="M416 221.25V416a48 48 0 01-48 48H144a48 48 0 01-48-48V96a48 48 0 0148-48h98.37a32 32 0 0122.62 9.37l141.69 141.26a32 32 0 019.32 22.62z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32"/>
            <path d="M256 56v120a32 32 0 0032 32h120" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="48" height="48" fill="currentColor">
            <path d="M48 336v96a48 48 0 0048 48h320a48 48 0 0048-48v-96" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32"/>
            <path d="M48 336l144-114M464 336L320 222" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
            <path d="M192 222l64 54 64-54" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
            <path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32" d="M144 112h224v110H144z"/>
          </svg>
        </template>
        <template #extra>
          <div class="empty-extra">
            <p class="empty-desc">{{ emptyConfig.description }}</p>
            <n-button v-if="showAction" type="primary" secondary @click="emit('action')">
              {{ emptyConfig.actionText }}
            </n-button>
          </div>
        </template>
      </n-empty>
    </div>
  </Transition>
</template>

<style scoped>
.empty-state-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.empty-extra {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.empty-desc {
  color: var(--n-text-color-3);
  font-size: 14px;
  margin: 0;
  text-align: center;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>