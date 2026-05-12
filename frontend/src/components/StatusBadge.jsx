const STATUS_CONFIG = {
  Saved:        { label: 'Saved',        dot: 'bg-blue-400',     bg: 'bg-blue-500/10',    text: 'text-blue-400',    ring: 'ring-blue-500/20',   glow: 'badge-glow-blue' },
  Applied:      { label: 'Applied',      dot: 'bg-indigo-400',   bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  ring: 'ring-indigo-500/20', glow: 'badge-glow-indigo' },
  Interviewing: { label: 'Interviewing', dot: 'bg-amber-400',    bg: 'bg-amber-500/10',   text: 'text-amber-400',   ring: 'ring-amber-500/20',  glow: 'badge-glow-amber' },
  Offer:        { label: 'Offer',        dot: 'bg-emerald-400',  bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/20',glow: 'badge-glow-emerald' },
  Rejected:     { label: 'Rejected',     dot: 'bg-red-400',      bg: 'bg-red-500/10',     text: 'text-red-400',     ring: 'ring-red-500/20',    glow: 'badge-glow-red' },
  needs_review: { label: 'Needs Review', dot: 'bg-orange-400',   bg: 'bg-transparent',    text: 'text-orange-400',  ring: 'ring-orange-500/40', glow: 'badge-glow-orange' },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Saved
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.bg} ${cfg.text} ${cfg.ring} ${cfg.glow}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
