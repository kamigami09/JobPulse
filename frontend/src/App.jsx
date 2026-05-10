import { useState, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import TopBar from './components/TopBar'
import JobGrid from './components/JobGrid'
import AddJobModal from './components/AddJobModal'

export default function App() {
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <TopBar
        onAddJob={() => setModalOpen(true)}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
      />

      <main className="mx-auto max-w-screen-2xl px-6 py-6">
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
