const STATUS_CONFIG = {
  Saved:        { label: 'Saved',        bg: 'bg-blue-500/10',    text: 'text-blue-400',    ring: 'ring-blue-500/20' },
  Applied:      { label: 'Applied',      bg: 'bg-violet-500/10',  text: 'text-violet-400',  ring: 'ring-violet-500/20' },
  Interviewing: { label: 'Interviewing', bg: 'bg-amber-500/10',   text: 'text-amber-400',   ring: 'ring-amber-500/20' },
  Offer:        { label: 'Offer',        bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20' },
  Rejected:     { label: 'Rejected',     bg: 'bg-red-500/10',     text: 'text-red-400',     ring: 'ring-red-500/20' },
  needs_review: { label: 'Needs Review', bg: 'bg-orange-500/10',  text: 'text-orange-400',  ring: 'ring-orange-500/20' },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Saved
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
      {cfg.label}
    </span>
  )
}
