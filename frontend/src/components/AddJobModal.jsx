import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { scrapeJob } from '../lib/api'
import StatusBadge from './StatusBadge'
import SkillChips from './SkillChips'

export default function AddJobModal({ onClose, onSaved }) {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState('input') // input | loading | result | error
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()

    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleScrape = async () => {
    const trimmed = url.trim()
    if (!trimmed) return
    setPhase('loading')
    try {
      const job = await scrapeJob(trimmed)
      setResult(job)
      setPhase('result')
      if (job.already_existed) {
        toast('Already in your list', { icon: '📌' })
      }
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong')
      setPhase('error')
    }
  }

  const handleDone = () => {
    onSaved()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div className="modal-enter relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">Add job</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Input phase */}
          {(phase === 'input' || phase === 'error') && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Job URL</label>
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleScrape() }}
                  placeholder="https://linkedin.com/jobs/view/... or any job URL"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              {phase === 'error' && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {errorMsg}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScrape}
                  disabled={!url.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Scrape
                </button>
              </div>
            </div>
          )}

          {/* Loading phase */}
          {phase === 'loading' && (
            <div className="space-y-3 py-2">
              <div className="h-5 w-2/3 rounded shimmer" />
              <div className="h-4 w-1/3 rounded shimmer" />
              <div className="h-4 w-1/2 rounded shimmer" />
              <div className="flex gap-1.5 pt-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-5 w-16 rounded-md shimmer" />
                ))}
              </div>
              <p className="text-xs text-zinc-500 pt-2 text-center">Extracting job details…</p>
            </div>
          )}

          {/* Result phase */}
          {phase === 'result' && result && (
            <div className="space-y-4">
              {result.status === 'needs_review' && (
                <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-4 py-3 text-sm text-orange-400">
                  Some fields couldn't be extracted automatically — edit them inline after saving.
                </div>
              )}
              {result.already_existed && (
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-400">
                  This URL is already in your list.
                </div>
              )}

              <div className="rounded-lg border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800">
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="w-24 shrink-0 text-xs text-zinc-500 pt-0.5">Title</span>
                  <span className="text-sm text-zinc-100 font-medium">{result.title || <span className="text-zinc-600">Not found</span>}</span>
                </div>
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="w-24 shrink-0 text-xs text-zinc-500 pt-0.5">Company</span>
                  <span className="text-sm text-zinc-100">{result.company || <span className="text-zinc-600">Not found</span>}</span>
                </div>
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="w-24 shrink-0 text-xs text-zinc-500 pt-0.5">Domain</span>
                  <span className="text-sm text-zinc-300">{result.domain || <span className="text-zinc-600">Not found</span>}</span>
                </div>
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="w-24 shrink-0 text-xs text-zinc-500 pt-0.5">Status</span>
                  <StatusBadge status={result.status} />
                </div>
                {(result.skills || []).length > 0 && (
                  <div className="flex items-start gap-3 px-4 py-3">
                    <span className="w-24 shrink-0 text-xs text-zinc-500 pt-0.5">Skills</span>
                    <SkillChips skills={result.skills} max={8} />
                  </div>
                )}
                {result.contact_email && (
                  <div className="flex items-start gap-3 px-4 py-3">
                    <span className="w-24 shrink-0 text-xs text-zinc-500 pt-0.5">Email</span>
                    <span className="text-sm text-zinc-300 font-mono">{result.contact_email}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleDone}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                >
                  View in table →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
