import { useMemo, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { formatDuration, uid } from '../utils/helpers'
import { SectionCard } from './SectionCard'

const emptyTaskForm = {
  title: '',
  subject: 'General',
  priority: 'Medium',
  dueDate: '',
  estimatedMinutes: 60,
  subtasks: '',
}

const priorityClass = {
  High: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  Low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
}

export const TaskManager = () => {
  const { state, dispatch } = useAppContext()
  const [form, setForm] = useState(emptyTaskForm)

  const sortedTasks = useMemo(
    () =>
      [...state.tasks].sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1
        }
        return new Date(a.createdAt) < new Date(b.createdAt) ? 1 : -1
      }),
    [state.tasks],
  )

  const addTask = (event) => {
    event.preventDefault()
    if (!form.title.trim()) {
      return
    }

    const subtasks = form.subtasks
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((text) => ({
        id: uid(),
        text,
        done: false,
      }))

    dispatch({
      type: 'ADD_TASK',
      payload: {
        id: uid(),
        title: form.title.trim(),
        subject: form.subject.trim() || 'General',
        priority: form.priority,
        dueDate: form.dueDate,
        estimatedMinutes: Number(form.estimatedMinutes),
        actualMinutes: 0,
        subtasks,
        completed: false,
        createdAt: new Date().toISOString(),
      },
    })

    setForm(emptyTaskForm)
  }

  return (
    <SectionCard
      title="Task Manager"
      subtitle="Plan work with categories, priorities, due dates, and checklist subtasks."
    >
      <form className="grid gap-3 md:grid-cols-2" onSubmit={addTask}>
        <input
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950"
          placeholder="Task title"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
        />
        <input
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950"
          placeholder="Subject / Category"
          value={form.subject}
          onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
        />
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950"
          value={form.priority}
          onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
        >
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <input
          type="date"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950"
          value={form.dueDate}
          onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
        />
        <input
          type="number"
          min={5}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950"
          placeholder="Estimated time (minutes)"
          value={form.estimatedMinutes}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, estimatedMinutes: event.target.value }))
          }
        />
        <input
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950"
          placeholder="Subtasks, comma separated"
          value={form.subtasks}
          onChange={(event) => setForm((prev) => ({ ...prev, subtasks: event.target.value }))}
        />
        <button
          type="submit"
          className="md:col-span-2 rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white transition hover:bg-cyan-500"
        >
          Add Task
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {sortedTasks.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks yet. Add your first study task above.</p>
        ) : (
          sortedTasks.map((task) => (
            <article
              key={task.id}
              className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/80"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3
                    className={`font-semibold text-slate-900 dark:text-slate-100 ${
                      task.completed ? 'line-through opacity-60' : ''
                    }`}
                  >
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {task.subject} {task.dueDate ? `• Due ${task.dueDate}` : ''}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${priorityClass[task.priority]}`}>
                  {task.priority}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                Estimated: {formatDuration(task.estimatedMinutes * 60)} • Actual:{' '}
                {formatDuration(task.actualMinutes * 60)}
              </p>

              {task.subtasks.length > 0 ? (
                <div className="mt-2 grid gap-1">
                  {task.subtasks.map((subtask) => (
                    <label key={subtask.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={subtask.done}
                        onChange={() =>
                          dispatch({
                            type: 'TOGGLE_SUBTASK',
                            payload: { taskId: task.id, subtaskId: subtask.id },
                          })
                        }
                      />
                      <span className={subtask.done ? 'line-through opacity-60' : ''}>{subtask.text}</span>
                    </label>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 flex gap-2">
                <button
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700"
                  onClick={() => dispatch({ type: 'TOGGLE_TASK_COMPLETE', payload: task.id })}
                >
                  {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
                <button
                  className="rounded-md border border-rose-300 px-2 py-1 text-xs text-rose-600 dark:border-rose-600/70"
                  onClick={() => dispatch({ type: 'DELETE_TASK', payload: task.id })}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </SectionCard>
  )
}
