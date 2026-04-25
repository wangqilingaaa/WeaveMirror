<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NDescriptions, NDescriptionsItem, NTag, NSpace, NDivider, NList, NListItem, NThing, NTabs, NTabPane } from 'naive-ui'
import { useCharacterStore, type Character } from '../../stores/character'
import AttributeChart from './AttributeChart.vue'
import StorylineTimeline from '../memory/StorylineTimeline.vue'

const props = defineProps<{
  character: Character
  worldId: string
}>()

const emit = defineEmits<{
  (e: 'jump-to', characterId: string): void
}>()

const characterStore = useCharacterStore()

const relatedRelationships = computed(() => {
  const allRels = characterStore.getRelationshipsByWorld(props.worldId)
  return allRels.filter(r => r.source === props.character.id || r.target === props.character.id).map(r => {
    const isSource = r.source === props.character.id
    const otherId = isSource ? r.target : r.source
    const otherChar = characterStore.getCharactersByWorld(props.worldId).find(c => c.id === otherId)
    return {
      ...r,
      otherChar,
      direction: isSource ? 'to' : 'from'
    }
  }).filter(r => r.otherChar) // Filter out if char not found
})

const handleJump = (charId: string) => {
  emit('jump-to', charId)
}
</script>

<template>
  <div style="height: 100%; display: flex; flex-direction: column;">
    <n-card :title="character.name" bordered style="flex: 1; display: flex; flex-direction: column; border-radius: 8px; min-height: 0;" content-style="flex: 1; overflow: hidden; padding: 0; display: flex; flex-direction: column;">
      <template #header-extra>
        <n-tag v-if="character.isProtagonist" type="error">主角</n-tag>
        <n-tag v-else type="info">配角</n-tag>
      </template>

      <n-tabs type="line" size="large" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0;" pane-wrapper-style="flex: 1; display: flex; flex-direction: column; min-height: 0;" pane-style="flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; min-height: 0;">
        <n-tab-pane name="profile" tab="档案与关系" style="flex: 1;">
          <!-- 基础信息 -->
          <n-descriptions label-placement="left" title="基础档案" :column="2">
            <n-descriptions-item label="年龄">{{ character.age || '未知' }}</n-descriptions-item>
            <n-descriptions-item label="状态">
              <n-tag v-if="character.status" size="small" :type="character.status === '存活' ? 'success' : (character.status === '死亡' ? 'error' : 'default')">
                {{ character.status }}
              </n-tag>
              <span v-else style="color: var(--n-text-color-3);">未知</span>
            </n-descriptions-item>
            <n-descriptions-item label="生命阶段">
              {{ character.lifeStage || '未知' }}
            </n-descriptions-item>
          </n-descriptions>

          <div style="margin-top: 16px;">
            <span style="color: var(--n-text-color-3); font-size: 14px;">当前目标：</span>
            <div style="margin-top: 8px; padding: 12px; background-color: var(--n-color-modal); border-radius: 4px; font-size: 14px;">
              {{ character.currentGoal || '暂无明确目标' }}
            </div>
          </div>

          <div style="margin-top: 16px;">
            <span style="color: var(--n-text-color-3); font-size: 14px;">性格标签：</span>
            <n-space style="margin-top: 8px;">
              <n-tag v-for="tag in character.tags" :key="tag" type="primary" ghost size="small">
                {{ tag }}
              </n-tag>
              <span v-if="!character.tags.length" style="color: var(--n-text-color-3); font-size: 12px;">暂无标签</span>
            </n-space>
          </div>

          <n-divider />

          <!-- 属性图表 -->
          <div style="margin-top: 24px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 500;">能力属性</h3>
            <AttributeChart :attributes="character.attributes" />
          </div>

          <n-divider />

          <!-- 关系列表 -->
          <div>
            <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 500;">社交关系</h3>
            <n-list hoverable v-if="relatedRelationships.length > 0">
              <n-list-item v-for="rel in relatedRelationships" :key="rel.id">
                <n-thing>
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <span style="color: var(--n-text-color-3); font-size: 13px;">
                        {{ rel.direction === 'to' ? '认为' : '被认为' }}
                      </span>
                      <a href="javascript:void(0)" @click.prevent="handleJump(rel.otherChar!.id)" style="color: var(--n-primary-color); font-weight: 500; text-decoration: none;">
                        {{ rel.otherChar?.name }}
                      </a>
                      <span style="color: var(--n-text-color-3); font-size: 13px;">是</span>
                      <n-tag type="warning" size="small">{{ rel.label }}</n-tag>
                    </div>
                  </div>
                </n-thing>
              </n-list-item>
            </n-list>
            <div v-else style="padding: 24px 0; text-align: center; color: var(--n-text-color-3);">
              该角色暂无任何社交关系
            </div>
          </div>
        </n-tab-pane>

        <n-tab-pane name="epic" tab="个人史诗" style="flex: 1; padding: 0; overflow: hidden; display: flex; flex-direction: column;">
          <StorylineTimeline :characterId="character.id" />
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>
