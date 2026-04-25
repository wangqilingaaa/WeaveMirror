<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { NGrid, NGridItem, NCard, NSpace, NButton, useMessage, NDivider, NTabs, NTabPane, NEmpty } from 'naive-ui'
import { useWorldStore } from '../stores/world'
import { useCharacterStore, type Character } from '../stores/character'
import CharacterCreator from '../components/CharacterCreator.vue'
import RelationshipGraph from '../components/RelationshipGraph.vue'
import CharacterList from '../components/worldbook/CharacterList.vue'
import CharacterDetail from '../components/worldbook/CharacterDetail.vue'
import MultiPerspectiveCompare from '../components/memory/MultiPerspectiveCompare.vue'

const route = useRoute()
const message = useMessage()
const worldStore = useWorldStore()
const characterStore = useCharacterStore()

const worldId = computed(() => route.params.worldId as string)

const currentWorld = computed(() => {
  return worldStore.worlds.find(w => w.id === worldId.value)
})

const characters = computed(() => characterStore.getCharactersByWorld(worldId.value))
const relationships = computed(() => characterStore.getRelationshipsByWorld(worldId.value))

const isBatchGenerating = ref(false)
const selectedCharacter = ref<Character | null>(null)

const handleCharacterSelect = (char: Character) => {
  selectedCharacter.value = char
}

const handleJumpToCharacter = (charId: string) => {
  const target = characters.value.find(c => c.id === charId)
  if (target) {
    selectedCharacter.value = target
  }
}

const handleBatchGenerate = async () => {
  isBatchGenerating.value = true
  try {
    await characterStore.batchGenerateSupporting(worldId.value)
    message.success('已批量生成 3 名配角及其关系网')
  } catch (e: any) {
    message.error('生成配角失败: ' + e.message)
  } finally {
    isBatchGenerating.value = false
  }
}
</script>

<template>
  <div style="max-width: 1400px; margin: 0 auto; height: calc(100vh - 112px); display: flex; flex-direction: column;">
    <div style="margin-bottom: 16px; flex-shrink: 0;">
      <h2 style="margin: 0; font-size: 24px; color: var(--n-text-color);">世界之书 - 角色与关系</h2>
      <p style="color: var(--n-text-color-3); margin-top: 8px;">
        当前世界：{{ currentWorld?.name || worldId }}
      </p>
    </div>

    <n-card style="flex: 1; display: flex; flex-direction: column; overflow: hidden;" content-style="padding: 0; display: flex; flex-direction: column; min-height: 0;">
      <n-tabs type="line" size="large" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0;" pane-wrapper-style="flex: 1; display: flex; flex-direction: column; min-height: 0;" pane-style="flex: 1; padding: 24px; overflow: hidden; background-color: var(--n-color-modal); display: flex; flex-direction: column; min-height: 0;">
        
        <!-- 角色列表与详情 -->
        <n-tab-pane name="list" tab="角色总览" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
          <n-grid x-gap="24" cols="1 l:3" style="flex: 1; min-height: 0;" responsive="screen">
            <n-grid-item span="1" style="height: 100%; border-right: 1px solid var(--n-border-color); background-color: var(--n-color); border-radius: 8px; display: flex; flex-direction: column; min-height: 0;">
              <CharacterList :worldId="worldId" @select="handleCharacterSelect" />
            </n-grid-item>
            <n-grid-item span="2" style="height: 100%; display: flex; flex-direction: column; min-height: 0;">
              <CharacterDetail v-if="selectedCharacter" :character="selectedCharacter" :worldId="worldId" @jump-to="handleJumpToCharacter" />
              <div v-else style="flex: 1; display: flex; align-items: center; justify-content: center; background-color: var(--n-color); border-radius: 8px; min-height: 0; border: 1px solid var(--n-border-color);">
                <n-empty description="请在左侧选择一个角色查看详情" />
              </div>
            </n-grid-item>
          </n-grid>
        </n-tab-pane>

        <!-- 创建与关系图 -->
        <n-tab-pane name="graph" tab="创建与关系网" style="flex: 1; overflow-y: auto;">
          <n-grid x-gap="24" y-gap="24" cols="1 l:3" responsive="screen">
            <n-grid-item span="1">
              <CharacterCreator :worldId="worldId" />
            </n-grid-item>
            <n-grid-item span="2">
              <n-card title="角色关系网谱" bordered>
                <template #header-extra>
                  <n-button type="primary" ghost size="small" :loading="isBatchGenerating" @click="handleBatchGenerate">
                    一键生成配角网
                  </n-button>
                </template>
                <RelationshipGraph :characters="characters" :relationships="relationships" />
                <n-divider />
                <n-space align="center">
                  <div style="width: 12px; height: 12px; background: var(--n-error-color); border-radius: 50%;"></div>
                  <span style="font-size: 12px; color: var(--n-text-color-3);">主角</span>
                  <div style="width: 12px; height: 12px; background: var(--n-info-color); border-radius: 50%; margin-left: 16px;"></div>
                  <span style="font-size: 12px; color: var(--n-text-color-3);">配角</span>
                </n-space>
              </n-card>
            </n-grid-item>
          </n-grid>
        </n-tab-pane>

        <n-tab-pane name="compare" tab="多棱镜对比" style="flex: 1; display: flex; flex-direction: column;">
          <MultiPerspectiveCompare :worldId="worldId" />
        </n-tab-pane>

      </n-tabs>
    </n-card>
  </div>
</template>
