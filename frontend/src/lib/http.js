import axios from 'axios'
import { getToken, emitLogout } from './auth'

const baseURL = import.meta.env.VITE_API_URL || ''

export const http = axios.create({ baseURL })

// Attach Bearer token to every request
http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normalize errors and bounce to login on 401 (except on the login call itself,
// where 401 is a legitimate "wrong password" response handled by the form).
http.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const isLoginCall = url.includes('/api/auth/login')

    if (status === 401 && !isLoginCall) {
      emitLogout()
    }

    const serverMsg = error.response?.data?.error
    const message = serverMsg || error.message || `HTTP ${status || 'error'}`
    return Promise.reject(new Error(message))
  }
)
