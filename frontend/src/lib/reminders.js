import { http } from './http'

export const getReminderConfig = () =>
  http.get('/api/reminders/config').then((r) => r.data)

export const sendNow = (force = false) =>
  http.post(`/api/reminders/send-now${force ? '?force=true' : ''}`).then((r) => r.data)

export const getReminderHistory = () =>
  http.get('/api/reminders/history').then((r) => r.data)

export const getPreviewUrl = () => {
  const token = localStorage.getItem('jobpulse_token')
  // Preview is a plain HTML endpoint — open in new tab with token as query param.
  // The backend reads it from Authorization header, so we proxy it via fetch.
  return '/api/reminders/preview'
}

export async function openPreview() {
  const resp = await http.get('/api/reminders/preview', { responseType: 'text' })
  const blob = new Blob([resp.data], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
