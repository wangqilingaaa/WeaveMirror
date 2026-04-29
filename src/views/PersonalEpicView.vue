<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { NButton } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const characterId = Number(route.params.characterId)

function goToWorkshop() {
  router.push({ name: 'Workshop' })
}
</script>

<template>
  <div class="epic-placeholder">
    <div class="placeholder-card">
      <h1 class="placeholder-title">个人史诗</h1>
      <p class="placeholder-world">角色 ID：{{ characterId }}</p>
      <p class="placeholder-desc">
        回顾角色的完整故事线，标记关键记忆节点。<br>
        未来将支持故事线时间轴、固定条目与情感标签。
      </p>
      <NButton class="btn-back" @click="goToWorkshop">
        返回工坊
      </NButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.epic-placeholder {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-deep);
}

.placeholder-card {
  text-align: center;
  max-width: 480px;
  padding: 48px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.placeholder-title {
  margin: 0 0 8px;
  font-family: var(--font-title);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-body);
}

.placeholder-world {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.placeholder-desc {
  margin: 0 0 32px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-text-desc);
}

.btn-back {
  font-size: 14px;
}
</style>
