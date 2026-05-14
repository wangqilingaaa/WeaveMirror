<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NTag } from 'naive-ui'
import type { StageWorldSection } from './stageTypes'

const props = defineProps<{
  worldName: string
  headerTag: string
  subtitle: string
  sections: StageWorldSection[]
}>()

/**
 * 左侧栏需要支持信息展开/收起。
 * 使用本地状态记录当前展开的 section id，可以把交互细节收敛在组件内部，
 * 避免父组件承担纯视图层状态管理。
 */
const expandedSectionIds = ref<string[]>([])

const sectionIds = computed(() => props.sections.map((section) => section.id))

function syncExpandedSections() {
  const nextExpanded = props.sections
    .filter((section) => section.initiallyExpanded)
    .map((section) => section.id)

  /**
   * 当父组件传入的新 section 集合发生变化时，保留仍然存在的展开项，
   * 并补上新的默认展开项，避免刷新数据后用户刚展开的面板突然全部折叠。
   */
  expandedSectionIds.value = [
    ...new Set([
      ...expandedSectionIds.value.filter((id) => sectionIds.value.includes(id)),
      ...nextExpanded
    ])
  ]
}

function toggleSection(sectionId: string) {
  expandedSectionIds.value = expandedSectionIds.value.includes(sectionId)
    ? expandedSectionIds.value.filter((id) => id !== sectionId)
    : [...expandedSectionIds.value, sectionId]
}

function isExpanded(sectionId: string) {
  return expandedSectionIds.value.includes(sectionId)
}

watch(
  () => props.sections,
  () => {
    syncExpandedSections()
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <aside class="world-sidebar">
    <header class="sidebar-header">
      <div>
        <p class="sidebar-header__eyebrow">世界核心信息</p>
        <h2 class="sidebar-header__title">{{ worldName }}</h2>
      </div>
      <NTag size="small" round type="info">{{ headerTag }}</NTag>
    </header>

    <p class="sidebar-subtitle">{{ subtitle }}</p>

    <div class="section-list">
      <section
        v-for="section in sections"
        :key="section.id"
        class="sidebar-section"
        :class="{ 'sidebar-section--expanded': isExpanded(section.id) }"
      >
        <button
          type="button"
          class="sidebar-section__toggle"
          @click="toggleSection(section.id)"
        >
          <div class="sidebar-section__heading">
            <h3 class="sidebar-section__title">{{ section.title }}</h3>
            <p class="sidebar-section__summary">{{ section.summary }}</p>
          </div>
          <span class="sidebar-section__arrow" :class="{ 'sidebar-section__arrow--expanded': isExpanded(section.id) }">
            ▾
          </span>
        </button>

        <div class="sidebar-section__body" :class="{ 'sidebar-section__body--expanded': isExpanded(section.id) }">
          <div class="sidebar-section__body-inner">
            <p v-if="section.description" class="sidebar-section__description">
              {{ section.description }}
            </p>

            <div v-if="section.entries?.length" class="entry-list">
              <div v-for="entry in section.entries" :key="entry" class="entry-list__item">
                {{ entry }}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.world-sidebar {
  height: 100%;
  min-height: 0;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(22, 19, 31, 0.82);
  backdrop-filter: blur(10px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.sidebar-header__eyebrow {
  margin: 0 0 6px;
  color: var(--color-text-muted);
  font-size: 12px;
  letter-spacing: 1px;
}

.sidebar-header__title {
  margin: 0;
  color: var(--color-text-body);
  font-size: 24px;
  font-family: var(--font-title);
}

.sidebar-subtitle {
  margin: 10px 0 16px;
  color: var(--color-text-desc);
  line-height: 1.7;
}

.section-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 6px;
}

.sidebar-section {
  border: 1px solid rgba(180, 142, 255, 0.08);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.02);
  transition: border-color var(--transition-fast), transform var(--transition-fast);
}

.sidebar-section:hover,
.sidebar-section--expanded {
  border-color: rgba(180, 142, 255, 0.22);
}

.sidebar-section__toggle {
  width: 100%;
  padding: 14px 16px;
  border: 0;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  text-align: left;
  cursor: pointer;
}

.sidebar-section__heading {
  min-width: 0;
}

.sidebar-section__title {
  margin: 0 0 6px;
  color: var(--color-text-body);
  font-size: 15px;
}

.sidebar-section__summary {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.6;
  font-size: 13px;
}

.sidebar-section__arrow {
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: transform var(--transition-fast), color var(--transition-fast);
}

.sidebar-section__arrow--expanded {
  transform: rotate(180deg);
  color: var(--color-primary);
}

.sidebar-section__body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 220ms ease, opacity 220ms ease;
  opacity: 0;
}

.sidebar-section__body--expanded {
  max-height: 420px;
  opacity: 1;
}

.sidebar-section__body-inner {
  padding: 0 16px 16px;
  overflow-y: auto;
}

.sidebar-section__description {
  margin: 0 0 12px;
  color: var(--color-text-desc);
  line-height: 1.8;
  white-space: pre-wrap;
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.entry-list__item {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text-desc);
  line-height: 1.7;
}

@media (max-width: 768px) {
  .sidebar-header {
    flex-direction: column;
  }
}
</style>
