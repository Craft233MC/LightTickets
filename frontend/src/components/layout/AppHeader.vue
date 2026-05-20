<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <RouterLink to="/" class="text-lg font-semibold text-slate-900 dark:text-white">
          LightTicket
        </RouterLink>
        <nav v-if="auth.isAuthenticated" class="hidden sm:flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <RouterLink to="/" class="hover:text-slate-900 dark:hover:text-white transition-colors">工单</RouterLink>
          <RouterLink v-if="auth.isAdmin" to="/admin" class="hover:text-slate-900 dark:hover:text-white transition-colors">管理</RouterLink>
        </nav>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="ui.toggleTheme()"
          class="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          :aria-label="ui.theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'"
        >
          <Icon :icon="ui.theme === 'dark' ? 'lucide:sun' : 'lucide:moon'" class="w-5 h-5" />
        </button>

        <template v-if="auth.isAuthenticated">
          <RouterLink
            to="/tickets/new"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors"
          >
            <Icon icon="lucide:plus" class="w-4 h-4" />
            新建工单
          </RouterLink>

          <div class="relative group">
            <button class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div class="w-7 h-7 rounded-full bg-accent-100 dark:bg-accent-900 flex items-center justify-center text-xs font-medium text-accent-700 dark:text-accent-300">
                {{ auth.user?.username?.charAt(0).toUpperCase() }}
              </div>
            </button>
            <div class="absolute right-0 top-full mt-1 w-48 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <RouterLink to="/profile" class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">个人资料</RouterLink>
              <button @click="auth.logout()" class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700">退出登录</button>
            </div>
          </div>
        </template>

        <template v-else>
          <RouterLink to="/login" class="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">登录</RouterLink>
        </template>

        <button
          @click="ui.mobileMenuOpen = !ui.mobileMenuOpen"
          class="sm:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="菜单"
        >
          <Icon :icon="ui.mobileMenuOpen ? 'lucide:x' : 'lucide:menu'" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <Transition name="slide">
      <div v-if="ui.mobileMenuOpen && auth.isAuthenticated" class="sm:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2">
        <RouterLink to="/" class="block py-2 text-sm text-slate-700 dark:text-slate-300" @click="ui.mobileMenuOpen = false">工单</RouterLink>
        <RouterLink to="/tickets/new" class="block py-2 text-sm text-slate-700 dark:text-slate-300" @click="ui.mobileMenuOpen = false">新建工单</RouterLink>
        <RouterLink v-if="auth.isAdmin" to="/admin" class="block py-2 text-sm text-slate-700 dark:text-slate-300" @click="ui.mobileMenuOpen = false">管理</RouterLink>
        <RouterLink to="/profile" class="block py-2 text-sm text-slate-700 dark:text-slate-300" @click="ui.mobileMenuOpen = false">个人资料</RouterLink>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: max-height 0.28s ease, opacity 0.28s ease;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}
.slide-enter-to,
.slide-leave-from {
  max-height: 200px;
  opacity: 1;
}
</style>
