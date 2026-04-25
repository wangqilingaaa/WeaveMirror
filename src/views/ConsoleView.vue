<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { NGrid, NGridItem, NCard, NList, NListItem, NThing, NTag, NTabs, NTabPane } from 'naive-ui'
import { useWorldStore } from '../stores/world'
import { useCharacterStore } from '../stores/character'
import TimeAdvancer from '../components/console/TimeAdvancer.vue'
import WorldYearbook from '../components/console/WorldYearbook.vue'
import BranchTree from '../components/console/BranchTree.vue'

const route = useRoute()
const worldStore = useWorldStore()
const characterStore = useCharacterStore()

const worldId = computed(() => route.params.worldId as string)

onMounted(async () => {
  // 确保在控制台页面刷新时也加载世界数据
  if (worldStore.worlds.length === 0) {
    await worldStore.fetchWorlds()
  }
})

const currentWorld = computed(() => {
  return worldStore.worlds.find(w => w.id === worldId.value)
})

const characters = computed(() => {
  return characterStore.getCharactersByWorld(worldId.value)
})
</script>

<template>
  <div style="max-width: 1400px; margin: 0 auto; padding: 24px;">
    <div style="margin-bottom: 24px;">
      <h2 style="margin: 0; font-size: 24px;">控制台 - 世界与时间线管理</h2>
      <p style="color: var(--n-text-color-3); margin-top: 8px;">
        当前世界：{{ currentWorld?.name || worldId }}
      </p>
    </div>

    <n-tabs type="line" animated style="background: var(--n-card-color); padding: 24px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      
      <!-- 面板1：时间推进与状态监控 -->
      <n-tab-pane name="time-control" tab="时间推进与状态">
        <n-grid x-gap="24" y-gap="24" cols="1 l:3" responsive="screen">
          <n-grid-item span="1">
            <TimeAdvancer :worldId="worldId" />
          </n-grid-item>

          <n-grid-item span="2">
            <n-card title="角色状态监控" bordered style="height: 100%;">
              <n-list hoverable v-if="characters.length > 0">
                <n-list-item v-for="char in characters" :key="char.id">
                  <n-thing>
                    <template #header>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 500;">{{ char.name }}</span>
                        <n-tag v-if="char.isProtagonist" type="error" size="small">主角</n-tag>
                      </div>
                    </template>
                    <template #description>
                      <div style="display: flex; gap: 16px; margin-top: 8px;">
                        <span><strong>年龄：</strong> {{ char.age !== null ? char.age + ' 岁' : '未知' }}</span>
                        <span>
                          <strong>状态：</strong>
                          <n-tag size="small" :type="char.status === '存活' ? 'success' : (char.status === '死亡' ? 'error' : 'default')">
                            {{ char.status }}
                          </n-tag>
                        </span>
                        <span><strong>生命阶段：</strong> {{ char.lifeStage }}</span>
                      </div>
                    </template>
                  </n-thing>
                </n-list-item>
              </n-list>
              <div v-else style="padding: 40px 0; text-align: center; color: var(--n-text-color-3);">
                暂无角色数据，请先在世界之书中创建角色。
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </n-tab-pane>

      <!-- 面板2：世界年鉴 -->
      <n-tab-pane name="world-yearbook" tab="世界年鉴 (Yearbook)">
        <WorldYearbook :worldId="worldId" />
      </n-tab-pane>

      <!-- 面板3：世界线分支树 -->
      <n-tab-pane name="branch-tree" tab="世界线分支树 (Timelines)">
        <BranchTree :worldId="worldId" />
      </n-tab-pane>
      
    </n-tabs>
  </div>
</template>
