import { useState, useCallback, useEffect } from 'react'
import { Toaster } from 'sonner'
import TopBar from './components/TopBar'
import JobGrid from './components/JobGrid'
import AddJobModal from './components/AddJobModal'
import LoginPage from './components/LoginPage'
import StatCards from './components/StatCards'
import SettingsModal from './components/SettingsModal'
import ResumeManagerModal from './components/ResumeManagerModal'
import { isAuthenticated, clearToken, getUserEmail } from './lib/auth'

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated)
  const [modalOpen, setModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [resumesOpen, setResumesOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

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
        <Toaster theme="dark" position="bottom-right" richColors />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <TopBar
        onAddJob={() => setModalOpen(true)}
        onResumes={() => setResumesOpen(true)}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        username={getUserEmail()}
        onLogout={handleLogout}
        onSettings={() => setSettingsOpen(true)}
      />

      <main className="mx-auto max-w-screen-2xl px-6 py-6">
        <StatCards refreshKey={refreshKey} />
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-sm font-medium text-zinc-500 tracking-tight">
            All jobs
          </h1>
        </div>
        <JobGrid
          refreshKey={refreshKey}
          onAddJob={() => setModalOpen(true)}
          statusFilter={statusFilter}
        />
      </main>

      {modalOpen && (
        <AddJobModal onClose={() => setModalOpen(false)} onSaved={refresh} />
      )}
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
      {resumesOpen && (
        <ResumeManagerModal onClose={() => setResumesOpen(false)} onChanged={refresh} />
      )}

      <Toaster theme="dark" position="bottom-right" richColors />
    </div>
  )
}
