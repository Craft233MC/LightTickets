<script setup lang="ts">

interface TableColumn {
  key: string
  label: string
  class?: string
}

interface TableAction {
  icon: string
  label: string
  variant?: 'primary' | 'danger' | 'ghost'
  onClick: (row: any) => void
}

const props = defineProps<{
  columns: TableColumn[]
  data: any[]
  actions?: TableAction[]
  rowKey: string
  loading?: boolean
  emptyText?: string
}>()

const emit = defineEmits<{
  (e: 'row-click', row: any): void
}>()
</script>

<template>
  <div class="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
    <table class="w-full text-sm">
      <thead class="bg-slate-50 dark:bg-slate-800/50">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400"
            :class="col.class"
          >
            {{ col.label }}
          </th>
          <th v-if="actions?.length" class="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
            操作
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
        <tr
          v-for="row in data"
          :key="row[rowKey]"
          class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
          @click="emit('row-click', row)"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3"
            :class="col.class"
          >
            <slot :name="col.key" :row="row">
              <span class="text-slate-700 dark:text-slate-300">{{ row[col.key] }}</span>
            </slot>
          </td>
          <td v-if="actions?.length" class="px-4 py-3 text-right">
            <div class="flex items-center justify-end gap-1">
              <button
                v-for="(action, idx) in actions"
                :key="idx"
                @click.stop="action.onClick(row)"
                class="p-1.5 rounded text-slate-400 transition-colors"
                :class="action.variant === 'danger' ? 'hover:text-red-500' : 'hover:text-slate-700 dark:hover:text-slate-200'"
                :title="action.label"
              >
                <slot :name="`action-${idx}`" :row="row">
                  <Icon :icon="action.icon" class="w-4 h-4" />
                </slot>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="!loading && data.length === 0" class="px-4 py-8 text-center text-sm text-slate-400">
      {{ emptyText || '暂无数据' }}
    </div>
    <div v-if="loading" class="px-4 py-8 text-center text-sm text-slate-400 animate-pulse">
      加载中...
    </div>
  </div>
</template>

<script lang="ts">
import { Icon } from '@iconify/vue'
export { Icon }
</script>