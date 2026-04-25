import axios, { AxiosError } from 'axios'
import router from '../router'
import { useAppStore } from '../stores/app'
import type { MessageApi } from 'naive-ui'

declare global {
  interface Window {
    $message?: MessageApi
  }
}

// 由于拦截器在应用启动时立即注册，推迟 store 引入以防 pinia 未初始化报错
const getAppStore = () => {
  return useAppStore()
}

const api = axios.create({
  baseURL: '/api', // 假数据的 baseURL
  timeout: 30000 // 加载超时处理机制（默认30秒）
})

// 请求拦截器：自动添加 Authorization header 和 开启全局加载
api.interceptors.request.use(config => {
  // 不让某些静默请求触发全屏 loading，可在此过滤
  if (!config.headers?.['X-Silent-Request']) {
    getAppStore().startLoading()
  }

  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  getAppStore().stopLoading()
  return Promise.reject(error)
})

// 响应拦截器：处理401、加载状态停止、重试机制
api.interceptors.response.use(
  response => {
    if (!response.config.headers?.['X-Silent-Request']) {
      getAppStore().stopLoading()
    }
    return response
  },
  async (error: AxiosError) => {
    const config = error.config as any
    if (config && !config.headers?.['X-Silent-Request']) {
      getAppStore().stopLoading()
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
    }

    // 错误恢复机制：自动重试 3 次，指数退避策略
    if (config) {
      config.__retryCount = config.__retryCount || 0
      const maxRetries = 3

      // 若发生错误且未达重试上限（排除 401 认证错误，没必要重试）
      if (config.__retryCount < maxRetries && error.response?.status !== 401) {
        config.__retryCount += 1
        const backoffDelay = Math.pow(2, config.__retryCount) * 1000 // 2s, 4s, 8s

        // 触发全局轻提示：尝试重连中
        if (window.$message) {
          window.$message.warning(`请求失败，正在进行第 ${config.__retryCount} 次重连...`)
        }

        return new Promise((resolve) => {
          setTimeout(() => resolve(api(config)), backoffDelay)
        })
      }
    }

    // 超时友好的错误提示
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      if (window.$message) {
        window.$message.error('网络请求超时（>30秒），请检查网络连接')
      }
    } else if (window.$message && error.response?.status !== 401) {
      const data = error.response?.data as any
      window.$message.error(data?.message || error.message || '网络请求发生未知错误')
    }

    return Promise.reject(error)
  }
)

export default api
