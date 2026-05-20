import { apiFetch } from './client'
import type { Comment } from '@/types/ticket'

export function apiGetComments(ticketId: string) {
  return apiFetch<Comment[]>(`/tickets/${ticketId}/comments`)
}

export function apiCreateComment(ticketId: string, body: string) {
  return apiFetch<Comment>(`/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}
