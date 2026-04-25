import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<any>(null)

  const login = async (username: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 模拟接口请求
      setTimeout(() => {
        if (username && password) {
          const fakeToken = 'fake-jwt-token-12345'
          token.value = fakeToken
          localStorage.setItem('token', fakeToken)
          user.value = { id: 1, username }
          resolve()
        } else {
          reject(new Error('请输入用户名和密码'))
        }
      }, 500)
    })
  }

  const register = async (username: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 模拟注册请求
      setTimeout(() => {
        if (username && password) {
          resolve()
        } else {
          reject(new Error('注册信息不完整'))
        }
      }, 500)
    })
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return { token, user, login, register, logout }
})
