<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (e: any) {
    error.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
    <div class="w-full max-w-sm space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">登录</h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">登录到 LightTicket</p>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <BaseInput v-model="email" label="邮箱" type="email" placeholder="you@example.com" />
        <BaseInput v-model="password" label="密码" type="password" placeholder="••••••••" />

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <BaseButton type="submit" :loading="loading" class="w-full">登录</BaseButton>
      </form>

      <p class="text-center text-sm text-slate-500 dark:text-slate-400">
        没有账号？
        <RouterLink to="/register" class="text-slate-900 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300 font-medium">注册</RouterLink>
      </p>
    </div>
  </div>
</template>
