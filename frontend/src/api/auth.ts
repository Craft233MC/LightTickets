import { apiFetch } from './client'
import type { AuthResponse, RefreshResponse } from '@/types/user'

export function apiRegister(email: string, password: string, username: string) {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, username }),
  })
}

export function apiLogin(email: string, password: string) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function apiRefresh(refreshToken: string) {
  return apiFetch<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

export function apiLinkMinecraft(code: string) {
  return apiFetch<{ uuid: string; name: string }>('/auth/link-minecraft', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}
