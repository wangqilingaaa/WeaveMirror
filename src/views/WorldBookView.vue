<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { NButton } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const worldId = Number(route.params.worldId)

function goToWorkshop() {
  router.push({ name: 'Workshop' })
}
</script>

<template>
  <div class="worldbook-placeholder">
    <div class="placeholder-card">
      <h1 class="placeholder-title">世界之书</h1>
      <p class="placeholder-world">世界观 ID：{{ worldId }}</p>
      <p class="placeholder-desc">
        查阅此世界观下所有角色的档案、关系图谱与历史事件。<br>
        未来将集成角色卡片、关系网与年鉴系统。
      </p>
      <NButton class="btn-back" @click="goToWorkshop">
        返回工坊
      </NButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.worldbook-placeholder {
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
