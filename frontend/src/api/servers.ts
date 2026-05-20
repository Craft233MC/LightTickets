import { apiFetch } from './client'
import type { Server } from '@/types/user'

export function apiGetServers() {
  return apiFetch<Server[]>('/servers')
}

export function apiCreateServer(data: { name: string; address?: string; description?: string }) {
  return apiFetch<Server>('/servers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function apiRegenerateKey(id: string) {
  return apiFetch<{ apiKey: string }>(`/servers/${id}/regenerate-key`, { method: 'POST' })
}

export function apiDeleteServer(id: string) {
  return apiFetch<void>(`/servers/${id}`, { method: 'DELETE' })
}
