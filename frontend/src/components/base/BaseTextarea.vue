<script setup lang="ts">
const model = defineModel<string>()

defineProps<{
  label?: string
  placeholder?: string
  rows?: number
  error?: string
}>()
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ label }}</label>
    <textarea
      v-model="model"
      :placeholder="placeholder"
      :rows="rows || 4"
      class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500 resize-y transition-colors"
      :class="{ 'border-red-400 dark:border-red-500': error }"
    />
    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
  </div>
</template>
