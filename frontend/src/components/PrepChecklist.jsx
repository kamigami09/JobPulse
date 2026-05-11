import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { X, Plus, Check, ClipboardList } from 'lucide-react'
import { listPrep, seedPrep, addPrepTask, updatePrepTask, deletePrepTask } from '../lib/api'

const CATEGORIES = ['research', 'technical', 'behavioral', 'logistics']

const CATEGORY_META = {
  research:   { label: 'Research',   color: 'text-sky-400',     dot: 'bg-sky-400' },
  technical:  { label: 'Technical',  color: 'text-violet-400',  dot: 'bg-violet-400' },
  behavioral: { label: 'Behavioral', color: 'text-amber-400',   dot: 'bg-amber-400' },
  logistics:  { label: 'Logistics',  color: 'text-emerald-400', dot: 'bg-emerald-400' },
}

function ProgressBar({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 rounded-full bg-zinc-800">
        <div
          className="h-1 rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs text-zinc-400 tabular-nums shrink-0">{done}/{total}</span>
    </div>
  )
}

function TaskRow({ task, onToggle, onDelete }) {
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    setBusy(true)
    try { await onToggle(task) } finally { setBusy(false) }
  }

  return (
    <li className="group flex items-start gap-3 py-2.5">
      <button
        onClick={toggle}
        disabled={busy}
        aria-label={task.done ? 'Mark incomplete' : 'Mark done'}
        className={`mt-0.5 shrink-0 flex h-4 w-4 items-center justify-center rounded border transition-colors disabled:opacity-40 ${
          task.done
            ? 'bg-indigo-600 border-indigo-600'
            : 'border-zinc-600 hover:border-indigo-400'
        }`}
      >
        {task.done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
      </button>
      <span className={`flex-1 text-sm leading-relaxed transition-colors ${task.done ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>
        {task.text}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
        className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}

function AddTaskRow({ jobId, onAdded }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [category, setCategory] = useState('logistics')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    try {
      const task = await addPrepTask(jobId, { text: text.trim(), category })
      onAdded(task)
      setText('')
      setOpen(false)
    } catch {
      toast.error('Failed to add task')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add task
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Task description"
        className="w-full rounded-lg border border-zinc-700/80 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
      />
      <div className="flex gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-700/80 bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_META[c].label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setText('') }}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function PrepChecklist({ job, onClose }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let data = await listPrep(job.id)
      if (data.length === 0) data = await seedPrep(job.id)
      setTasks(data)
    } catch {
      toast.error('Failed to load prep checklist')
    } finally {
      setLoading(false)
    }
  }, [job.id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleToggle = async (task) => {
    const updated = await updatePrepTask(task.id, { done: !task.done })
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t))
  }

  const handleDelete = async (taskId) => {
    try {
      await deletePrepTask(taskId)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleAdded = (task) => setTasks((prev) => [...prev, task])

  const done = tasks.filter((t) => t.done).length
  const total = tasks.length
  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = tasks.filter((t) => t.category === cat)
    return acc
  }, {})

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="sheet-enter fixed right-0 top-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-800 z-50 flex flex-col shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-zinc-800 shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1.5">
              <ClipboardList className="h-4 w-4 text-indigo-400 shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Interview Prep</span>
            </div>
            <h2 className="text-base font-semibold text-zinc-100 leading-snug truncate">
              {job.title || 'Untitled role'}
            </h2>
            {job.company && (
              <p className="text-sm text-zinc-400 mt-0.5">{job.company}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress */}
        {!loading && total > 0 && (
          <div className="px-6 py-3 border-b border-zinc-800 shrink-0">
            <ProgressBar done={done} total={total} />
          </div>
        )}

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-6 rounded-md bg-zinc-800 shimmer" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {CATEGORIES.map((cat) => {
                const catTasks = byCategory[cat]
                if (catTasks.length === 0) return null
                const meta = CATEGORY_META[cat]
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${meta.dot}`} />
                      <span className={`text-[10px] font-semibold uppercase tracking-widest ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <ul className="divide-y divide-zinc-800/40">
                      {catTasks.map((task) => (
                        <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
                      ))}
                    </ul>
                  </div>
                )
              })}

              {tasks.filter((t) => !CATEGORIES.includes(t.category)).map((task) => (
                <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
              ))}

              <AddTaskRow jobId={job.id} onAdded={handleAdded} />
            </div>
          )}
        </div>

        {/* Footer: all done */}
        {!loading && done === total && total > 0 && (
          <div className="px-6 py-4 border-t border-zinc-800 shrink-0">
            <p className="text-sm text-emerald-400 font-medium text-center">
              All done — you're ready for the interview!
            </p>
          </div>
        )}
      </div>
    </>
  )
}
