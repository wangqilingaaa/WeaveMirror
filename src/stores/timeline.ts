import { defineStore } from 'pinia'
import { ref } from 'vue'
import Mock from 'mockjs'

export interface YearbookEvent {
  id: string
  worldId: string
  year: number
  title: string
  description: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export interface TimelineBranch {
  id: string
  worldId: string
  name: string
  parentId: string | null
  isCurrent: boolean
}

export const useTimelineStore = defineStore('timeline', () => {
  const events = ref<YearbookEvent[]>([])
  const branches = ref<TimelineBranch[]>([])

  const fetchYearbook = async (worldId: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (!events.value.some(e => e.worldId === worldId)) {
          // 使用 Mock 生成丰富的年鉴数据
          const mockEvents = Mock.mock({
            'events|15-30': [
              {
                'id': '@guid',
                'worldId': worldId,
                'year|1-1000': 1,
                'title': '@ctitle(4, 12)',
                'description': '@cparagraph(1, 3)',
                'type|1': ['info', 'success', 'warning', 'error']
              }
            ]
          }).events
          
          // 按照年份排序
          mockEvents.sort((a: YearbookEvent, b: YearbookEvent) => a.year - b.year)

          // 模拟年鉴数据（加入固定关键事件）
          events.value.push(
            { id: `evt_${worldId}_1`, worldId, year: 1, title: '世界诞生', description: '在无尽的虚空中，这个世界的第一缕光芒亮起。', type: 'info' },
            ...mockEvents
          )
        }
        resolve()
      }, 300)
    })
  }

  const fetchBranches = async (worldId: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (!branches.value.some(b => b.worldId === worldId)) {
          // 基础主线
          const rootBranchId = `b_${worldId}_root`
          branches.value.push({ id: rootBranchId, worldId, name: '主时间线 (Prime)', parentId: null, isCurrent: true })
          
          // 使用 Mock 生成丰富的树形分支数据
          const mockBranches = Mock.mock({
            'branches|5-12': [
              {
                'id': '@guid',
                'worldId': worldId,
                'name': '分支：@ctitle(4, 8)',
                'parentId': rootBranchId,
                'isCurrent': false
              }
            ]
          }).branches

          // 为部分分支添加子分支，形成深度
          const subBranches: TimelineBranch[] = []
          mockBranches.forEach((b: TimelineBranch) => {
            if (Mock.Random.boolean()) {
              subBranches.push({
                id: Mock.Random.guid(),
                worldId,
                name: '分支：' + Mock.Random.ctitle(4, 8),
                parentId: b.id,
                isCurrent: false
              })
            }
          })

          branches.value.push(...mockBranches, ...subBranches)
        }
        resolve()
      }, 300)
    })
  }

  const switchBranch = async (worldId: string, targetBranchId: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const target = branches.value.find(b => b.id === targetBranchId && b.worldId === worldId)
        if (!target) {
          reject(new Error('未找到目标分支'))
          return
        }
        
        // 切换当前分支状态
        branches.value.forEach(b => {
          if (b.worldId === worldId) {
            b.isCurrent = b.id === targetBranchId
          }
        })
        
        // 可以在这里触发重新加载对应分支的其他数据（如角色、记忆等）
        resolve()
      }, 600)
    })
  }

  return { events, branches, fetchYearbook, fetchBranches, switchBranch }
})
