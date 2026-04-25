import { defineStore } from 'pinia'
import { ref } from 'vue'

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
          // 模拟年鉴数据
          events.value.push(
            { id: `evt_${worldId}_1`, worldId, year: 1, title: '世界诞生', description: '在无尽的虚空中，这个世界的第一缕光芒亮起。', type: 'info' },
            { id: `evt_${worldId}_2`, worldId, year: 100, title: '大分裂时代', description: '由于魔法能源的枯竭，各个种族开始了旷日持久的争夺战。', type: 'error' },
            { id: `evt_${worldId}_3`, worldId, year: 350, title: '停战协议', description: '三大国在世界树下签订了长达百年的和平契约。', type: 'success' },
            { id: `evt_${worldId}_4`, worldId, year: 400, title: '新纪元', description: '机械与魔法的结合带来了第一次工业革命。', type: 'warning' }
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
          // 模拟分支树数据
          branches.value.push(
            { id: `b_${worldId}_1`, worldId, name: '主时间线 (Prime)', parentId: null, isCurrent: true },
            { id: `b_${worldId}_2`, worldId, name: '分支：拯救村庄', parentId: `b_${worldId}_1`, isCurrent: false },
            { id: `b_${worldId}_3`, worldId, name: '分支：加入反叛军', parentId: `b_${worldId}_1`, isCurrent: false },
            { id: `b_${worldId}_4`, worldId, name: '分支：背叛同伴', parentId: `b_${worldId}_3`, isCurrent: false }
          )
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
