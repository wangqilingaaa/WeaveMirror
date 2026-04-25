import { defineStore } from 'pinia'
import { ref } from 'vue'
import Mock from 'mockjs'

export interface Character {
  id: string
  worldId: string
  name: string
  age: number | null
  tags: string[]
  attributes: {
    strength: number
    intelligence: number
    agility: number
  }
  status: '存活' | '死亡' | '失踪' | '未知'
  lifeStage: '幼年' | '少年' | '青年' | '中年' | '老年' | '未知'
  currentGoal: string
  isProtagonist: boolean
}

export interface Relationship {
  id: string
  worldId: string
  source: string // character id
  target: string // character id
  label: string
}

export const useCharacterStore = defineStore('character', () => {
  const mockInitialCharacters = Mock.mock({
    'characters|15-30': [
      {
        'id': '@guid',
        'worldId': '@pick(["w1", "w2", "w3"])',
        'name': '@cname',
        'age|10-100': 1,
        'tags|1-3': ['@cword(2, 4)'],
        'attributes': {
          'strength|10-100': 1,
          'intelligence|10-100': 1,
          'agility|10-100': 1
        },
        'status|1': ['存活', '死亡', '失踪', '未知'],
        'lifeStage|1': ['幼年', '少年', '青年', '中年', '老年', '未知'],
        'currentGoal': '@csentence(5, 15)',
        'isProtagonist|1-10': true // 10% 概率是主角
      }
    ]
  }).characters

  const characters = ref<Character[]>([
    {
      id: 'c_w1_1',
      worldId: 'w1',
      name: '亚瑟',
      age: 22,
      tags: ['主角', '剑士', '命运之子'],
      attributes: { strength: 80, intelligence: 60, agility: 75 },
      status: '存活',
      lifeStage: '青年',
      currentGoal: '寻找失落的圣剑并统一阿卡迪亚',
      isProtagonist: true
    },
    {
      id: 'c_w1_2',
      worldId: 'w1',
      name: '梅林',
      age: 65,
      tags: ['导师', '法师', '先知'],
      attributes: { strength: 30, intelligence: 95, agility: 40 },
      status: '存活',
      lifeStage: '老年',
      currentGoal: '教导亚瑟并引导世界的走向',
      isProtagonist: false
    },
    {
      id: 'c_w2_1',
      worldId: 'w2',
      name: '铁影',
      age: 34,
      tags: ['猎人', '赛博改造', '冷酷'],
      attributes: { strength: 90, intelligence: 40, agility: 85 },
      status: '存活',
      lifeStage: '中年',
      currentGoal: '寻找传说中的净水芯片',
      isProtagonist: true
    },
    ...mockInitialCharacters
  ])

  // 动态生成关系假数据
  const mockRelationships = []
  for (let i = 0; i < 20; i++) {
    const worldId = Mock.Random.pick(['w1', 'w2'])
    const worldChars = characters.value.filter(c => c.worldId === worldId)
    if (worldChars.length >= 2) {
      const source = Mock.Random.pick(worldChars)
      let target = Mock.Random.pick(worldChars)
      while (target.id === source.id) {
        target = Mock.Random.pick(worldChars)
      }
      mockRelationships.push({
        id: Mock.Random.guid(),
        worldId,
        source: source.id,
        target: target.id,
        label: Mock.Random.pick(['朋友', '宿敌', '亲属', '恋人', '盟友', '背叛者'])
      })
    }
  }

  const relationships = ref<Relationship[]>([
    {
      id: 'r_w1_1',
      worldId: 'w1',
      source: 'c_w1_1',
      target: 'c_w1_2',
      label: '师徒'
    },
    ...mockRelationships
  ])

  const getCharactersByWorld = (worldId: string) => {
    return characters.value.filter(c => c.worldId === worldId)
  }

  const getRelationshipsByWorld = (worldId: string) => {
    return relationships.value.filter(r => r.worldId === worldId)
  }

  const addCharacter = (char: Character) => {
    characters.value.push(char)
  }

  const addRelationship = (rel: Relationship) => {
    relationships.value.push(rel)
  }

  const generateCharacter = async (worldId: string, keywords: string): Promise<Character> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Mock.Random.guid(),
          worldId,
          name: Mock.Random.cname() + (keywords ? `(${keywords})` : ''),
          age: Mock.Random.integer(10, 80),
          tags: Mock.mock({ 'array|2-4': ['@cword(2, 4)'] }).array,
          attributes: {
            strength: Mock.Random.integer(20, 100),
            intelligence: Mock.Random.integer(20, 100),
            agility: Mock.Random.integer(20, 100)
          },
          status: Mock.Random.pick(['存活', '死亡', '失踪', '未知']),
          lifeStage: Mock.Random.pick(['幼年', '少年', '青年', '中年', '老年', '未知']),
          currentGoal: Mock.Random.csentence(5, 15),
          isProtagonist: false
        })
      }, 500)
    })
  }

  const batchGenerateSupporting = async (worldId: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const mockChars = Mock.mock({
          'characters|3-5': [
            {
              'id': '@guid',
              'worldId': worldId,
              'name': '@cname (配角)',
              'age|10-80': 1,
              'tags|1-3': ['@cword(2, 4)'],
              'attributes': {
                'strength|20-100': 1,
                'intelligence|20-100': 1,
                'agility|20-100': 1
              },
              'status|1': ['存活', '死亡', '失踪', '未知'],
              'lifeStage|1': ['幼年', '少年', '青年', '中年', '老年', '未知'],
              'currentGoal': '@csentence(5, 15)',
              'isProtagonist': false
            }
          ]
        }).characters

        characters.value.push(...mockChars)
        
        // 尝试与主角建立默认关系
        const protagonist = characters.value.find(c => c.worldId === worldId && c.isProtagonist)
        if (protagonist) {
          mockChars.forEach((char: Character) => {
            relationships.value.push({
              id: Mock.Random.guid(),
              worldId,
              source: protagonist.id,
              target: char.id,
              label: Mock.Random.pick(['挚友', '竞争对手', '指导', '路人', '暗恋', '宿敌'])
            })
          })
        }
        resolve()
      }, 1000)
    })
  }

  const advanceAgeByWorld = (worldId: string, years: number) => {
    characters.value.forEach(c => {
      if (c.worldId === worldId && c.age !== null) {
        c.age += years
      }
    })
  }

  return { 
    characters, 
    relationships, 
    getCharactersByWorld, 
    getRelationshipsByWorld, 
    addCharacter, 
    addRelationship,
    generateCharacter,
    batchGenerateSupporting,
    advanceAgeByWorld
  }
})
