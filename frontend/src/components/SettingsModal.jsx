import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { X, Mail, Send, Eye, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { getReminderConfig, getReminderHistory, sendNow, openPreview } from '../lib/reminders'

const STATUS_BADGE = {
  sent:    { label: 'Sent',     cls: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' },
  skipped: { label: 'Skipped',  cls: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20' },
  failed:  { label: 'Failed',   cls: 'bg-red-500/10 text-red-400 ring-red-500/20' },
  dry_run: { label: 'Dry run',  cls: 'bg-amber-500/10 text-amber-400 ring-amber-500/20' },
}

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
    } catch {
      toast.error('Failed to load reminder settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

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
    } catch {
      toast.error('Preview failed')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="modal-enter relative z-10 w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">Settings</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Email Reminders */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Mail className="h-3.5 w-3.5 text-zinc-500" />
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Email Reminders
              </h3>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-9 rounded-lg shimmer" />)}
              </div>
            ) : config ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-zinc-800 divide-y divide-zinc-800">
                  <StatusRow label="Auto-schedule" ok={config.enabled}>
                    {config.enabled ? 'Enabled — Sundays 09:00 Paris' : 'Set REMINDERS_ENABLED=true'}
                  </StatusRow>
                  <StatusRow label="SMTP" ok={config.smtp_configured}>
                    {config.smtp_configured ? 'Configured' : 'Set SMTP_USER + SMTP_PASSWORD'}
                  </StatusRow>
                  <StatusRow label="Recipient" ok={config.recipient_configured}>
                    {config.recipient_configured ? config.recipient : 'Set REMINDER_TO in .env'}
                  </StatusRow>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleSendNow(false)}
                    disabled={sending || !config.ready}
                    className="inline-flex items-center gap-1.5 h-8 rounded-md bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    {sending ? 'Sending…' : 'Send digest now'}
                  </button>
                  <button
                    onClick={() => handleSendNow(true)}
                    disabled={sending || !config.ready}
                    title="Force send even if sent recently"
                    className="inline-flex items-center gap-1.5 h-8 rounded-md border border-zinc-700 bg-transparent px-3 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Force send
                  </button>
                  <button
                    onClick={handlePreview}
                    className="inline-flex items-center gap-1.5 h-8 rounded-md border border-zinc-700 bg-transparent px-3 text-xs font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </button>
                </div>

                {!config.ready && (
                  <p className="text-xs text-amber-400">
                    Configure SMTP credentials in .env to enable sending.
                  </p>
                )}
              </div>
            ) : null}
          </section>

          {/* History */}
          {history.length > 0 && (
            <section>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
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
                      const s = STATUS_BADGE[row.status] ?? { label: row.status, cls: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20' }
                      return (
                        <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-3 py-2.5 font-mono text-zinc-400">
                            {new Date(row.sent_at).toLocaleString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${s.cls}`}>
                              {s.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-zinc-400 tabular-nums">
                            {row.job_count}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusRow({ label, ok, children }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 gap-4">
      <div className="flex items-center gap-2 shrink-0">
        {ok
          ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          : <XCircle className="h-3.5 w-3.5 text-zinc-600" />}
        <span className="text-xs font-medium text-zinc-300">{label}</span>
      </div>
      <span className="text-xs text-zinc-500 text-right truncate">{children}</span>
    </div>
  )
}
