export default function TopBar({ onAddJob, statusFilter, onStatusFilter }) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-6">
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 0 0-.788 0l-7 3a1 1 0 0 0 0 1.84L5.25 8.051a.999.999 0 0 1 .356-.257l4-1.714a1 1 0 1 1 .788 1.838L7.667 9.088l1.94.831a1 1 0 0 0 .787 0l7-3a1 1 0 0 0 0-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 0 0-1.05-.174 1 1 0 0 1-.89-.89 11.115 11.115 0 0 1 .25-3.762zM9.3 16.573A9.026 9.026 0 0 0 10 17a9.02 9.02 0 0 0 .7-.427V13.33l-1 .428-1-.428v3.243zM14 10.12l1.69-.724a11.116 11.116 0 0 1 .25 3.762 1 1 0 0 1-.89.89 8.969 8.969 0 0 0-1.05.175V10.12z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-zinc-100 tracking-tight">JobPulse</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 text-xs text-zinc-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
        >
          <option value="">All statuses</option>
          <option value="Saved">Saved</option>
          <option value="Applied">Applied</option>
          <option value="Interviewing">Interviewing</option>
          <option value="Offer">Offer</option>
          <option value="Rejected">Rejected</option>
          <option value="needs_review">Needs Review</option>
        </select>

        {/* Export CSV */}
        <a
          href="/api/jobs/export"
          download
          className="flex h-8 items-center rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
        >
          Export CSV
        </a>

        {/* Add Job button */}
        <button
          onClick={onAddJob}
          className="flex h-8 items-center gap-1.5 rounded-md bg-indigo-600 px-3 text-xs font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Job
        </button>
      </div>
    </header>
  )
}
