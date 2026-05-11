import { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, Check, X as XIcon } from 'lucide-react'
import { login, register } from '../lib/api'
import { setToken } from '../lib/auth'

const CRITERIA = [
  { label: 'At least 8 characters',  test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',   test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',   test: (p) => /[a-z]/.test(p) },
  { label: 'One number',             test: (p) => /\d/.test(p) },
  { label: 'One special character',  test: (p) => /[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/.test(p) },
]

function CriteriaList({ password }) {
  if (!password) return null
  return (
    <ul className="mt-2.5 space-y-1.5">
      {CRITERIA.map(({ label, test }) => {
        const met = test(password)
        return (
          <li key={label} className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {met
              ? <Check className="h-3 w-3 shrink-0" />
              : <XIcon className="h-3 w-3 shrink-0" />}
            {label}
          </li>
        )
      })}
    </ul>
  )
}

function PasswordInput({ id, value, onChange, disabled, autoComplete, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950 px-3 py-2.5 pr-9 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')
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
      if (!CRITERIA.every(({ test }) => test(password))) {
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
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-900/50">
            <svg className="h-5.5 w-5.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 0 0-.788 0l-7 3a1 1 0 0 0 0 1.84L5.25 8.051a.999.999 0 0 1 .356-.257l4-1.714a1 1 0 1 1 .788 1.838L7.667 9.088l1.94.831a1 1 0 0 0 .787 0l7-3a1 1 0 0 0 0-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 0 0-1.05-.174 1 1 0 0 1-.89-.89 11.115 11.115 0 0 1 .25-3.762zM9.3 16.573A9.026 9.026 0 0 0 10 17a9.02 9.02 0 0 0 .7-.427V13.33l-1 .428-1-.428v3.243zM14 10.12l1.69-.724a11.116 11.116 0 0 1 .25 3.762 1 1 0 0 1-.89.89 8.969 8.969 0 0 0-1.05.175V10.12z" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">JobPulse</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40">
          {/* Tab switcher */}
          <div className="flex border-b border-zinc-800">
            {[
              { id: 'login', label: 'Sign in' },
              { id: 'register', label: 'Create account' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => switchMode(m.id)}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${
                  mode === m.id
                    ? 'text-zinc-100 border-b-2 border-indigo-500 -mb-px'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
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
                className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              {!isLogin && <CriteriaList password={password} />}
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirm" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Confirm password
                </label>
                <PasswordInput
                  id="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
                {confirm && password !== confirm && (
                  <p className="mt-1.5 text-xs text-red-400">Passwords do not match</p>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
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
