<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  loading?: boolean
  disabled?: boolean
  as?: string | object
}>()
</script>

<template>
  <component
    :is="as || 'button'"
    :disabled="as ? undefined : (disabled || loading)"
    class="inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      {
        '!bg-black !text-gray-100 hover:!bg-gray-800 active:!bg-gray-700 dark:!bg-slate-800 dark:!text-slate-100 dark:hover:!bg-slate-700 dark:active:!bg-slate-600': variant === 'primary' || !variant,
        'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800': variant === 'secondary',
        'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white': variant === 'ghost',
        'bg-red-500 text-white hover:bg-red-600 active:bg-red-700': variant === 'danger',
      },
      {
        'px-2.5 py-1.5 text-xs': size === 'sm',
        'px-3.5 py-2 text-sm': size === 'md' || !size,
        'px-5 py-2.5 text-base': size === 'lg',
      },
    ]"
  >
    <Icon v-if="loading" icon="lucide:loader-2" class="w-4 h-4 animate-spin" />
    <Icon v-else-if="icon" :icon="icon" class="w-4 h-4" />
    <slot />
  </component>
</template>
