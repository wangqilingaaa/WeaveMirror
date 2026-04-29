import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types'

/** API 基础配置 */
const BASE_URL = ''

/** 创建 Axios 实例 */
const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/** 请求拦截器：自动携带 JWT Token */
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('weavemirror_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/** 响应拦截器：统一处理业务错误码和 HTTP 状态码 */
client.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const body = response.data
    // 业务错误码非 0 视为错误
    if (body.code !== 0) {
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    return response
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      const msg = error.response.data?.message
      switch (status) {
        case 401:
          // Token 过期，清除本地认证信息并跳转登录页
          localStorage.removeItem('weavemirror_token')
          localStorage.removeItem('weavemirror_user')
          // window.location.href = '/login'
          return Promise.reject(new Error('登录已过期，请重新登录'))
        case 403:
          return Promise.reject(new Error('没有权限执行此操作'))
        case 404:
          return Promise.reject(new Error('请求的资源不存在'))
        case 409:
          return Promise.reject(new Error(msg || '资源冲突'))
        case 422:
          return Promise.reject(new Error(msg || '请求参数校验失败'))
        case 429:
          return Promise.reject(new Error('请求过于频繁，请稍候再试'))
        default:
          return Promise.reject(new Error(msg || `服务器错误 (${status})`))
      }
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('请求超时，请检查网络连接'))
    }
    return Promise.reject(new Error('网络连接失败，请检查网络'))
  }
)

/**
 * 从统一响应中提取业务数据
 * 所有 API 接口均返回 { code, message, data } 结构，该函数自动解包 data 字段
 */
export function extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  return response.data.data
}

export default client
