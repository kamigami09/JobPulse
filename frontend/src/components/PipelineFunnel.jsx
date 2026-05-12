import { useState, useEffect } from 'react'
import { http } from '../lib/http'

const STAGES = [
  { key: 'Saved',        label: 'SAVED',        color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  { key: 'Applied',      label: 'APPLIED',      color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20' },
  { key: 'Interviewing', label: 'INTERVIEWING', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  { key: 'Offer',        label: 'OFFER',        color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { key: 'Rejected',     label: 'REJECTED',     color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
]

function Arrow() {
  return (
    <svg className="shrink-0 mx-2 text-zinc-700" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 9h12M11 4l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PipelineFunnel({ refreshKey }) {
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    http.get('/api/jobs/stats')
      .then((r) => setCounts(r.data?.counts ?? {}))
      .catch(() => setCounts({}))
      .finally(() => setLoading(false))
  }, [refreshKey])

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900 px-5 py-4 mb-4">
      <div className="flex items-center overflow-x-auto gap-0 pb-0.5">
        {STAGES.map((stage, i) => {
          const count = counts[stage.key] ?? 0
          return (
            <div key={stage.key} className="flex items-center shrink-0">
              <div
                className={`funnel-stage flex flex-col items-center justify-center px-5 py-3 rounded-xl border ${stage.border} ${stage.bg} min-w-[108px] transition-colors hover:brightness-110`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className={`text-[9px] font-bold tracking-[0.2em] ${stage.color}`}>
                  {stage.label}
                </span>
                {loading ? (
                  <div className="mt-2 h-7 w-10 rounded-md shimmer" />
                ) : (
                  <span className={`font-mono text-[26px] font-bold ${stage.color} leading-none mt-1.5 tabular-nums`}>
                    {count}
                  </span>
                )}
              </div>
              {i < STAGES.length - 1 && <Arrow />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
