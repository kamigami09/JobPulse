import { useEffect, useState, useCallback } from 'react'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, createColumnHelper,
} from '@tanstack/react-table'
import { toast } from 'sonner'
import {
  ClipboardList, ExternalLink, Trash2, ArrowUp, ArrowDown,
  Download,
} from 'lucide-react'
import { listJobs, updateJob, deleteJob, listResumes, downloadResume } from '../lib/api'
import { formatRelativeTime, formatAbsoluteDate } from '../lib/format'
import StatusBadge from './StatusBadge'
import SkillChips from './SkillChips'
import EmptyState from './EmptyState'
import PrepChecklist from './PrepChecklist'

const columnHelper = createColumnHelper()

const STATUS_OPTIONS = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'needs_review']
const STATUS_LABELS = {
  needs_review: 'Needs Review',
  Saved: 'Saved', Applied: 'Applied', Interviewing: 'Interviewing',
  Offer: 'Offer', Rejected: 'Rejected',
}

function EditableCell({ value: initial, jobId, field, multiline = false, onSave }) {
  const [value, setValue] = useState(initial ?? '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setValue(initial ?? '') }, [initial])

  const handleBlur = async () => {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed === (initial ?? '').trim()) return
    setSaving(true)
    try {
      await onSave(jobId, { [field]: trimmed || null })
    } catch {
      setValue(initial ?? '')
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const sharedClass = 'w-full min-w-0 bg-zinc-800/80 text-zinc-100 rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 resize-none border border-zinc-700/50 focus:border-indigo-500 transition-colors'

  if (editing) {
    return multiline
      ? <textarea rows={2} value={value} onChange={(e) => setValue(e.target.value)} onBlur={handleBlur} autoFocus className={sharedClass} />
      : <input value={value} onChange={(e) => setValue(e.target.value)} onBlur={handleBlur} autoFocus className={sharedClass} />
  }

  return (
    <span
      role="button"
      onClick={() => setEditing(true)}
      className={`block cursor-text rounded-md px-1 py-0.5 text-sm transition-colors hover:bg-zinc-800/60 ${saving ? 'opacity-40' : ''} ${value ? 'text-zinc-200' : 'text-zinc-600'}`}
    >
      {value || '—'}
    </span>
  )
}

function SkillsCell({ skills: initial, jobId, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState((initial || []).join(', '))

  useEffect(() => { setValue((initial || []).join(', ')) }, [initial])

  const handleBlur = async () => {
    setEditing(false)
    const newSkills = value.split(',').map((s) => s.trim()).filter(Boolean)
    const orig = (initial || []).join(', ')
    if (value.trim() === orig.trim()) return
    try {
      await onSave(jobId, { skills: newSkills })
    } catch {
      setValue(orig)
      toast.error('Failed to save')
    }
  }

  if (editing) {
    return (
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        autoFocus
        placeholder="React, Python, AWS"
        className="w-full rounded-md border border-zinc-700/50 bg-zinc-800/80 px-2 py-1 text-sm text-zinc-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
      />
    )
  }

  return (
    <div className="cursor-text" onClick={() => setEditing(true)}>
      {(initial || []).length > 0
        ? <SkillChips skills={initial} />
        : <span className="text-zinc-600 text-sm hover:bg-zinc-800/60 rounded-md px-1 py-0.5 transition-colors">—</span>
      }
    </div>
  )
}

function StatusCell({ status: initial, jobId, onSave }) {
  const [status, setStatus] = useState(initial)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setStatus(initial) }, [initial])

  const handleChange = async (e) => {
    const next = e.target.value
    const prev = status
    setStatus(next)
    setSaving(true)
    try {
      await onSave(jobId, { status: next })
      if (next === 'Applied') toast.success('Marked as applied')
    } catch {
      setStatus(prev)
      toast.error('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative w-fit">
      <StatusBadge status={status} />
      <select
        value={status}
        onChange={handleChange}
        disabled={saving}
        className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        aria-label="Change status"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
        ))}
      </select>
    </div>
  )
}

