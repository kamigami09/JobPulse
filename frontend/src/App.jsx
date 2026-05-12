import { useState, useCallback, useEffect } from 'react'
import { Toaster } from 'sonner'
import TopBar from './components/TopBar'
import JobGrid from './components/JobGrid'
import AddJobModal from './components/AddJobModal'
import LoginPage from './components/LoginPage'
import StatCards from './components/StatCards'
import PipelineFunnel from './components/PipelineFunnel'
import SettingsModal from './components/SettingsModal'
import ResumeManagerModal from './components/ResumeManagerModal'
import { isAuthenticated, clearToken, getUserEmail } from './lib/auth'

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">
      {children}
    </p>
  )
}

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
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <TopBar
        onAddJob={() => setModalOpen(true)}
        onResumes={() => setResumesOpen(true)}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        username={getUserEmail()}
        onLogout={handleLogout}
        onSettings={() => setSettingsOpen(true)}
      />

      <main className="mx-auto max-w-screen-2xl px-6 py-7">

        <SectionLabel>Pipeline</SectionLabel>
        <PipelineFunnel refreshKey={refreshKey} />

        <div id="analytics" className="mt-6">
          <SectionLabel>Analytics</SectionLabel>
          <StatCards refreshKey={refreshKey} />
        </div>

        <div className="mt-6">
          <SectionLabel>Job Tracker</SectionLabel>
          <JobGrid
            refreshKey={refreshKey}
            onAddJob={() => setModalOpen(true)}
            statusFilter={statusFilter}
          />
        </div>
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
