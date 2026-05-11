import { useState, useRef, useEffect } from 'react'
import { login, register } from '../lib/api'
import { setToken } from '../lib/auth'

const CRITERIA = [
  { label: 'At least 8 characters',      test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',        test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',        test: (p) => /[a-z]/.test(p) },
  { label: 'One number',                  test: (p) => /\d/.test(p) },
  { label: 'One special character',       test: (p) => /[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/.test(p) },
]

function CriteriaList({ password }) {
  if (!password) return null
  return (
    <ul className="mt-2 space-y-1">
      {CRITERIA.map(({ label, test }) => {
        const met = test(password)
        return (
          <li key={label} className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-emerald-400' : 'text-zinc-500'}`}>
            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              {met
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
            </svg>
            {label}
          </li>
        )
      })}
    </ul>
  )
}

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRef = useRef(null)

  useEffect(() => { emailRef.current?.focus() }, [mode])

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setPassword('')
    setConfirm('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (mode === 'register') {
      const allMet = CRITERIA.every(({ test }) => test(password))
      if (!allMet) {
        setError('Please meet all password requirements.')
        return
      }
      if (password !== confirm) {
        setError('Passwords do not match.')
        return
      }
    }

    setLoading(true)
    try {
      const fn = mode === 'login' ? login : register
      const { access_token, email: returnedEmail } = await fn(email.trim(), password)
      setToken(access_token, returnedEmail)
      onLogin()
    } catch (err) {
      const data = err.response?.data
      if (data?.criteria?.length) {
        setError(data.criteria.join(' · '))
      } else {
        setError(data?.error || err.message || 'Something went wrong')
      }
      setPassword('')
      setConfirm('')
    } finally {
      setLoading(false)
    }
  }

  const isLogin = mode === 'login'
  const canSubmit = email.trim() && password && (isLogin || confirm)

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 0 0-.788 0l-7 3a1 1 0 0 0 0 1.84L5.25 8.051a.999.999 0 0 1 .356-.257l4-1.714a1 1 0 1 1 .788 1.838L7.667 9.088l1.94.831a1 1 0 0 0 .787 0l7-3a1 1 0 0 0 0-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 0 0-1.05-.174 1 1 0 0 1-.89-.89 11.115 11.115 0 0 1 .25-3.762zM9.3 16.573A9.026 9.026 0 0 0 10 17a9.02 9.02 0 0 0 .7-.427V13.33l-1 .428-1-.428v3.243zM14 10.12l1.69-.724a11.116 11.116 0 0 1 .25 3.762 1 1 0 0 1-.89.89 8.969 8.969 0 0 0-1.05.175V10.12z" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-100">JobPulse</span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
          {/* Tab switcher */}
          <div className="flex border-b border-zinc-800">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${
                  mode === m
                    ? 'text-zinc-100 border-b-2 border-indigo-500 -mb-px'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Email
              </label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              />
              {!isLogin && <CriteriaList password={password} />}
            </div>

            {/* Confirm password (register only) */}
            {!isLogin && (
              <div>
                <label htmlFor="confirm" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={loading}
                  className={`w-full rounded-lg border bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50 ${
                    confirm && password !== confirm
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-zinc-700 focus:border-indigo-500'
                  }`}
                />
                {confirm && password !== confirm && (
                  <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              {loading
                ? (isLogin ? 'Signing in…' : 'Creating account…')
                : (isLogin ? 'Sign in' : 'Create account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
