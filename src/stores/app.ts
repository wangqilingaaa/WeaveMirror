import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // --- Loading Stack Management ---
  const loadingStack = ref(0)
  
  const startLoading = () => {
    loadingStack.value++
  }
  
  const stopLoading = () => {
    if (loadingStack.value > 0) {
      loadingStack.value--
    }
  }
  
  const isGlobalLoading = computed(() => loadingStack.value > 0)

  // --- Theme Management ---
  // 'light' | 'dark' | 'auto'
  const themeMode = ref<'light' | 'dark' | 'auto'>(
    (localStorage.getItem('app-theme') as 'light' | 'dark' | 'auto') || 'auto'
  )

  const setThemeMode = (mode: 'light' | 'dark' | 'auto') => {
    themeMode.value = mode
    localStorage.setItem('app-theme', mode)
  }

  // --- Global Error State ---
  const globalError = ref<Error | null>(null)
  
  const setGlobalError = (error: Error | null) => {
    globalError.value = error
  }

  return {
    loadingStack,
    startLoading,
    stopLoading,
    isGlobalLoading,
    themeMode,
    setThemeMode,
    globalError,
    setGlobalError
  }
})
