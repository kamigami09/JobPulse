import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { X, Upload, Download, Archive, ArchiveRestore, Trash2, FileText, Plus } from 'lucide-react'
import { deleteResume, downloadResume, listResumes, updateResume, uploadResume } from '../lib/api'

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

function EditableLabel({ value: initial, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initial)

  useEffect(() => { setValue(initial) }, [initial])

  const commit = async () => {
    setEditing(false)
    const trimmed = value.trim()
    if (!trimmed || trimmed === initial) { setValue(initial); return }
    try {
      await onSave({ label: trimmed })
    } catch (err) {
      setValue(initial)
      toast.error(err.response?.data?.error || 'Failed to rename')
    }
  }

  if (editing) {
    return (
      <input
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setValue(initial); setEditing(false) }
        }}
        className="w-full rounded-md border border-zinc-700/80 bg-zinc-800 px-2 py-0.5 text-sm text-zinc-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
      />
    )
  }

  return (
    <span
      className="cursor-text rounded-md px-1 py-0.5 text-sm font-medium text-zinc-100 hover:bg-zinc-800 transition-colors"
      onClick={() => setEditing(true)}
      title="Click to rename"
    >
      {value}
    </span>
  )
}

function ResumeRow({ resume, onArchive, onDelete, onDownload, onUpdated }) {
  const [deleting, setDeleting] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete "${resume.label}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await onDelete(resume.id)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const handleArchive = async () => {
    setArchiving(true)
    try {
      await onArchive(resume.id, !resume.is_archived)
    } finally {
      setArchiving(false)
    }
  }

  return (
    <tr className={`border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/20 ${resume.is_archived ? 'opacity-50' : ''}`}>
      <td className="px-4 py-3 align-top">
        <EditableLabel
          value={resume.label}
          onSave={async (patch) => {
            const updated = await updateResume(resume.id, patch)
            onUpdated(updated)
          }}
        />
        {resume.notes && (
          <p className="mt-0.5 px-1 text-xs text-zinc-500 truncate max-w-[160px]" title={resume.notes}>
            {resume.notes}
          </p>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        <span className="font-mono text-xs text-zinc-500 truncate max-w-[140px] block" title={resume.filename}>
          {resume.filename}
        </span>
      </td>
      <td className="px-4 py-3 align-top">
        <span className="font-mono text-xs text-zinc-500">{formatSize(resume.file_size)}</span>
      </td>
      <td className="px-4 py-3 align-top">
        {resume.job_count > 0 ? (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-indigo-500/10 text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
            {resume.job_count} job{resume.job_count !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-xs text-zinc-600">—</span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDownload(resume.id, resume.label)}
            title="Download PDF"
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleArchive}
            disabled={archiving}
            title={resume.is_archived ? 'Unarchive' : 'Archive'}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
          >
            {resume.is_archived
              ? <ArchiveRestore className="h-3.5 w-3.5" />
              : <Archive className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || resume.job_count > 0}
            title={resume.job_count > 0 ? `Used by ${resume.job_count} job(s) — archive instead` : 'Delete permanently'}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function ResumeManagerModal({ onClose, onChanged }) {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadLabel, setUploadLabel] = useState('')
  const [uploadNotes, setUploadNotes] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const fetchResumes = async () => {
    setLoading(true)
    try {
      const data = await listResumes(showArchived)
      setResumes(data)
    } catch {
      toast.error('Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchResumes() }, [showArchived])

  const handleUpload = async () => {
    if (!uploadFile || !uploadLabel.trim()) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', uploadFile)
    fd.append('label', uploadLabel.trim())
    if (uploadNotes.trim()) fd.append('notes', uploadNotes.trim())
    try {
      await uploadResume(fd)
      toast.success('Resume uploaded')
      setShowUploadForm(false)
      setUploadFile(null)
      setUploadLabel('')
      setUploadNotes('')
      await fetchResumes()
      onChanged?.()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleArchive = async (id, archive) => {
    try {
      await updateResume(id, { is_archived: archive })
      await fetchResumes()
      onChanged?.()
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleDelete = async (id) => {
    await deleteResume(id)
    toast.success('Deleted')
    await fetchResumes()
    onChanged?.()
  }

  const handleDownload = async (id, label) => {
    try {
      await downloadResume(id, label)
    } catch {
      toast.error('Download failed')
    }
  }

  const handleUpdated = (updated) => {
    setResumes((prev) => prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r))
    onChanged?.()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="modal-enter relative w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-100">Resume versions</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Upload form */}
          {showUploadForm ? (
            <div className="rounded-lg border border-zinc-700/80 bg-zinc-950/60 p-4 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Upload new resume</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Label *</label>
                  <input
                    type="text"
                    value={uploadLabel}
                    onChange={(e) => setUploadLabel(e.target.value)}
                    placeholder="e.g. Backend Focus"
                    className="w-full rounded-md border border-zinc-700/80 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Notes</label>
                  <input
                    type="text"
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Optional notes"
                    className="w-full rounded-md border border-zinc-700/80 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">PDF file *</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 h-8 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Choose PDF
                  </button>
                  {uploadFile ? (
                    <span className="font-mono text-xs text-zinc-400 truncate max-w-[200px]">{uploadFile.name}</span>
                  ) : (
                    <span className="text-xs text-zinc-600">No file selected (max 5 MB)</span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => { setShowUploadForm(false); setUploadFile(null); setUploadLabel(''); setUploadNotes('') }}
                  className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || !uploadLabel.trim() || uploading}
                  className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowUploadForm(true)}
              className="inline-flex items-center gap-1.5 h-8 rounded-md border border-dashed border-zinc-700 px-3 text-xs text-zinc-400 hover:border-indigo-500/50 hover:text-zinc-200 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Upload new resume
            </button>
          )}

          {/* Resume list */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg shimmer" />)}
            </div>
          ) : resumes.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <FileText className="h-8 w-8 text-zinc-700 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-zinc-500">No resumes yet. Upload your first one above.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/40">
                    <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">Label</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">File</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">Size</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">Usage</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {resumes.map((r) => (
                    <ResumeRow
                      key={r.id}
                      resume={r}
                      onArchive={handleArchive}
                      onDelete={handleDelete}
                      onDownload={handleDownload}
                      onUpdated={handleUpdated}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            onClick={() => setShowArchived((v) => !v)}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {showArchived ? 'Hide archived' : 'Show archived'}
          </button>
        </div>
      </div>
    </div>
  )
}
