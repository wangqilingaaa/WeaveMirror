<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { NCard, NForm, NFormItem, NInput, NButton, useMessage, NSpace } from 'naive-ui'

const router = useRouter()
const authStore = useAuthStore()
const message = useMessage()

const formValue = ref({
  username: '',
  password: ''
})

const handleLogin = async () => {
  try {
    await authStore.login(formValue.value.username, formValue.value.password)
    message.success('登录成功')
    router.push('/workshop')
  } catch (e: any) {
    message.error('登录失败: ' + e.message)
  }
}
</script>

<template>
  <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
    <n-card title="系统登录" style="width: 400px">
      <n-form :model="formValue">
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="formValue.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input v-model:value="formValue.password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
        </n-form-item>
        <n-space vertical>
          <n-button type="primary" block @click="handleLogin">登录</n-button>
          <n-button block @click="router.push('/register')">去注册</n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>
