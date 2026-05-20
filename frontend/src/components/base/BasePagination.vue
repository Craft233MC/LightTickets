<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  page: number
  totalPages: number
}>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
    <button
      :disabled="page <= 1"
      @click="emit('update:page', page - 1)"
      class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      <Icon icon="lucide:chevron-left" class="w-4 h-4" />
    </button>
    <span class="text-sm text-slate-600 dark:text-slate-400">
      {{ page }} / {{ totalPages }}
    </span>
    <button
      :disabled="page >= totalPages"
      @click="emit('update:page', page + 1)"
      class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      <Icon icon="lucide:chevron-right" class="w-4 h-4" />
    </button>
  </div>
</template>
