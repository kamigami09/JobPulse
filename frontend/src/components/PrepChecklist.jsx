import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { listPrep, seedPrep, addPrepTask, updatePrepTask, deletePrepTask } from '../lib/api'

const CATEGORIES = ['research', 'technical', 'behavioral', 'logistics']

const CATEGORY_META = {
  research:   { label: 'Research',   color: 'text-sky-400',    dot: 'bg-sky-400'    },
  technical:  { label: 'Technical',  color: 'text-violet-400', dot: 'bg-violet-400' },
  behavioral: { label: 'Behavioral', color: 'text-amber-400',  dot: 'bg-amber-400'  },
  logistics:  { label: 'Logistics',  color: 'text-emerald-400',dot: 'bg-emerald-400'},
}

function ProgressBar({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800">
        <div
          className="h-1.5 rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-400 tabular-nums shrink-0">{done}/{total}</span>
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
    <li className="group flex items-start gap-3 py-2">
      <button
        onClick={toggle}
        disabled={busy}
        className="mt-0.5 shrink-0 h-4 w-4 rounded border border-zinc-600 flex items-center justify-center transition-colors hover:border-indigo-500 disabled:opacity-40"
        style={task.done ? { background: '#6366f1', borderColor: '#6366f1' } : {}}
        aria-label={task.done ? 'Mark incomplete' : 'Mark done'}
      >
        {task.done && (
          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span className={`flex-1 text-sm leading-relaxed ${task.done ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>
        {task.text}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
        aria-label="Delete task"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
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
        className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add task
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2">
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Task description"
        className="w-full bg-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <div className="flex gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 bg-zinc-800 text-zinc-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_META[c].label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 disabled:opacity-40 transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setText('') }}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs hover:bg-zinc-700 transition-colors"
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
      if (data.length === 0) {
        data = await seedPrep(job.id)
      }
      setTasks(data)
    } catch {
      toast.error('Failed to load prep checklist')
    } finally {
      setLoading(false)
    }
  }, [job.id])

  useEffect(() => { load() }, [load])

  // Close on Escape
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

  const handleAdded = (task) => {
    setTasks((prev) => [...prev, task])
  }

  const done = tasks.filter((t) => t.done).length
  const total = tasks.length

  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = tasks.filter((t) => t.category === cat)
    return acc
  }, {})

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-800 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-zinc-800 shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="h-4 w-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75a2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">Interview Prep</span>
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
            className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors mt-0.5"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress */}
        {!loading && total > 0 && (
          <div className="px-6 py-3 border-b border-zinc-800 shrink-0">
            <ProgressBar done={done} total={total} />
          </div>
        )}

        {/* Tasks */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-6 rounded bg-zinc-800 shimmer" />
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
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${meta.dot}`} />
                      <span className={`text-xs font-semibold uppercase tracking-wider ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <ul className="space-y-0 divide-y divide-zinc-800/50">
                      {catTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                        />
                      ))}
                    </ul>
                  </div>
                )
              })}

              {/* Tasks with unknown category */}
              {tasks.filter((t) => !CATEGORIES.includes(t.category)).map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}

              <AddTaskRow jobId={job.id} onAdded={handleAdded} />
            </div>
          )}
        </div>

        {/* Footer */}
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
