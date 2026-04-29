<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NInput, NForm, NFormItemGi, NGrid, NDatePicker, useMessage } from 'naive-ui'
import { useAppStore } from '@/stores/app'
import type { RegisterParams } from '@/types'

const router = useRouter()
const appStore = useAppStore()
const message = useMessage()

const loading = ref(false)

/** 表单数据（含前端验证字段 confirmPassword，API 不接收） */
const formData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  birth_date: null as number | null
})

function validateEmail(_rule: any, value: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    return new Error('请输入有效的邮箱地址')
  }
  return true
}

function validateConfirmPassword(_rule: any, value: string) {
  if (value !== formData.password) {
    return new Error('两次输入的密码不一致')
  }
  return true
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符之间', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '只能包含字母、数字、下划线和中文', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { validator: validateEmail, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度在 6 到 32 个字符之间', trigger: 'blur' },
    { pattern: /^(?=.*[a-zA-Z])(?=.*\d)/, message: '密码需包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const formRef = ref<InstanceType<typeof NForm> | null>(null)

async function handleRegister() {
  try {
    await formRef.value?.validate()

    loading.value = true
    appStore.setGlobalLoading(true)

    /** 构造 API 请求参数（不含 confirmPassword） */
    const params: RegisterParams = {
      username: formData.username,
      password: formData.password,
      email: formData.email
    }
    if (formData.birth_date) {
      params.birth_date = new Date(formData.birth_date).toISOString().split('T')[0]
    }

    await appStore.register(params)
    message.success('欢迎到来，冒险者。你的传说即将开始。')
    router.push({ name: 'Home' })
  } catch (err: any) {
    if (err?.message) {
      message.error(err.message)
    }
  } finally {
    loading.value = false
    appStore.setGlobalLoading(false)
  }
}

function goToLogin() {
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="register-page">
    <div class="page-inner">
      <!-- 左侧品牌区域 -->
      <div class="brand-section">
        <div class="brand-icon">
          <svg viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h1 class="brand-title">织世镜</h1>
        <p class="brand-subtitle">WeaveMirror</p>
        <p class="brand-desc">
          在这里，你将成为你想成为的人。<br>
          故事由你编织，命运由你书写。
        </p>
      </div>

      <!-- 右侧注册卡片 -->
      <div class="register-card">
        <h2 class="card-title">创建身份</h2>
        <p class="card-desc">注册一个新账号，开启你的故事。</p>

        <NForm
          ref="formRef"
          :model="formData"
          :rules="rules"
          class="register-form"
          @keyup.enter="handleRegister"
        >
          <NGrid :cols="1" :x-gap="0" :y-gap="16">
            <NFormItemGi :span="1" label="用户名" path="username">
              <NInput
                v-model:value="formData.username"
                placeholder="用于登录的唯一名号"
                :disabled="loading"
                clearable
                size="large"
              />
            </NFormItemGi>

            <NFormItemGi :span="1" label="邮箱" path="email">
              <NInput
                v-model:value="formData.email"
                placeholder="用于找回密码和通知"
                :disabled="loading"
                clearable
                size="large"
              />
            </NFormItemGi>

            <NFormItemGi :span="1" label="出生日期" path="birth_date">
              <NDatePicker
                v-model:value="formData.birth_date"
                type="date"
                placeholder="可选"
                :disabled="loading"
                clearable
                size="large"
                style="width: 100%"
              />
            </NFormItemGi>

            <NFormItemGi :span="1" label="密码" path="password">
              <NInput
                v-model:value="formData.password"
                type="password"
                placeholder="至少 6 位，包含字母和数字"
                :disabled="loading"
                show-password-on="click"
                clearable
                size="large"
              />
            </NFormItemGi>

            <NFormItemGi :span="1" label="确认密码" path="confirmPassword">
              <NInput
                v-model:value="formData.confirmPassword"
                type="password"
                placeholder="再次输入密码"
                :disabled="loading"
                show-password-on="click"
                clearable
                size="large"
              />
            </NFormItemGi>
          </NGrid>

          <div class="form-actions">
            <NButton
              type="primary"
              :loading="loading"
              :disabled="loading"
              size="large"
              block
              class="btn-primary"
              @click="handleRegister"
            >
              降临织世镜
            </NButton>
          </div>
        </NForm>

        <div class="login-link">
          <span>已有账号？</span>
          <NButton text type="primary" class="btn-text" @click="goToLogin">
            登录
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: var(--color-bg-deep);
}

.page-inner {
  display: flex;
  align-items: center;
  gap: 64px;
  max-width: 880px;
  width: 100%;
}

.brand-section {
  flex: 1;
  min-width: 0;
}

.brand-icon {
  width: 44px;
  height: 44px;
  color: var(--color-primary);
  margin-bottom: 20px;
}

.brand-title {
  margin: 0 0 4px;
  font-family: var(--font-title);
  font-size: 32px;
  font-weight: 900;
  line-height: 1.25;
  letter-spacing: 6px;
  color: var(--color-text-body);
}

.brand-subtitle {
  margin: 0 0 16px;
  font-size: 13px;
  letter-spacing: 4px;
  color: var(--color-primary);
  text-transform: uppercase;
}

.brand-desc {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-text-desc);
}

