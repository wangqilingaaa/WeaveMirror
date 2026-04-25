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
  password: '',
  confirmPassword: ''
})

const handleRegister = async () => {
  if (formValue.value.password !== formValue.value.confirmPassword) {
    message.error('两次输入的密码不一致')
    return
  }

  try {
    await authStore.register(formValue.value.username, formValue.value.password)
    message.success('注册成功，请登录')
    router.push('/login')
  } catch (e: any) {
    message.error('注册失败: ' + e.message)
  }
}
</script>

<template>
  <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
    <n-card title="注册账号" style="width: 400px">
      <n-form :model="formValue">
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="formValue.username" placeholder="请输入用户名" />
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input v-model:value="formValue.password" type="password" placeholder="请输入密码" />
        </n-form-item>
        <n-form-item label="确认密码" path="confirmPassword">
          <n-input v-model:value="formValue.confirmPassword" type="password" placeholder="请再次输入密码" @keyup.enter="handleRegister" />
        </n-form-item>
        <n-space vertical>
          <n-button type="primary" block @click="handleRegister">注册</n-button>
          <n-button block @click="router.push('/login')">返回登录</n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>
