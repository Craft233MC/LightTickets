<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = '两次密码不一致'
    return
  }
  if (password.value.length < 6) {
    error.value = '密码至少6位'
    return
  }
  loading.value = true
  try {
    await auth.register(email.value, password.value, username.value)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
    <div class="w-full max-w-sm space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">注册</h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">创建 LightTickets 账号</p>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <BaseInput v-model="username" label="用户名" placeholder="your_name" />
        <BaseInput v-model="email" label="邮箱" type="email" placeholder="you@example.com" />
        <BaseInput v-model="password" label="密码" type="password" placeholder="至少6位" />
        <BaseInput v-model="confirmPassword" label="确认密码" type="password" placeholder="再次输入密码" />

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <BaseButton type="submit" :loading="loading" class="w-full">注册</BaseButton>
      </form>

      <p class="text-center text-sm text-slate-500 dark:text-slate-400">
        已有账号？
        <RouterLink to="/login" class="text-slate-900 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300 font-medium">登录</RouterLink>
      </p>
    </div>
  </div>
</template>
