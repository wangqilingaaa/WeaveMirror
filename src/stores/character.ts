import { defineStore } from 'pinia'
import { ref } from 'vue'

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
  const characters = ref<Character[]>([
    {
      id: 'c_w1_1',
      worldId: 'w1',
      name: '亚瑟',
      age: 22,
      tags: ['主角', '剑士'],
      attributes: { strength: 80, intelligence: 60, agility: 75 },
      status: '存活',
      lifeStage: '青年',
      currentGoal: '寻找失落的圣剑',
      isProtagonist: true
    },
    {
      id: 'c_w1_2',
      worldId: 'w1',
      name: '梅林',
      age: 65,
      tags: ['导师', '法师'],
      attributes: { strength: 30, intelligence: 95, agility: 40 },
      status: '存活',
      lifeStage: '老年',
      currentGoal: '教导亚瑟',
      isProtagonist: false
    }
  ])
  const relationships = ref<Relationship[]>([
    {
      id: 'r_w1_1',
      worldId: 'w1',
      source: 'c_w1_1',
      target: 'c_w1_2',
      label: '师徒'
    }
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
          id: 'c_' + Date.now(),
          worldId,
          name: '生成的' + (keywords || '角色'),
          age: Math.floor(Math.random() * 20) + 15,
          tags: ['勇敢', 'AI生成', '神秘'],
          attributes: {
            strength: Math.floor(Math.random() * 50) + 50,
            intelligence: Math.floor(Math.random() * 50) + 50,
            agility: Math.floor(Math.random() * 50) + 50
          },
          status: '存活',
          lifeStage: '青年',
          currentGoal: '寻找自己的宿命与归宿',
          isProtagonist: false
        })
      }, 1000)
    })
  }

  const batchGenerateSupporting = async (worldId: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const timestamp = Date.now()
        const chars: Character[] = [
          { id: 'c_' + timestamp + '_1', worldId, name: '艾莉亚 (配角)', age: 20, tags: ['随和', '治疗'], attributes: { strength: 30, intelligence: 80, agility: 55 }, status: '存活', lifeStage: '青年', currentGoal: '辅助主角完成使命', isProtagonist: false },
          { id: 'c_' + timestamp + '_2', worldId, name: '加尔 (配角)', age: 25, tags: ['暴躁', '近战'], attributes: { strength: 90, intelligence: 40, agility: 80 }, status: '存活', lifeStage: '青年', currentGoal: '证明自己是世界上最强的战士', isProtagonist: false },
          { id: 'c_' + timestamp + '_3', worldId, name: '导师塞恩 (配角)', age: 50, tags: ['智慧', '魔法'], attributes: { strength: 40, intelligence: 95, agility: 40 }, status: '未知', lifeStage: '中年', currentGoal: '传授禁忌魔法并寻找古代遗迹', isProtagonist: false }
        ]
        characters.value.push(...chars)
        
        // 尝试与主角建立默认关系
        const protagonist = characters.value.find(c => c.worldId === worldId && c.isProtagonist)
        if (protagonist) {
          relationships.value.push({ id: 'r_' + timestamp + '_1', worldId, source: protagonist.id, target: chars[0].id, label: '挚友' })
          relationships.value.push({ id: 'r_' + timestamp + '_2', worldId, source: protagonist.id, target: chars[1].id, label: '竞争对手' })
          relationships.value.push({ id: 'r_' + timestamp + '_3', worldId, source: chars[2].id, target: protagonist.id, label: '指导' })
        }
        resolve()
      }, 1000)
    })
  }

  const advanceAgeByWorld = (worldId: string, years: number) => {
    characters.value.forEach(char => {
      if (char.worldId === worldId && char.age !== null) {
        char.age += years
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