function ResumeCell({ resume, jobId, resumes, onSave, onDownload }) {
  const [saving, setSaving] = useState(false)

  const handleChange = async (e) => {
    const newId = e.target.value ? parseInt(e.target.value, 10) : null
    if (newId === (resume?.id ?? null)) return
    setSaving(true)
    try {
      await onSave(jobId, { resume_version_id: newId })
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="relative min-w-0">
        <span className={`block truncate max-w-[110px] rounded-md px-1 py-0.5 text-sm transition-colors ${resume ? 'text-indigo-400' : 'text-zinc-600'} ${saving ? 'opacity-40' : ''}`}>
          {resume?.label ?? '—'}
        </span>
        <select
          value={resume?.id ?? ''}
          onChange={handleChange}
          disabled={saving}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Resume version"
        >
          <option value="">— none —</option>
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>
      {resume && (
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(resume.id, resume.label) }}
          title="Download resume PDF"
          className="shrink-0 text-zinc-600 hover:text-indigo-400 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

export default function JobGrid({ refreshKey, onAddJob, statusFilter }) {
  const [jobs, setJobs] = useState([])
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState([])
  const [prepJob, setPrepJob] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [jobsData, resumesData] = await Promise.all([
        listJobs(statusFilter || undefined),
        listResumes(),
      ])
      setJobs(jobsData)
      setResumes(resumesData)
    } catch (err) {
      toast.error(`Failed to load: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  const handleSave = useCallback(async (id, patch) => {
    const updated = await updateJob(id, patch)
    setJobs((prev) => prev.map((j) => j.id === id ? updated : j))
    toast.success('Saved', { duration: 1500 })
  }, [])

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Delete this job?')) return
    try {
      await deleteJob(id)
      setJobs((prev) => prev.filter((j) => j.id !== id))
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }, [])

  const handleResumeDownload = useCallback(async (id, label) => {
    try {
      await downloadResume(id, label)
    } catch {
      toast.error('Download failed')
    }
  }, [])

  const columns = [
    columnHelper.accessor('title', {
      header: 'Title',
      size: 200,
      cell: ({ row }) => (
        <EditableCell value={row.original.title} jobId={row.original.id} field="title" onSave={handleSave} />
      ),
    }),
    columnHelper.accessor('company', {
      header: 'Company',
      size: 140,
      cell: ({ row }) => (
        <EditableCell value={row.original.company} jobId={row.original.id} field="company" onSave={handleSave} />
      ),
    }),
    columnHelper.accessor('domain', {
      header: 'Domain',
      size: 150,
      cell: ({ row }) => (
        <EditableCell value={row.original.domain} jobId={row.original.id} field="domain" onSave={handleSave} />
      ),
    }),
    columnHelper.accessor('skills', {
      header: 'Skills',
      size: 220,
      enableSorting: false,
      cell: ({ row }) => (
        <SkillsCell skills={row.original.skills} jobId={row.original.id} onSave={handleSave} />
      ),
    }),
    columnHelper.accessor('contact_email', {
      header: 'Contact',
      size: 160,
      cell: ({ row }) => (
        <EditableCell value={row.original.contact_email} jobId={row.original.id} field="contact_email" onSave={handleSave} />
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      size: 140,
      cell: ({ row }) => (
        <StatusCell status={row.original.status} jobId={row.original.id} onSave={handleSave} />
      ),
    }),
    columnHelper.display({
      id: 'resume_version',
      header: 'Resume',
      size: 150,
      enableSorting: false,
      cell: ({ row }) => (
        <ResumeCell
          resume={row.original.resume_version}
          jobId={row.original.id}
          resumes={resumes}
          onSave={handleSave}
          onDownload={handleResumeDownload}
        />
      ),
    }),
    columnHelper.accessor('scraped_at', {
      header: 'Saved',
      size: 90,
      cell: ({ getValue }) => (
        <span
          className="font-mono text-xs text-zinc-500 cursor-default tabular-nums"
          title={formatAbsoluteDate(getValue())}
        >
          {formatRelativeTime(getValue())}
        </span>
      ),
    }),
    columnHelper.accessor('notes', {
      header: 'Notes',
      size: 200,
      enableSorting: false,
      cell: ({ row }) => (
        <EditableCell value={row.original.notes} jobId={row.original.id} field="notes" multiline onSave={handleSave} />
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      size: 88,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPrepJob(row.original)}
            title="Interview prep checklist"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              row.original.status === 'Interviewing'
                ? 'text-indigo-400 hover:bg-indigo-500/10'
                : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
          </button>
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open original posting"
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            onClick={() => handleDelete(row.original.id)}
            title="Delete"
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    }),
  ]

  const table = useReactTable({
    data: jobs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (loading) {
    return (
      <div className="space-y-2 pt-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg shimmer" style={{ opacity: 1 - i * 0.12 }} />
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return <EmptyState onAddJob={onAddJob} />
  }

  return (
    <>
      {prepJob && <PrepChecklist job={prepJob} onClose={() => setPrepJob(null)} />}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/40">
              {table.getHeaderGroups()[0].headers.map((header) => (
                <th
                  key={header.id}
                  style={{ width: header.getSize() }}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                  className={`px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-zinc-300 transition-colors' : ''}`}
                >
                  <span className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && <ArrowUp className="h-3 w-3 text-indigo-400" />}
                    {header.column.getIsSorted() === 'desc' && <ArrowDown className="h-3 w-3 text-indigo-400" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={`group border-b border-zinc-800/40 transition-colors hover:bg-zinc-900/50 ${
                  row.original.status === 'needs_review' ? 'border-l-2 border-l-orange-500/40' : ''
                } ${i === table.getRowModel().rows.length - 1 ? 'border-b-0' : ''}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
