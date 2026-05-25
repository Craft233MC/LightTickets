<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiFetch } from '@/api/client'
import { useUiStore } from '@/stores/ui'
import type { User } from '@/types/user'
import type { Role } from '@/types/ticket'

const ui = useUiStore()
const users = ref<User[]>([])

async function fetchUsers() {
  users.value = await apiFetch<User[]>('/users')
}

async function changeRole(userId: string, role: Role) {
  try {
    await apiFetch(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
    const idx = users.value.findIndex(u => u.id === userId)
    if (idx !== -1) users.value[idx].role = role
    ui.toast('角色已更新', 'success')
  } catch (e: any) {
    ui.toast(e.message || '操作失败', 'error')
  }
}

onMounted(fetchUsers)
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">用户管理</h2>

    <div class="overflow-x-auto border border-slate-200/80 dark:border-slate-800/80 rounded-xl">
      <table class="w-full text-sm">
        <thead class="bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">用户名</th>
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">邮箱</th>
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">MC</th>
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">角色</th>
            <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
          <tr v-for="user in users" :key="user.id">
            <td class="px-6 py-4 text-slate-900 dark:text-white font-medium">{{ user.username }}</td>
            <td class="px-6 py-4 text-slate-600 dark:text-slate-400">{{ user.email }}</td>
            <td class="px-6 py-4 text-slate-600 dark:text-slate-400">{{ user.minecraftName || '-' }}</td>
            <td class="px-6 py-4">
              <select
                :value="user.role"
                @change="changeRole(user.id, ($event.target as HTMLSelectElement).value as Role)"
                class="px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 backdrop-blur-sm"
              >
                <option value="player">player</option>
                <option value="staff">staff</option>
                <option value="admin">admin</option>
              </select>
            </td>
            <td class="px-6 py-4 text-right">
              <span class="text-xs text-slate-400">{{ user.createdAt?.slice(0, 10) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!users.length" class="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">暂无用户</div>
    </div>
  </div>
</template>
