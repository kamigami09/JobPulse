const TOKEN_KEY = 'jobpulse_token'
const EMAIL_KEY = 'jobpulse_email'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token, email) {
  localStorage.setItem(TOKEN_KEY, token)
  if (email) localStorage.setItem(EMAIL_KEY, email)
}

export function getUserEmail() {
  return localStorage.getItem(EMAIL_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EMAIL_KEY)
}

export function isAuthenticated() {
  return !!getToken()
}

export function emitLogout() {
  clearToken()
  window.dispatchEvent(new Event('auth:logout'))
}
