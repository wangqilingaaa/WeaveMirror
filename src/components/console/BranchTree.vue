<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { NCard, NTree, NButton, useMessage, NPopconfirm, NSpin, NTag } from 'naive-ui'
import type { TreeOption } from 'naive-ui'
import { useTimelineStore } from '../../stores/timeline'
import EmptyState from '../common/EmptyState.vue'

const props = defineProps<{
  worldId: string
}>()

const timelineStore = useTimelineStore()
const message = useMessage()

const loading = ref(true)
const switching = ref(false)
const expandedKeys = ref<string[]>([])

onMounted(async () => {
  loading.value = true
  await timelineStore.fetchBranches(props.worldId)
  
  // 默认展开所有节点
  const branches = timelineStore.branches.filter(b => b.worldId === props.worldId)
  expandedKeys.value = branches.map(b => b.id)
  
  loading.value = false
})

// 递归构建树形数据
const buildTree = (parentId: string | null, branches: any[]): TreeOption[] => {
  return branches
    .filter(b => b.parentId === parentId)
    .map(b => {
      const node: TreeOption = {
        key: b.id,
        label: b.name,
        isCurrent: b.isCurrent,
        children: buildTree(b.id, branches)
      }
      if (node.children && node.children.length === 0) {
        delete node.children
      }
      return node
    })
}

const treeData = computed(() => {
  const branches = timelineStore.branches.filter(b => b.worldId === props.worldId)
  return buildTree(null, branches)
})

// 自定义节点渲染，以突出显示当前所在分支，并提供切换按钮
const renderPrefix = ({ option }: { option: TreeOption }) => {
  return option.isCurrent ? h(NTag, { type: 'success', size: 'small', style: 'margin-right: 8px;' }, { default: () => '当前' }) : null
}

const renderSuffix = ({ option }: { option: TreeOption }) => {
  if (option.isCurrent) return null

  return h(
    NPopconfirm,
    {
      onPositiveClick: () => handleSwitchBranch(option.key as string),
      positiveText: '确认切换',
      negativeText: '取消'
    },
    {
      trigger: () => h(NButton, { size: 'tiny', type: 'primary', ghost: true, loading: switching.value }, { default: () => '切换至此分支' }),
      default: () => `你确定要切换到分支【${option.label}】吗？这将会改变世界的状态和所有角色的命运。`
    }
  )
}

const handleSwitchBranch = async (branchId: string) => {
  switching.value = true
  try {
    await timelineStore.switchBranch(props.worldId, branchId)
    message.success('分支切换成功，世界线已发生变动！')
  } catch (error: any) {
    message.error(`分支切换失败: ${error.message || '未知错误'}`)
  } finally {
    switching.value = false
  }
}
</script>

<template>
  <n-card title="世界线分支 (Timeline Branches)" bordered style="height: 100%;">
    <n-spin :show="loading" style="height: 100%;">
            <div v-if="treeData.length === 0 && !loading" style="height: 100%;">
              <EmptyState type="default" description="暂无世界线分支数据。" />
            </div>
      
      <n-tree
        v-else
        block-line
        :data="treeData"
        :expanded-keys="expandedKeys"
        @update:expanded-keys="(keys) => expandedKeys = keys"
        :render-prefix="renderPrefix"
        :render-suffix="renderSuffix"
        style="padding: 16px 0;"
      />
    </n-spin>
  </n-card>
</template>

<style scoped>
/* 可以在此定制树形节点的特定样式 */
</style>
