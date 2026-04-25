<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { RadarChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

use([RadarChart, TooltipComponent, CanvasRenderer])

const props = defineProps<{
  attributes: {
    strength: number
    intelligence: number
    agility: number
  }
}>()

import { useAppStore } from '../../stores/app'

const appStore = useAppStore()

const chartOption = computed(() => {
  const isDark = appStore.themeMode === 'dark'
  const textColor = isDark ? 'rgba(255, 255, 255, 0.82)' : '#666'
  const splitLineColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E0E6ED'
  
  return {
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: [
        { name: '力量 (Strength)', max: 100 },
        { name: '智力 (Intelligence)', max: 100 },
        { name: '敏捷 (Agility)', max: 100 }
      ],
      shape: 'polygon',
      radius: '65%',
      axisName: {
        color: textColor,
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: splitLineColor
        }
      },
      splitArea: {
        areaStyle: {
          color: isDark 
            ? ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.05)']
            : ['rgba(24, 144, 255, 0.05)', 'rgba(24, 144, 255, 0.1)']
        }
      }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [
              props.attributes.strength,
              props.attributes.intelligence,
              props.attributes.agility
            ],
            name: '角色属性',
            itemStyle: {
              color: 'var(--n-primary-color)'
            },
            areaStyle: {
              color: isDark ? 'rgba(24, 160, 88, 0.2)' : 'rgba(24, 144, 255, 0.2)'
            }
          }
        ]
      }
    ]
  }
})
</script>

<template>
  <div style="width: 100%; height: 260px;">
    <v-chart class="chart" :option="chartOption" autoresize />
  </div>
</template>

<style scoped>
.chart {
  height: 100%;
  width: 100%;
}
</style>
