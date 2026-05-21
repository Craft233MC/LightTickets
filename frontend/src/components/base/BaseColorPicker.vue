<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{
  modelValue: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <input
      type="color"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      class="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
    />
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      type="text"
      class="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
      placeholder="#3b82f6"
    />
  </div>
</template>
