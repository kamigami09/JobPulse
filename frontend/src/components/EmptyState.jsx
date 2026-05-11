import { Briefcase } from 'lucide-react'

export default function EmptyState({ onAddJob }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60">
        <Briefcase className="h-7 w-7 text-zinc-600" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-zinc-200">No jobs tracked yet</h3>
      <p className="mt-2 text-sm text-zinc-500 max-w-[260px] leading-relaxed">
        Paste any job URL — JobPulse extracts the details automatically.
      </p>
      <button
        onClick={onAddJob}
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        Add your first job
      </button>
    </div>
  )
}
