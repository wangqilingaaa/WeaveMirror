import { defineStore } from 'pinia'

export interface Memory {
  id: string
  characterId: string
  timestamp: string // 可以是世界历法的时间戳，比如 "星历 402 年 3 月"
  summary: string
  detail: string
  tags: string[]
  isCore: boolean // 是否是核心记忆
  userNote: string // 用户笔记
}

export const useMemoryStore = defineStore('memory', {
  state: () => ({
    memories: [] as Memory[]
  }),
  actions: {
    // 获取角色的所有记忆，按时间戳（模拟排序）
    getMemoriesByCharacter(characterId: string) {
      return this.memories.filter(m => m.characterId === characterId).sort((a, b) => {
        // 简单按星历日期数字排序
        return this.parseTimestamp(a.timestamp) - this.parseTimestamp(b.timestamp)
      })
    },
    // 辅助解析时间戳：提取数字进行排序 "星历 402 年 X 月 Y 日"
    parseTimestamp(ts: string) {
      const match = ts.match(/(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日/)
      if (match) {
        return parseInt(match[1]) * 10000 + parseInt(match[2]) * 100 + parseInt(match[3])
      }
      return 0
    },
    // 添加记忆
    addMemory(memory: Memory) {
      this.memories.push(memory)
    },
    // 切换核心记忆状态
    toggleCoreMemory(id: string) {
      const memory = this.memories.find(m => m.id === id)
      if (memory) {
        memory.isCore = !memory.isCore
      }
    },
    // 更新用户笔记
    updateUserNote(id: string, note: string) {
      const memory = this.memories.find(m => m.id === id)
      if (memory) {
        memory.userNote = note
      }
    },
    // 删除记忆（遗忘）
    deleteMemory(id: string) {
      const index = this.memories.findIndex(m => m.id === id)
      if (index !== -1) {
        this.memories.splice(index, 1)
      }
    },
    // 生成假数据
    generateFakeMemories(characterId: string) {
      // 避免重复生成
      if (this.memories.some(m => m.characterId === characterId)) return

      // 共享重大事件，用于对比
      const sharedMemories: Memory[] = [
        {
          id: `mem_${characterId}_shared_1`,
          characterId,
          timestamp: `星历 402 年 1 月 15 日`,
          summary: `北境之战`,
          detail: `在这场席卷大陆的北境之战中，角色有着自己独特的视角和经历，或许是浴血奋战，或许是冷眼旁观，甚至可能是幕后黑手。`,
          tags: ['战役', '转折点'],
          isCore: true,
          userNote: ''
        },
        {
          id: `mem_${characterId}_shared_2`,
          characterId,
          timestamp: `星历 402 年 3 月 1 日`,
          summary: `星辰大典`,
          detail: `出席了举世瞩目的星辰大典，各方势力汇聚一堂，暗流涌动。`,
          tags: ['庆典', '社交'],
          isCore: false,
          userNote: ''
        },
        {
          id: `mem_${characterId}_shared_3`,
          characterId,
          timestamp: `星历 402 年 5 月 20 日`,
          summary: `大裂隙异变`,
          detail: `大裂隙发生了前所未有的魔力潮汐，角色感受到了这股力量的波动。`,
          tags: ['异常', '魔力'],
          isCore: true,
          userNote: ''
        }
      ]

      const fakeData: Memory[] = Array.from({ length: 30 }).map((_, i) => ({
        id: `mem_${characterId}_${i}`,
        characterId,
        timestamp: `星历 402 年 ${Math.floor(i / 6) + 1} 月 ${i % 28 + 1} 日`,
        summary: `发生了个人事件 ${i + 1}`,
        detail: `这是关于个人事件 ${i + 1} 的详细描述。角色在这一天经历了一些重要的事情，对其后续的发展产生了影响。`,
        tags: ['日常', i % 5 === 0 ? '重要' : '琐事'],
        isCore: i % 10 === 0, // 每10个设定为一个核心记忆
        userNote: ''
      }))
      
      this.memories.push(...sharedMemories, ...fakeData)
    }
  }
})
