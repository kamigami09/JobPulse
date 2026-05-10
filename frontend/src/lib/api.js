const API_BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${resp.status}`)
  }
  if (resp.status === 204) return null
  return resp.json()
}

export const listJobs = (status) =>
  request(`/api/jobs${status ? `?status=${encodeURIComponent(status)}` : ''}`)

export const scrapeJob = (url) =>
  request('/api/jobs/scrape', { method: 'POST', body: JSON.stringify({ url }) })

export const updateJob = (id, patch) =>
  request(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })

export const deleteJob = (id) =>
  request(`/api/jobs/${id}`, { method: 'DELETE' })