.register-card {
  width: 380px;
  padding: 32px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.card-title {
  margin: 0 0 4px;
  font-family: var(--font-title);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-text-body);
}

.card-desc {
  margin: 0 0 24px;
  font-size: 14px;
  color: var(--color-text-desc);
}

.register-form {
  margin-bottom: 20px;
}

.register-form :deep(.n-form-item-label) {
  font-size: 13px;
  color: var(--color-text-desc);
}

.register-form :deep(.n-input) {
  --n-color: rgba(255, 255, 255, 0.04);
  --n-color-focus: rgba(255, 255, 255, 0.06);
  --n-border: 1px solid var(--color-border);
  --n-border-focus: 1px solid var(--color-primary);
  --n-box-shadow-focus: 0 0 0 3px rgba(180, 142, 255, 0.15);
  --n-text-color: var(--color-text-body);
  --n-placeholder-color: var(--color-text-muted);
  --n-caret-color: var(--color-primary);
  --n-border-hover: 1px solid var(--color-border-hover);
  border-radius: var(--radius-sm);
}

.register-form :deep(.n-input--error) {
  --n-border: 1px solid var(--color-error);
  --n-box-shadow-focus: 0 0 0 3px rgba(245, 113, 122, 0.15);
}

.register-form :deep(.n-date-picker) {
  --n-border-radius: var(--radius-sm);
}

.register-form :deep(.n-date-picker .n-input) {
  --n-color: rgba(255, 255, 255, 0.04);
  --n-color-focus: rgba(255, 255, 255, 0.06);
  --n-border: 1px solid var(--color-border);
  --n-border-focus: 1px solid var(--color-primary);
  --n-box-shadow-focus: 0 0 0 3px rgba(180, 142, 255, 0.15);
  --n-text-color: var(--color-text-body);
  --n-placeholder-color: var(--color-text-muted);
  --n-caret-color: var(--color-primary);
  --n-border-hover: 1px solid var(--color-border-hover);
}

.btn-primary {
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary);
  color: #07060b;
  border: none;
  transition: box-shadow var(--transition-fast), transform var(--transition-fast);
}

.btn-primary:hover {
  box-shadow: 0 0 20px rgba(180, 142, 255, 0.3);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-text {
  font-size: 14px;
  color: var(--color-primary);
}

.login-link {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
}

.login-link :deep(.n-button) {
  font-size: 13px;
  margin-left: 4px;
}

@media (max-width: 768px) {
  .page-inner {
    flex-direction: column;
    gap: 32px;
  }

  .brand-section {
    text-align: center;
    max-width: 380px;
  }

  .brand-icon {
    margin-left: auto;
    margin-right: auto;
  }

  .register-card {
    width: 100%;
    max-width: 380px;
  }
}
</style>
