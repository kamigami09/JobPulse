import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getReminderConfig, getReminderHistory, sendNow, openPreview } from '../lib/reminders'

export default function SettingsModal({ onClose }) {
  const [config, setConfig] = useState(null)
  const [history, setHistory] = useState([])
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cfg, hist] = await Promise.all([getReminderConfig(), getReminderHistory()])
      setConfig(cfg)
      setHistory(hist)
    } catch (err) {
      toast.error('Failed to load reminder settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSendNow = async (force = false) => {
    setSending(true)
    try {
      const result = await sendNow(force)
      if (result.status === 'sent') {
        toast.success(`Digest sent — ${result.job_count} job(s) included`)
      } else if (result.status === 'skipped') {
        toast(`Skipped: ${result.message}`, { icon: 'ℹ️' })
      } else {
        toast.error(result.message || 'Send failed')
      }
      load()
    } catch (err) {
      toast.error(err.message || 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const handlePreview = async () => {
    try {
      await openPreview()
    } catch (err) {
      toast.error('Preview failed')
    }
  }

  const statusDot = (ok) => (
    <span className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
  )

  const statusLabel = {
    sent: { label: 'Sent', cls: 'text-emerald-400' },
    skipped: { label: 'Skipped', cls: 'text-zinc-400' },
    failed: { label: 'Failed', cls: 'text-red-400' },
    dry_run: { label: 'Dry run', cls: 'text-amber-400' },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">Settings</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Email Reminders section */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Email Reminders
            </h3>

            {loading ? (
              <div className="text-xs text-zinc-500">Loading...</div>
            ) : config ? (
              <div className="space-y-3">
                {/* Status rows */}
                <div className="rounded-lg border border-zinc-800 divide-y divide-zinc-800">
                  <StatusRow label="Auto-schedule" ok={config.enabled}>
                    {config.enabled ? 'Enabled (Sundays 09:00 Paris)' : 'Disabled — set REMINDERS_ENABLED=true'}
                  </StatusRow>
                  <StatusRow label="SMTP" ok={config.smtp_configured}>
                    {config.smtp_configured ? 'Configured' : 'Set SMTP_USER + SMTP_PASSWORD in .env'}
                  </StatusRow>
                  <StatusRow label="Recipient" ok={config.recipient_configured}>
                    {config.recipient_configured ? config.recipient : 'Set REMINDER_TO in .env'}
                  </StatusRow>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleSendNow(false)}
                    disabled={sending || !config.ready}
                    className="flex h-8 items-center gap-1.5 rounded-md bg-indigo-600 px-3 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : 'Send digest now'}
                  </button>
                  <button
                    onClick={() => handleSendNow(true)}
                    disabled={sending || !config.ready}
                    className="flex h-8 items-center rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Force send even if sent recently"
                  >
                    Force send
                  </button>
                  <button
                    onClick={handlePreview}
                    className="flex h-8 items-center rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
                  >
                    Preview email
                  </button>
                </div>

                {!config.ready && (
                  <p className="text-xs text-amber-400">
                    Configure SMTP credentials in your .env file to enable sending.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {/* History section */}
          {history.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                Send History
              </h3>
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      <th className="px-3 py-2 text-left font-medium text-zinc-500">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-zinc-500">Status</th>
                      <th className="px-3 py-2 text-right font-medium text-zinc-500">Jobs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {history.map((row) => {
                      const s = statusLabel[row.status] || { label: row.status, cls: 'text-zinc-400' }
                      return (
                        <tr key={row.id} className="hover:bg-zinc-900/30 transition-colors">
                          <td className="px-3 py-2 text-zinc-400">
                            {new Date(row.sent_at).toLocaleString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className={`px-3 py-2 font-medium ${s.cls}`}>{s.label}</td>
                          <td className="px-3 py-2 text-right text-zinc-400">{row.job_count}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusRow({ label, ok, children }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
        <span className="text-xs font-medium text-zinc-400">{label}</span>
      </div>
      <span className="text-xs text-zinc-500">{children}</span>
    </div>
  )
}
