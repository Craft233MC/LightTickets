import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AdminTemplate } from '@/api/templates'
import {
  apiGetAdminTemplates,
  apiCreateAdminTemplate,
  apiUpdateAdminTemplate,
  apiDeleteAdminTemplate,
} from '@/api/templates'

export const useTemplatesStore = defineStore('templates', () => {
  const templates = ref<AdminTemplate[]>([])
  const loaded = ref(false)

  async function fetch() {
    templates.value = await apiGetAdminTemplates()
    loaded.value = true
  }

  async function create(data: Parameters<typeof apiCreateAdminTemplate>[0]) {
    const tmpl = await apiCreateAdminTemplate(data)
    templates.value.push(tmpl)
    return tmpl
  }

  async function update(id: number, data: Parameters<typeof apiUpdateAdminTemplate>[1]) {
    const tmpl = await apiUpdateAdminTemplate(id, data)
    const idx = templates.value.findIndex(t => t.id === id)
    if (idx !== -1) templates.value[idx] = tmpl
    return tmpl
  }

  async function remove(id: number) {
    await apiDeleteAdminTemplate(id)
    templates.value = templates.value.filter(t => t.id !== id)
  }

  return { templates, loaded, fetch, create, update, remove }
})
