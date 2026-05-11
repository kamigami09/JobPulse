const TOKEN_KEY = 'jobpulse_token'
const USERNAME_KEY = 'jobpulse_username'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token, username) {
  localStorage.setItem(TOKEN_KEY, token)
  if (username) localStorage.setItem(USERNAME_KEY, username)
}

export function getUsername() {
  return localStorage.getItem(USERNAME_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USERNAME_KEY)
}

export function isAuthenticated() {
  return !!getToken()
}

// Dispatched by the http interceptor when the server rejects a token.
// App.jsx listens for this to swap to the login screen without a hard reload.
export function emitLogout() {
  clearToken()
  window.dispatchEvent(new Event('auth:logout'))
}
