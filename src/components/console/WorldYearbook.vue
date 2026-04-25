<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { NTimeline, NTimelineItem, NCard, NSpin } from 'naive-ui'
import EmptyState from '../common/EmptyState.vue'
import { useTimelineStore } from '../../stores/timeline'

const props = defineProps<{
  worldId: string
}>()

const timelineStore = useTimelineStore()
const loading = ref(true)

const sortedEvents = computed(() => {
  return timelineStore.events
    .filter(e => e.worldId === props.worldId)
    .sort((a, b) => a.year - b.year)
})

onMounted(async () => {
  loading.value = true
  await timelineStore.fetchYearbook(props.worldId)
  loading.value = false
})
</script>

<template>
  <n-card title="世界年鉴" bordered style="height: 100%;">
    <n-spin :show="loading" style="height: 100%;">
        <div v-if="sortedEvents.length === 0 && !loading" style="height: 100%;">
          <EmptyState type="default" description="这个世界还没有记录任何重大历史事件。" />
        </div>
        
        <n-timeline v-else size="large" style="padding: 16px;">
        <n-timeline-item
          v-for="event in sortedEvents"
          :key="event.id"
          :type="event.type"
          :title="event.title"
          :content="event.description"
          :time="`星历 ${event.year} 年`"
        />
      </n-timeline>
    </n-spin>
  </n-card>
</template>

<style scoped>
/* 可根据需要自定义时间轴样式 */
</style>
