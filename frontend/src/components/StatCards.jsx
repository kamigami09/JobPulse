import { useState, useEffect } from 'react'
import { http } from '../lib/http'

function pct(rate) {
  if (rate === null || rate === undefined) return '—'
  return `${Math.round(rate * 100)}%`
}

function caption(num, denom, label) {
  if (!denom) return `No ${label} yet`
  return `${num} of ${denom}`
}

function Card({ label, value, sub, loading }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      {loading ? (
        <div className="h-8 w-16 rounded bg-zinc-800 animate-pulse mt-1" />
      ) : (
        <span className="text-3xl font-semibold tracking-tight text-zinc-100 leading-none mt-1">
          {value}
        </span>
      )}
      {loading ? (
        <div className="h-3 w-24 rounded bg-zinc-800 animate-pulse mt-1" />
      ) : (
        <span className="text-xs text-zinc-500 mt-0.5">{sub}</span>
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <Card
        label="Total Jobs"
        value={loading ? null : total}
        sub={loading ? null : 'tracked'}
        loading={loading}
      />
      <Card
        label="Response Rate"
        value={loading ? null : pct(rates.response_rate)}
        sub={loading ? null : caption(counts.Applied, total, 'jobs tracked')}
        loading={loading}
      />
      <Card
        label="Interview Rate"
        value={loading ? null : pct(rates.interview_rate)}
        sub={loading ? null : caption(counts.Interviewing, counts.Applied, 'applied')}
        loading={loading}
      />
      <Card
        label="Offer Rate"
        value={loading ? null : pct(rates.offer_rate)}
        sub={loading ? null : caption(counts.Offer, counts.Interviewing, 'interviewed')}
        loading={loading}
      />
    </div>
  )
}
