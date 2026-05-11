import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { X, Loader2, AlertCircle, Pin } from 'lucide-react'
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
      if (job.already_existed) toast('Already in your list', { icon: <Pin className="h-3.5 w-3.5" /> })
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="modal-enter relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">Add job</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* Input / error phase */}
          {(phase === 'input' || phase === 'error') && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Job URL
                </label>
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleScrape() }}
                  placeholder="https://linkedin.com/jobs/view/… or any job URL"
                  className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              {phase === 'error' && (
                <div className="flex gap-2.5 rounded-lg bg-red-500/8 border border-red-500/20 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{errorMsg}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScrape}
                  disabled={!url.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Scrape
                </button>
              </div>
            </div>
          )}

          {/* Loading phase */}
          {phase === 'loading' && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 mb-5">
                <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                <span className="text-sm text-zinc-400">Extracting job details…</span>
              </div>
              <div className="space-y-2.5">
                <div className="h-4 w-3/4 rounded shimmer" />
                <div className="h-4 w-1/2 rounded shimmer" />
                <div className="h-4 w-2/3 rounded shimmer" />
                <div className="flex gap-1.5 pt-1">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-5 w-14 rounded shimmer" />)}
                </div>
              </div>
            </div>
          )}

          {/* Result phase */}
          {phase === 'result' && result && (
            <div className="space-y-4">
              {result.status === 'needs_review' && (
                <div className="flex gap-2.5 rounded-lg bg-orange-500/8 border border-orange-500/20 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-400">Some fields couldn't be extracted — edit them inline after saving.</p>
                </div>
              )}
              {result.already_existed && (
                <div className="rounded-lg bg-blue-500/8 border border-blue-500/20 px-4 py-3 text-sm text-blue-400">
                  This URL is already in your list.
                </div>
              )}

              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 divide-y divide-zinc-800/80">
                <ResultRow label="Title">
                  <span className="text-sm font-medium text-zinc-100">{result.title || <Muted />}</span>
                </ResultRow>
                <ResultRow label="Company">
                  <span className="text-sm text-zinc-200">{result.company || <Muted />}</span>
                </ResultRow>
                <ResultRow label="Domain">
                  <span className="text-sm text-zinc-300">{result.domain || <Muted />}</span>
                </ResultRow>
                <ResultRow label="Status">
                  <StatusBadge status={result.status} />
                </ResultRow>
                {(result.skills || []).length > 0 && (
                  <ResultRow label="Skills">
                    <SkillChips skills={result.skills} max={8} />
                  </ResultRow>
                )}
                {result.contact_email && (
                  <ResultRow label="Email">
                    <span className="font-mono text-xs text-zinc-300">{result.contact_email}</span>
                  </ResultRow>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleDone}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
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

function ResultRow({ label, children }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="w-20 shrink-0 text-[11px] font-medium uppercase tracking-wider text-zinc-500 pt-0.5">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function Muted() {
  return <span className="text-zinc-600">Not found</span>
}
