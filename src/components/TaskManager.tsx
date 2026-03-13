import { useState } from 'react'
import { Plus, Check, Trash2, Clock, Calendar, Flag, ChevronDown, ChevronRight, GripVertical } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Task, Subtask } from '../types'
import { cn, formatDuration, generateId } from '../lib/utils'

interface TaskManagerProps {
  onSelectTask: (task: Task | null) => void
  selectedTask: Task | null
}

const SUBJECTS = ['Math', 'Science', 'English', 'History', 'Programming', 'Art', 'Music', 'Other']
const PRIORITIES: Task['priority'][] = ['low', 'medium', 'high']

export default function TaskManager({ onSelectTask, selectedTask }: TaskManagerProps) {
  const { state, dispatch } = useApp()
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  
  // Form state
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('Other')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [dueDate, setDueDate] = useState('')
  const [estimatedTime, setEstimatedTime] = useState(30)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtask, setNewSubtask] = useState('')

  const filteredTasks = state.tasks.filter(task => {
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Sort by completion, then priority, then due date
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    return 0
  })

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    dispatch({
      type: 'ADD_TASK',
      payload: {
        title: title.trim(),
        subject,
        priority,
        dueDate: dueDate || null,
        estimatedTime,
        subtasks,
      },
    })

    // Reset form
    setTitle('')
    setSubject('Other')
    setPriority('medium')
    setDueDate('')
    setEstimatedTime(30)
    setSubtasks([])
    setShowAddForm(false)
  }

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return
    setSubtasks([...subtasks, { id: generateId(), title: newSubtask.trim(), completed: false }])
    setNewSubtask('')
  }

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const toggleTaskComplete = (task: Task) => {
    dispatch({
      type: 'UPDATE_TASK',
      payload: { id: task.id, updates: { completed: !task.completed } },
    })
  }

  const deleteTask = (taskId: string) => {
    if (selectedTask?.id === taskId) onSelectTask(null)
    dispatch({ type: 'DELETE_TASK', payload: taskId })
  }

  const getPriorityColor = (p: Task['priority']) => {
    switch (p) {
      case 'high': return 'text-destructive'
      case 'medium': return 'text-warning'
      case 'low': return 'text-success'
    }
  }

  const getPriorityBg = (p: Task['priority']) => {
    switch (p) {
      case 'high': return 'bg-destructive/10'
      case 'medium': return 'bg-warning/10'
      case 'low': return 'bg-success/10'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            showAddForm
              ? 'bg-secondary text-secondary-foreground'
              : 'bg-primary text-primary-foreground'
          )}
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1 rounded-md text-sm capitalize transition-colors',
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <form onSubmit={handleAddTask} className="mb-4 p-4 bg-card border border-border rounded-lg">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Task title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            
            <div className="flex gap-2">
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Task['priority'])}
                className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)} Priority</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              
              <div className="flex-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={estimatedTime}
                  onChange={e => setEstimatedTime(parseInt(e.target.value) || 30)}
                  className="w-20 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            </div>

            {/* Subtasks */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Subtasks</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a subtask..."
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                  className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm"
                >
                  Add
                </button>
              </div>
              {subtasks.length > 0 && (
                <ul className="space-y-1">
                  {subtasks.map(st => (
                    <li key={st.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                      {st.title}
                      <button
                        type="button"
                        onClick={() => setSubtasks(subtasks.filter(s => s.id !== st.id))}
                        className="ml-auto text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
              >
                Create Task
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {sortedTasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No tasks yet</p>
            <p className="text-sm">Add a task to get started</p>
          </div>
        ) : (
          sortedTasks.map(task => (
            <div
              key={task.id}
              className={cn(
                'border border-border rounded-lg overflow-hidden transition-all',
                selectedTask?.id === task.id && 'ring-2 ring-primary',
                task.completed && 'opacity-60'
              )}
            >
              <div
                className={cn(
                  'flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/50',
                  getPriorityBg(task.priority)
                )}
                onClick={() => onSelectTask(selectedTask?.id === task.id ? null : task)}
              >
                <button
                  onClick={e => {
                    e.stopPropagation()
                    toggleTaskComplete(task)
                  }}
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                    task.completed
                      ? 'bg-success border-success text-success-foreground'
                      : 'border-muted-foreground hover:border-primary'
                  )}
                >
                  {task.completed && <Check className="w-3 h-3" />}
                </button>
                
                {task.subtasks.length > 0 && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      toggleTaskExpanded(task.id)
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {expandedTasks.has(task.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', task.completed && 'line-through')}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 bg-secondary rounded">{task.subject}</span>
                    <Flag className={cn('w-3 h-3', getPriorityColor(task.priority))} />
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(task.actualTime)} / {formatDuration(task.estimatedTime)}
                  </p>
                  <div className="w-16 h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        task.actualTime > task.estimatedTime ? 'bg-destructive' : 'bg-primary'
                      )}
                      style={{ width: `${Math.min((task.actualTime / task.estimatedTime) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                <button
                  onClick={e => {
                    e.stopPropagation()
                    deleteTask(task.id)
                  }}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
              
              {/* Subtasks */}
              {expandedTasks.has(task.id) && task.subtasks.length > 0 && (
                <div className="px-4 py-2 bg-secondary/30 border-t border-border space-y-1">
                  {task.subtasks.map(subtask => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => dispatch({
                          type: 'TOGGLE_SUBTASK',
                          payload: { taskId: task.id, subtaskId: subtask.id },
                        })}
                        className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                          subtask.completed
                            ? 'bg-success border-success text-success-foreground'
                            : 'border-muted-foreground hover:border-primary'
                        )}
                      >
                        {subtask.completed && <Check className="w-2.5 h-2.5" />}
                      </button>
                      <span className={cn('text-sm', subtask.completed && 'line-through text-muted-foreground')}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
