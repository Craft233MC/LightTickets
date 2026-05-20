<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { to: '/admin/labels', label: '标签', icon: 'lucide:tag' },
  { to: '/admin/servers', label: '服务器', icon: 'lucide:server' },
  { to: '/admin/users', label: '用户', icon: 'lucide:users' },
  { to: '/admin/settings', label: '设置', icon: 'lucide:settings' },
]
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
    <nav class="flex md:flex-col gap-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
        :class="route.path === item.to
          ? 'bg-accent-50 dark:bg-accent-950/50 text-accent-600 dark:text-accent-400 font-medium'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'"
      >
        <Icon :icon="item.icon" class="w-4 h-4" />
        {{ item.label }}
      </RouterLink>
    </nav>
    <div>
      <RouterView />
    </div>
  </div>
</template>
