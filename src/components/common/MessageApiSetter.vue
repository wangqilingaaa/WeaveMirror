<script setup lang="ts">
import { useMessage } from 'naive-ui'

/** 将 Naive UI 的 message API 挂载到 window 上，方便全局使用 */
const message = useMessage()
window.$message = message
</script>

<template>
  <slot />
</template>
