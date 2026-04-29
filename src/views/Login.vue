<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NButton, NInput, NForm, NFormItemGi, NGrid, useMessage } from 'naive-ui'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const message = useMessage()

const loading = ref(false)

const formData = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 2, max: 32, message: '用户名长度在 2 到 32 个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度在 6 到 32 个字符之间', trigger: 'blur' }
  ]
}

const formRef = ref<InstanceType<typeof NForm> | null>(null)

async function handleLogin() {
  try {
    await formRef.value?.validate()
    loading.value = true
    appStore.setGlobalLoading(true)
    await appStore.login({ username: formData.username, password: formData.password })
    message.success('欢迎回来，冒险者。')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (err: any) {
    if (err?.message) {
      message.error(err.message)
    }
  } finally {
    loading.value = false
    appStore.setGlobalLoading(false)
  }
}

function goToRegister() {
  router.push({ name: 'Register' })
}
</script>

<template>
  <div class="login-page">
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
          无尽维度的交汇之处。<br>
          每一次选择，都编织出独一无二的命运轨迹。
        </p>
      </div>

      <!-- 右侧登录卡片 -->
      <div class="login-card">
        <h2 class="card-title">登录</h2>
        <p class="card-desc">输入你的凭证，继续你的旅程。</p>

        <NForm
          ref="formRef"
          :model="formData"
          :rules="rules"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <NGrid :cols="1" :x-gap="0" :y-gap="20">
            <NFormItemGi :span="1" label="用户名" path="username">
              <NInput
                v-model:value="formData.username"
                placeholder="用户名或邮箱"
                :disabled="loading"
                clearable
                size="large"
              />
            </NFormItemGi>

            <NFormItemGi :span="1" label="密码" path="password">
              <NInput
                v-model:value="formData.password"
                type="password"
                placeholder="密码"
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
              @click="handleLogin"
            >
              进入织世镜
            </NButton>
          </div>
        </NForm>

        <div class="register-link">
          <span>尚未踏入这片世界？</span>
          <NButton text type="primary" class="btn-text" @click="goToRegister">
            创建身份
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
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

// ==================== 品牌区域（左侧） ====================
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

// ==================== 登录卡片（右侧） ====================
.login-card {
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
  margin: 0 0 28px;
  font-size: 14px;
  color: var(--color-text-desc);
}

// ==================== 表单覆盖（演示 SCSS 嵌套 + &:deep） ====================
.login-form {
  margin-bottom: 24px;

  :deep(.n-form-item-label) {
    font-size: 13px;
    color: var(--color-text-desc);
  }

  :deep(.n-input) {
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

  :deep(.n-input--error) {
    --n-border: 1px solid var(--color-error);
    --n-box-shadow-focus: 0 0 0 3px rgba(245, 113, 122, 0.15);
  }
}

// ==================== 按钮（演示 SCSS 嵌套伪类） ====================
.btn-primary {
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background-color: var(--color-primary);
  color: #07060b;
  border: none;
  transition: box-shadow var(--transition-fast), transform var(--transition-fast);

  &:hover {
    box-shadow: 0 0 20px rgba(180, 142, 255, 0.3);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.btn-text {
  font-size: 14px;
  color: var(--color-primary);
}

.register-link {
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);

  :deep(.n-button) {
    font-size: 13px;
    margin-left: 4px;
  }
}

// ==================== 响应式 ====================
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

  .login-card {
    width: 100%;
    max-width: 380px;
  }
}
</style>
