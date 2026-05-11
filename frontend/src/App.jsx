import { useState, useCallback, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import TopBar from './components/TopBar'
import JobGrid from './components/JobGrid'
import AddJobModal from './components/AddJobModal'
import LoginPage from './components/LoginPage'
import StatCards from './components/StatCards'
import SettingsModal from './components/SettingsModal'
import { isAuthenticated, clearToken, getUserEmail } from './lib/auth'

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated)
  const [modalOpen, setModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  // The http interceptor dispatches `auth:logout` when the server rejects a
  // token (expired or invalid). We catch it here to swap to the login screen
  // without forcing a full page reload.
  useEffect(() => {
    const handler = () => setAuthed(false)
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  const handleLogout = useCallback(() => {
    clearToken()
    setAuthed(false)
  }, [])

  if (!authed) {
    return (
      <>
        <LoginPage onLogin={() => setAuthed(true)} />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#f4f4f5',
              border: '1px solid #3f3f46',
              fontSize: '13px',
            },
          }}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <TopBar
        onAddJob={() => setModalOpen(true)}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        username={getUserEmail()}
        onLogout={handleLogout}
        onSettings={() => setSettingsOpen(true)}
      />

      <main className="mx-auto max-w-screen-2xl px-6 py-6">
        <StatCards refreshKey={refreshKey} />
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">
            Job tracker
          </h1>
        </div>
        <JobGrid
          refreshKey={refreshKey}
          onAddJob={() => setModalOpen(true)}
          statusFilter={statusFilter}
        />
      </main>

      {modalOpen && (
        <AddJobModal
          onClose={() => setModalOpen(false)}
          onSaved={refresh}
        />
      )}

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#f4f4f5',
            border: '1px solid #3f3f46',
            fontSize: '13px',
          },
        }}
      />
    </div>
  )
}
