import { toast } from 'sonner'
import { Plus, FileText, Download, Settings, LogOut, ChevronDown } from 'lucide-react'
import { downloadExport } from '../lib/api'

const STATUS_OPTIONS = [
  { value: '',             label: 'All statuses' },
  { value: 'Saved',        label: 'Saved' },
  { value: 'Applied',      label: 'Applied' },
  { value: 'Interviewing', label: 'Interviewing' },
  { value: 'Offer',        label: 'Offer' },
  { value: 'Rejected',     label: 'Rejected' },
  { value: 'needs_review', label: 'Needs Review' },
]

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    active: true,
  },
  {
    label: 'Analytics',
    onClick: () => document.getElementById('analytics')?.scrollIntoView({ behavior: 'smooth' }),
    active: false,
  },
]

export default function TopBar({
  onAddJob, onResumes, onSettings, statusFilter, onStatusFilter, username, onLogout,
}) {
  const handleExport = async () => {
    try {
      await downloadExport()
    } catch (err) {
      toast.error(err.message || 'Export failed')
    }
  }

  const initial = username ? username[0].toUpperCase() : '?'

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#0a0a0a]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center px-6">

        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2.5 mr-6">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-900/50">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 0 0-.788 0l-7 3a1 1 0 0 0 0 1.84L5.25 8.051a.999.999 0 0 1 .356-.257l4-1.714a1 1 0 1 1 .788 1.838L7.667 9.088l1.94.831a1 1 0 0 0 .787 0l7-3a1 1 0 0 0 0-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 0 0-1.05-.174 1 1 0 0 1-.89-.89 11.115 11.115 0 0 1 .25-3.762zM9.3 16.573A9.026 9.026 0 0 0 10 17a9.02 9.02 0 0 0 .7-.427V13.33l-1 .428-1-.428v3.243zM14 10.12l1.69-.724a11.116 11.116 0 0 1 .25 3.762 1 1 0 0 1-.89.89 8.969 8.969 0 0 0-1.05.175V10.12z" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">JobPulse</span>
        </div>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-0.5 mr-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                item.active
                  ? 'text-zinc-100 bg-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={onSettings}
            className="px-3 py-1.5 text-xs font-medium rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            Settings
          </button>
        </nav>

        <div className="flex-1 md:hidden" />

        {/* Right controls */}
        <div className="flex items-center gap-2">

          {/* Status filter */}
          <div className="relative hidden sm:block">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilter(e.target.value)}
              className="h-8 appearance-none rounded-md border border-zinc-800 bg-zinc-900 pl-3 pr-8 text-xs text-zinc-300 hover:border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
          </div>

          {/* Resumes */}
          <button
            onClick={onResumes}
            className="hidden sm:flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-zinc-100 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Resumes</span>
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="hidden sm:flex h-8 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:text-zinc-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Export</span>
          </button>

          {/* Add Job */}
          <button
            onClick={onAddJob}
            className="flex h-8 items-center gap-1.5 rounded-md bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Job</span>
          </button>

          <div className="h-5 w-px bg-zinc-800 mx-0.5" />

          {/* Settings icon — mobile only */}
          <button
            onClick={onSettings}
            title="Settings"
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* User avatar */}
          {username && (
            <div
              className="h-6 w-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center select-none"
              title={username}
            >
              <span className="text-[10px] font-semibold text-indigo-400">{initial}</span>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}
