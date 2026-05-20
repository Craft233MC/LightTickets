<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const auth = useAuthStore()
const ui = useUiStore()

const mcCode = ref('')
const linking = ref(false)

async function linkMc() {
  if (!mcCode.value.trim()) return
  linking.value = true
  try {
    await auth.linkMinecraft(mcCode.value.trim())
    ui.toast('MC 账号绑定成功', 'success')
    mcCode.value = ''
  } catch (e: any) {
    ui.toast(e.message || '绑定失败', 'error')
  } finally {
    linking.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-8">
    <h1 class="text-xl font-bold text-slate-900 dark:text-white">个人资料</h1>

    <!-- Account info -->
    <section class="p-5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
      <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300">账号信息</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-slate-500 dark:text-slate-400">用户名</span>
          <p class="mt-1 font-medium text-slate-900 dark:text-white">{{ auth.user?.username }}</p>
        </div>
        <div>
          <span class="text-slate-500 dark:text-slate-400">邮箱</span>
          <p class="mt-1 font-medium text-slate-900 dark:text-white">{{ auth.user?.email }}</p>
        </div>
        <div>
          <span class="text-slate-500 dark:text-slate-400">角色</span>
          <p class="mt-1 font-medium text-slate-900 dark:text-white">{{ auth.user?.role }}</p>
        </div>
      </div>
    </section>

    <!-- MC binding -->
    <section class="p-5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
      <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Minecraft 绑定</h2>

      <div v-if="auth.user?.minecraftName" class="flex items-center gap-3">
        <Icon icon="lucide:gamepad-2" class="w-5 h-5 text-green-500" />
        <div>
          <p class="font-medium text-slate-900 dark:text-white">{{ auth.user.minecraftName }}</p>
          <p class="text-xs text-slate-500">UUID: {{ auth.user.minecraftUuid }}</p>
        </div>
      </div>

      <div v-else class="space-y-3">
        <p class="text-sm text-slate-500 dark:text-slate-400">
          在游戏中输入 <code class="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">/bindweb</code> 获取验证码
        </p>
        <form @submit.prevent="linkMc" class="flex gap-2">
          <BaseInput v-model="mcCode" placeholder="6位验证码" class="flex-1" />
          <BaseButton type="submit" :loading="linking" :disabled="!mcCode.trim()">绑定</BaseButton>
        </form>
      </div>
    </section>
  </div>
</template>
