<script setup lang="ts">
import { ref } from 'vue'
import { useUiStore } from '@/stores/ui'
import BaseButton from '@/components/base/BaseButton.vue'
import { isValidHex } from '@/utils/color'

const ui = useUiStore()
const accentColor = ref('#3b82f6')

function applyColor() {
  if (!isValidHex(accentColor.value)) {
    ui.toast('无效的颜色值', 'error')
    return
  }
  document.documentElement.style.setProperty('--color-accent-500', accentColor.value)
  ui.toast('强调色已更新', 'success')
}
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-slate-900 dark:text-white">平台设置</h2>

    <section class="p-5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
      <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">强调色</h3>
      <div class="flex items-center gap-3">
        <input v-model="accentColor" type="color" class="w-10 h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer" />
        <input v-model="accentColor" type="text" class="w-32 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
        <BaseButton size="sm" @click="applyColor">应用</BaseButton>
      </div>
      <div class="flex gap-2">
        <div class="w-8 h-8 rounded" :style="{ backgroundColor: accentColor }" />
        <div class="w-8 h-8 rounded" :style="{ backgroundColor: accentColor + '80' }" />
        <div class="w-8 h-8 rounded" :style="{ backgroundColor: accentColor + '40' }" />
      </div>
    </section>
  </div>
</template>
