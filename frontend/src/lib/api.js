import { http } from './http'

export const listJobs = (status) =>
  http.get(`/api/jobs${status ? `?status=${encodeURIComponent(status)}` : ''}`)
    .then((r) => r.data)

export const scrapeJob = (url) =>
  http.post('/api/jobs/scrape', { url }).then((r) => r.data)

export const updateJob = (id, patch) =>
  http.patch(`/api/jobs/${id}`, patch).then((r) => r.data)

export const deleteJob = (id) =>
  http.delete(`/api/jobs/${id}`).then((r) => r.data)

export const login = (email, password) =>
  http.post('/api/auth/login', { email, password }).then((r) => r.data)

export const register = (email, password) =>
  http.post('/api/auth/register', { email, password }).then((r) => r.data)

export const fetchMe = () => http.get('/api/auth/me').then((r) => r.data)

export const listPrep = (jobId) =>
  http.get(`/api/jobs/${jobId}/prep`).then((r) => r.data)

export const seedPrep = (jobId) =>
  http.post(`/api/jobs/${jobId}/prep/seed`).then((r) => r.data)

export const addPrepTask = (jobId, payload) =>
  http.post(`/api/jobs/${jobId}/prep`, payload).then((r) => r.data)

export const updatePrepTask = (taskId, patch) =>
  http.patch(`/api/prep/${taskId}`, patch).then((r) => r.data)

export const deletePrepTask = (taskId) =>
  http.delete(`/api/prep/${taskId}`)

export async function downloadExport() {
  const resp = await http.get('/api/jobs/export', { responseType: 'blob' })
  const disposition = resp.headers['content-disposition'] || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match ? match[1] : 'jobpulse-export.csv'

  const url = window.URL.createObjectURL(resp.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
