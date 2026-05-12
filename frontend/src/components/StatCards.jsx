import { useState, useEffect } from 'react'
import { http } from '../lib/http'

function pct(rate) {
  if (rate === null || rate === undefined) return '—'
  return `${Math.round(rate * 100)}%`
}

function sub(num, denom, label) {
  if (!denom) return `No ${label} yet`
  return `${num} of ${denom}`
}

function Card({ label, value, detail, accent, loading, rate, barColor }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col gap-2 min-w-0 transition-colors hover:border-zinc-700">
      {accent && (
        <div className={`absolute top-0 left-0 right-0 h-px ${accent}`} />
      )}
      <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      {loading ? (
        <div className="h-9 w-20 rounded-md bg-zinc-800 shimmer" />
      ) : (
        <span className="font-mono text-3xl font-semibold tracking-tight text-zinc-100 leading-none tabular-nums">
          {value}
        </span>
      )}
      {loading ? (
        <div className="h-3.5 w-28 rounded bg-zinc-800 shimmer" />
      ) : (
        <span className="text-xs text-zinc-500 leading-relaxed">{detail}</span>
      )}
      {rate !== undefined && !loading && (
        <div className="mt-auto pt-2">
          <div className="h-0.5 w-full rounded-full bg-zinc-800">
            <div
              className={`h-0.5 rounded-full transition-all duration-700 ${barColor ?? 'bg-indigo-500'}`}
              style={{ width: `${Math.min(100, Math.round((rate ?? 0) * 100))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function StatCards({ refreshKey }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    http.get('/api/jobs/stats')
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [refreshKey])

  const counts = stats?.counts ?? {}
  const rates  = stats?.rates  ?? {}
  const total  = stats?.total  ?? 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card
        label="Total Tracked"
        value={loading ? null : total}
        detail={loading ? null : 'jobs in pipeline'}
        accent="bg-indigo-500/60"
        loading={loading}
      />
      <Card
        label="Response Rate"
        value={loading ? null : pct(rates.response_rate)}
        detail={loading ? null : sub(counts.Applied ?? 0, total, 'jobs applied')}
        accent="bg-blue-500/60"
        loading={loading}
        rate={rates.response_rate}
        barColor="bg-blue-500"
      />
      <Card
        label="Interview Rate"
        value={loading ? null : pct(rates.interview_rate)}
        detail={loading ? null : sub(counts.Interviewing ?? 0, counts.Applied ?? 0, 'apps to interview')}
        accent="bg-amber-500/60"
        loading={loading}
        rate={rates.interview_rate}
        barColor="bg-amber-500"
      />
      <Card
        label="Offer Rate"
        value={loading ? null : pct(rates.offer_rate)}
        detail={loading ? null : sub(counts.Offer ?? 0, counts.Interviewing ?? 0, 'interviews to offer')}
        accent="bg-emerald-500/60"
        loading={loading}
        rate={rates.offer_rate}
        barColor="bg-emerald-500"
      />
    </div>
  )
}
