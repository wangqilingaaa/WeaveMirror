<script setup lang="ts">
import { computed, ref } from 'vue'
import { use } from 'echarts/core'
import { GraphChart } from 'echarts/charts'
import { TooltipComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { NEmpty } from 'naive-ui'
import { useAppStore } from '../stores/app'
import type { Character, Relationship } from '../stores/character'

// 注册 echarts 核心组件
use([GraphChart, TooltipComponent, TitleComponent, CanvasRenderer])

const props = defineProps<{
  characters: Character[]
  relationships: Relationship[]
}>()

const appStore = useAppStore()

const hasData = computed(() => props.characters.length > 0)

const selectedNodeId = ref<string | null>(null)

const selectedNodeChar = computed(() => {
  if (!selectedNodeId.value) return null
  return props.characters.find(c => c.id === selectedNodeId.value) || null
})

const handleNodeClick = (params: any) => {
  if (params.dataType === 'node') {
    selectedNodeId.value = params.data.id
  } else {
    selectedNodeId.value = null
  }
}

const closePopup = () => {
  selectedNodeId.value = null
}

const chartOption = computed(() => {
  const isDark = appStore.themeMode === 'dark'
  const textColor = isDark ? 'rgba(255, 255, 255, 0.82)' : '#333'
  const labelColor = isDark ? 'rgba(255, 255, 255, 0.82)' : '#666'
  const labelBgColor = isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'
  const borderColor = isDark ? '#333' : '#fff'
  const defaultLineColor = isDark ? '#666' : '#999'
  const defaultEnemyLineColor = isDark ? '#fff' : '#000'

  const nodes = props.characters.map(c => {
    // 简单模拟活跃度（节点大小）：主角大，配角根据属性总和稍微变化，范围在 40~60
    const attrSum = c.attributes.strength + c.attributes.intelligence + c.attributes.agility
    const baseSize = c.isProtagonist ? 70 : 40 + (attrSum / 300) * 20

    return {
      id: c.id,
      name: c.name,
      symbolSize: baseSize,
      draggable: true,
      itemStyle: {
        color: c.isProtagonist ? '#ff4d4f' : '#1890ff', // 主角红色，配角蓝色
        borderColor: borderColor,
        borderWidth: 2,
        shadowBlur: 10,
        shadowColor: 'rgba(0,0,0,0.2)'
      },
      label: {
        show: true,
        position: 'bottom',
        color: textColor,
        fontSize: 14,
        fontWeight: 'bold'
      }
    }
  })

  const edges = props.relationships.map(r => {
    // 简单模拟关系强度（边粗细和颜色）：比如“挚友”最强
    let lineWidth = 2
    let lineColor = defaultLineColor
    
    if (r.label.includes('挚友') || r.label.includes('爱人') || r.label.includes('伴侣')) {
      lineWidth = 4
      lineColor = '#ff7875'
    } else if (r.label.includes('敌') || r.label.includes('仇')) {
      lineWidth = 3
      lineColor = defaultEnemyLineColor
    }

    return {
      source: r.source,
      target: r.target,
      label: {
        show: true,
        formatter: r.label,
        color: labelColor,
        fontSize: 12,
        backgroundColor: labelBgColor,
        padding: [2, 4],
        borderRadius: 4
      },
      lineStyle: {
        color: lineColor,
        width: lineWidth,
        curveness: 0.2
      }
    }
  })

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const char = props.characters.find(c => c.id === params.data.id)
          if (!char) return ''
          return `
            <div style="padding: 4px;">
              <strong>${char.name} ${char.isProtagonist ? '(主角)' : ''}</strong><br/>
              年龄: ${char.age}<br/>
              标签: ${char.tags.join(', ')}<br/>
              属性: 力量${char.attributes.strength} | 智力${char.attributes.intelligence} | 敏捷${char.attributes.agility}
            </div>
          `
        } else if (params.dataType === 'edge') {
          const src = props.characters.find(c => c.id === params.data.source)
          const tgt = props.characters.find(c => c.id === params.data.target)
          return `${src?.name} -> ${tgt?.name} : ${params.data.label.formatter}`
        }
      }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true, // 允许缩放和平移
        draggable: true, // 节点可拖拽
        focusNodeAdjacency: true, // 高亮相邻节点（ECharts 4） / 5版本使用 emphasis: { focus: 'adjacency' }
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 5
          }
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [4, 8],
        data: nodes,
        links: edges,
        force: {
          repulsion: 500, // 增加排斥力让节点散开一点
          edgeLength: [150, 250], // 边长范围
          gravity: 0.1,
          friction: 0.2 // 增加摩擦力，拖拽停止后更快稳定
        }
      }
    ]
  }
})
</script>

<template>
  <div style="width: 100%; height: 500px; background: var(--n-color); border: 1px solid var(--n-border-color); border-radius: 8px; position: relative;">
    <v-chart v-if="hasData" class="chart" :option="chartOption" autoresize @click="handleNodeClick" />
    <div v-else style="height: 100%; display: flex; align-items: center; justify-content: center;">
      <n-empty description="暂无角色关系数据，请先创建角色" />
    </div>

    <!-- 详情浮层 -->
    <div v-if="selectedNodeChar" class="detail-popup">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 16px; color: var(--n-text-color);">{{ selectedNodeChar.name }}</h3>
        <span style="cursor: pointer; color: var(--n-text-color-3);" @click="closePopup">✕</span>
      </div>
      <div style="font-size: 13px; color: var(--n-text-color-3); line-height: 1.8;">
        <div><strong style="color: var(--n-text-color);">身份:</strong> {{ selectedNodeChar.isProtagonist ? '主角' : '配角' }}</div>
        <div><strong style="color: var(--n-text-color);">状态:</strong> {{ selectedNodeChar.status || '未知' }}</div>
        <div><strong style="color: var(--n-text-color);">年龄:</strong> {{ selectedNodeChar.age || '未知' }}</div>
        <div><strong style="color: var(--n-text-color);">生命阶段:</strong> {{ selectedNodeChar.lifeStage || '未知' }}</div>
        <div>
          <strong style="color: var(--n-text-color);">标签:</strong>
          <span v-if="selectedNodeChar.tags.length">
            {{ selectedNodeChar.tags.join(', ') }}
          </span>
          <span v-else>无</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart {
  height: 100%;
  width: 100%;
}

.detail-popup {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 200px;
  background: var(--n-color-modal);
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 10;
  pointer-events: auto;
}
</style>
