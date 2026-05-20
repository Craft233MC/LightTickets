<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useLabelsStore } from '@/stores/labels'
import { useUiStore } from '@/stores/ui'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'

const labels = useLabelsStore()
const ui = useUiStore()

const showModal = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ name: '', color: '#3b82f6', description: '' })

function openCreate() {
  editingId.value = null
  form.value = { name: '', color: '#3b82f6', description: '' }
  showModal.value = true
}

function openEdit(label: { id: string; name: string; color: string; description?: string }) {
  editingId.value = label.id
  form.value = { name: label.name, color: label.color, description: label.description || '' }
  showModal.value = true
}

async function save() {
  try {
    if (editingId.value) {
      await labels.update(editingId.value, form.value)
      ui.toast('标签已更新', 'success')
    } else {
      await labels.create(form.value)
      ui.toast('标签已创建', 'success')
    }
    showModal.value = false
  } catch (e: any) {
    ui.toast(e.message || '操作失败', 'error')
  }
}

async function remove(id: string) {
  if (!confirm('确定删除此标签？')) return
  try {
    await labels.remove(id)
    ui.toast('标签已删除', 'success')
  } catch (e: any) {
    ui.toast(e.message || '删除失败', 'error')
  }
}

onMounted(() => {
  if (!labels.loaded) labels.fetch()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white">标签管理</h2>
      <BaseButton size="sm" icon="lucide:plus" @click="openCreate">新建标签</BaseButton>
    </div>

    <div class="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
      <div v-for="label in labels.labels" :key="label.id" class="flex items-center justify-between px-4 py-3">
        <div class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: label.color }" />
          <span class="text-sm font-medium text-slate-900 dark:text-white">{{ label.name }}</span>
          <span v-if="label.description" class="text-xs text-slate-500">{{ label.description }}</span>
        </div>
        <div class="flex items-center gap-1">
          <button @click="openEdit(label)" class="p-1.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <Icon icon="lucide:pencil" class="w-4 h-4" />
          </button>
          <button @click="remove(label.id)" class="p-1.5 rounded text-slate-400 hover:text-red-500">
            <Icon icon="lucide:trash-2" class="w-4 h-4" />
          </button>
        </div>
      </div>
      <div v-if="!labels.labels.length" class="px-4 py-8 text-center text-sm text-slate-400">暂无标签</div>
    </div>

    <BaseModal v-model="showModal" :title="editingId ? '编辑标签' : '新建标签'">
      <form @submit.prevent="save" class="space-y-4">
        <BaseInput v-model="form.name" label="名称" placeholder="bug, feature..." />
        <div class="space-y-1.5">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">颜色</label>
          <div class="flex items-center gap-2">
            <input v-model="form.color" type="color" class="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer" />
            <input v-model="form.color" type="text" class="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
          </div>
        </div>
        <BaseInput v-model="form.description" label="描述（可选）" placeholder="标签用途说明" />
        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" type="button" @click="showModal = false">取消</BaseButton>
          <BaseButton type="submit" :disabled="!form.name.trim()">保存</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
