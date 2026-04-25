import { defineStore } from 'pinia'
import { ref } from 'vue'
import Mock from 'mockjs'

export interface World {
  id: string
  name: string
  description?: string
  tags?: string[]
  currentYear: number
}

export const useWorldStore = defineStore('world', () => {
  const worlds = ref<World[]>([])
  const currentWorldId = ref<string | null>(null)

  const fetchWorlds = async () => {
    // 模拟从接口获取世界列表数据
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (worlds.value.length === 0) {
          // 使用 Mock 生成丰富假数据
          const mockData = Mock.mock({
            'worlds|5-8': [
              {
                'id': '@guid',
                'name': '@ctitle(4, 8)世界',
                'description': '@cparagraph(2, 5)',
                'tags|2-4': ['@cword(2, 4)'],
                'currentYear|100-3000': 1
              }
            ]
          })
          
          // 保留一些特定的世界，也可以全部替换
          worlds.value = [
            { id: 'w1', name: '阿卡迪亚 (Arcadia)', description: '一个充满魔法与机械混合的浮空岛世界。在云端之上，巨龙与飞艇共舞，古代魔法塔的遗迹中闪烁着齿轮的光芒。', tags: ['魔法', '机械', '浮空岛', '史诗'], currentYear: 402 },
            { id: 'w2', name: '赛博新石器 (Cyber-Neolithic)', description: '在废土之上重建的原始部落，使用古老仪式操控遗留的纳米科技。这里的猎人使用等离子长矛狩猎机械巨兽。', tags: ['废土', '赛博朋克', '部落', '科幻'], currentYear: 2077 },
            ...mockData.worlds
          ]
        }
        // 如果没有选中的世界，默认选中第一个
        if (!currentWorldId.value && worlds.value.length > 0) {
          currentWorldId.value = worlds.value[0].id
        }
        resolve()
      }, 300)
    })
  }

  const createWorld = async (name: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newWorld: World = {
          id: Mock.Random.guid(),
          name,
          description: Mock.Random.cparagraph(1, 3),
          tags: Mock.mock({ 'array|1-3': ['@cword(2, 4)'] }).array,
          currentYear: 1
        }
        worlds.value.push(newWorld)
        if (!currentWorldId.value) currentWorldId.value = newWorld.id
        resolve()
      }, 500)
    })
  }

  const generateWorld = async (name: string, tags: string[]) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newWorld: World = {
          id: Mock.Random.guid(),
          name,
          tags,
          description: `【AI 生成】基于 ${tags.join(', ')} 标签自动扩展的复杂世界观设定，包含详细的地理环境、种族分布与历史背景。\n\n${Mock.Random.cparagraph(4, 8)}`,
          currentYear: Mock.Random.integer(10, 5000)
        }
        worlds.value.push(newWorld)
        if (!currentWorldId.value) currentWorldId.value = newWorld.id
        resolve()
      }, 1500) // 模拟较长的 AI 生成延迟
    })
  }

  const setCurrentWorldId = (id: string) => {
    currentWorldId.value = id
  }

  const advanceTime = async (worldId: string, years: number) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const world = worlds.value.find(w => w.id === worldId)
        if (world) {
          world.currentYear += years
          resolve()
        } else {
          reject(new Error('未找到当前世界'))
        }
      }, 500)
    })
  }

  return { worlds, currentWorldId, fetchWorlds, createWorld, generateWorld, setCurrentWorldId, advanceTime }
})
