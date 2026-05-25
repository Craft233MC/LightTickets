<script setup lang="ts">
const model = defineModel<string>()

defineProps<{
  label?: string
  type?: string
  placeholder?: string
  error?: string
  disabled?: boolean
}>()
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-slate-700 dark:text-slate-300">{{ label }}</label>
    <input
      v-model="model"
      :type="type || 'text'"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 dark:focus:ring-slate-100/20 dark:focus:border-slate-600 disabled:opacity-50 transition"
      :class="{ 'border-red-400 dark:border-red-500 focus:ring-red-500/40 focus:border-red-500': error }"
    />
    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
  </div>
</template>
