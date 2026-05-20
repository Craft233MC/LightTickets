import { apiFetch } from './client'

export interface Attachment {
  id: string
  ticketId: string
  filename: string
  url: string
  mimeType: string
  size: number
  createdAt: string
}

export function apiGetAttachments(ticketId: string) {
  return apiFetch<Attachment[]>(`/tickets/${ticketId}/attachments`)
}

export function apiUploadAttachment(ticketId: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  return apiFetch<Attachment>(`/tickets/${ticketId}/attachments`, {
    method: 'POST',
    body: form,
  })
}

export function apiDeleteAttachment(ticketId: string, attachmentId: string) {
  return apiFetch<void>(`/tickets/${ticketId}/attachments/${attachmentId}`, { method: 'DELETE' })
}
