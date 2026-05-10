import { useEffect, useState, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import toast from 'react-hot-toast'
import { listJobs, updateJob, deleteJob } from '../lib/api'
import { formatRelativeTime, formatAbsoluteDate } from '../lib/format'
import StatusBadge from './StatusBadge'
import SkillChips from './SkillChips'
import EmptyState from './EmptyState'

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

  const commonProps = {
    value,
    onChange: (e) => setValue(e.target.value),
    onBlur: handleBlur,
    autoFocus: true,
    className: 'w-full min-w-0 bg-zinc-800 text-zinc-100 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 resize-none',
  }

  if (editing) {
    return multiline
      ? <textarea rows={2} {...commonProps} />
      : <input {...commonProps} />
  }

  return (
    <span
      role="button"
      onClick={() => setEditing(true)}
      className={`block cursor-text rounded px-1 py-0.5 text-sm transition-colors hover:bg-zinc-800 ${saving ? 'opacity-50' : ''} ${value ? 'text-zinc-100' : 'text-zinc-600'}`}
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
    const newSkills = value.split(',').map(s => s.trim()).filter(Boolean)
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
        className="w-full bg-zinc-800 text-zinc-100 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500"
      />
    )
  }

  return (
    <div className="cursor-text" onClick={() => setEditing(true)}>
      {(initial || []).length > 0
        ? <SkillChips skills={initial} />
        : <span className="text-zinc-600 text-sm hover:bg-zinc-800 rounded px-1 py-0.5">—</span>
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
    <div className="relative">
      <StatusBadge status={status} />
      <select
        value={status}
        onChange={handleChange}
        disabled={saving}
        className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        aria-label="Change status"
      >
        {STATUS_OPTIONS.map(s => (
          <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
        ))}
      </select>
    </div>
  )
}

export default function JobGrid({ refreshKey, onAddJob, statusFilter }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState([])

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listJobs(statusFilter || undefined)
      setJobs(data)
    } catch (err) {
      toast.error(`Failed to load jobs: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchJobs() }, [fetchJobs, refreshKey])

  const handleSave = useCallback(async (id, patch) => {
    const updated = await updateJob(id, patch)
    setJobs(prev => prev.map(j => j.id === id ? updated : j))
    toast.success('Saved', { duration: 1500 })
  }, [])

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Delete this job?')) return
    try {
      await deleteJob(id)
      setJobs(prev => prev.filter(j => j.id !== id))
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }, [])

  const columns = [
    columnHelper.accessor('title', {
      header: 'Title',
      size: 200,
      cell: ({ row }) => (
        <div className="flex items-start gap-2 min-w-0">
          <EditableCell
            value={row.original.title}
            jobId={row.original.id}
            field="title"
            onSave={handleSave}
          />
        </div>
      ),
    }),
    columnHelper.accessor('company', {
      header: 'Company',
      size: 140,
      cell: ({ row }) => (
        <EditableCell
          value={row.original.company}
          jobId={row.original.id}
          field="company"
          onSave={handleSave}
        />
      ),
    }),
    columnHelper.accessor('domain', {
      header: 'Domain',
      size: 160,
      cell: ({ row }) => (
        <EditableCell
          value={row.original.domain}
          jobId={row.original.id}
          field="domain"
          onSave={handleSave}
        />
      ),
    }),
    columnHelper.accessor('skills', {
      header: 'Skills',
      size: 220,
      enableSorting: false,
      cell: ({ row }) => (
        <SkillsCell
          skills={row.original.skills}
          jobId={row.original.id}
          onSave={handleSave}
        />
      ),
    }),
    columnHelper.accessor('contact_email', {
      header: 'Contact',
      size: 160,
      cell: ({ row }) => (
        <EditableCell
          value={row.original.contact_email}
          jobId={row.original.id}
          field="contact_email"
          onSave={handleSave}
        />
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      size: 130,
      cell: ({ row }) => (
        <StatusCell
          status={row.original.status}
          jobId={row.original.id}
          onSave={handleSave}
        />
      ),
    }),
    columnHelper.accessor('scraped_at', {
      header: 'Saved',
      size: 90,
      cell: ({ getValue }) => (
        <span
          className="text-sm text-zinc-400 cursor-default"
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
        <EditableCell
          value={row.original.notes}
          jobId={row.original.id}
          field="notes"
          multiline
          onSave={handleSave}
        />
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      size: 60,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-indigo-400 transition-colors"
            title="Open original job posting"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="text-zinc-600 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
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
      <div className="space-y-3 pt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg shimmer" />
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return <EmptyState onAddJob={onAddJob} />
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            {table.getHeaderGroups()[0].headers.map((header) => (
              <th
                key={header.id}
                style={{ width: header.getSize() }}
                onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-zinc-300 transition-colors' : ''}`}
              >
                <span className="flex items-center gap-1">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc' && <span className="text-indigo-400">↑</span>}
                  {header.column.getIsSorted() === 'desc' && <span className="text-indigo-400">↓</span>}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr
              key={row.id}
              className={`group border-b border-zinc-800/50 transition-colors hover:bg-zinc-900/60 ${row.original.status === 'needs_review' ? 'border-l-2 border-l-orange-500/50' : ''} ${i === table.getRowModel().rows.length - 1 ? 'border-b-0' : ''}`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3.5 align-top">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
