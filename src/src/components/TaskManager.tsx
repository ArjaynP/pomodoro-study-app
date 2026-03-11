import { useState } from 'react'
import { 
  Plus, Check, Trash2, Clock, Calendar, 
  ChevronDown, ChevronRight, Target, AlertCircle
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { cn, generateId, formatDuration } from '@/lib/utils'
import { SUBJECTS, type Task, type Subtask } from '@/types'
import { format } from 'date-fns'

export default function TaskManager() {
  const { state, dispatch } = useApp()
  const { tasks, currentTaskId } = state
  
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const [formData, setFormData] = useState({
    title: '',
    subject: SUBJECTS[0],
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    estimatedMinutes: 60,
    subtasks: [] as Subtask[]
  })
  const [newSubtask, setNewSubtask] = useState('')

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const resetForm = () => {
    setFormData({
      title: '',
      subject: SUBJECTS[0],
      priority: 'medium',
      dueDate: '',
      estimatedMinutes: 60,
      subtasks: []
    })
    setNewSubtask('')
    setEditingTask(null)
    setShowForm(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    if (editingTask) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          ...editingTask,
          ...formData,
          dueDate: formData.dueDate || null
        }
      })
    } else {
      dispatch({
        type: 'ADD_TASK',
        payload: {
          ...formData,
          dueDate: formData.dueDate || null
        }
      })
    }
    resetForm()
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      subject: task.subject,
      priority: task.priority,
      dueDate: task.dueDate || '',
      estimatedMinutes: task.estimatedMinutes,
      subtasks: task.subtasks
    })
    setShowForm(true)
  }

  const addSubtask = () => {
    if (!newSubtask.trim()) return
    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: generateId(), title: newSubtask, completed: false }]
    }))
    setNewSubtask('')
  }

  const removeSubtask = (id: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(s => s.id !== id)
    }))
  }

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive bg-destructive/10'
      case 'medium': return 'text-warning bg-warning/10'
      case 'low': return 'text-accent bg-accent/10'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  return (
    <div className="bg-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Tasks</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize",
              filter === f 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-secondary/50 rounded-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
              placeholder="What do you need to study?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Subject</label>
              <select
                value={formData.subject}
                onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
              >
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as Task['priority'] }))}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Estimated Time (min)</label>
              <input
                type="number"
                min="5"
                step="5"
                value={formData.estimatedMinutes}
                onChange={e => setFormData(prev => ({ ...prev, estimatedMinutes: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
              />
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Subtasks</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                placeholder="Add a subtask"
              />
              <button
                type="button"
                onClick={addSubtask}
                className="px-3 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {formData.subtasks.length > 0 && (
              <ul className="space-y-1">
                {formData.subtasks.map(st => (
                  <li key={st.id} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="flex-1">{st.title}</span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(st.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No tasks yet. Create one to get started!
          </p>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className={cn(
                "p-4 rounded-xl border transition-all",
                task.completed 
                  ? "bg-muted/30 border-border/50" 
                  : "bg-secondary/30 border-border hover:border-primary/50",
                currentTaskId === task.id && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_TASK', payload: task.id })}
                  className={cn(
                    "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    task.completed 
                      ? "bg-success border-success text-success-foreground" 
                      : "border-muted-foreground hover:border-primary"
                  )}
                >
                  {task.completed && <Check className="w-3 h-3" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={cn(
                      "font-medium",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      getPriorityColor(task.priority)
                    )}>
                      {task.priority}
                    </span>
                    <span className="px-2 py-0.5 bg-chart-3/20 text-chart-3 rounded-full text-xs">
                      {task.subject}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(task.actualMinutes)} / {formatDuration(task.estimatedMinutes)}
                    </span>
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    )}
                    {task.subtasks.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" />
                        {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {task.estimatedMinutes > 0 && (
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          task.actualMinutes > task.estimatedMinutes 
                            ? "bg-destructive" 
                            : "bg-primary"
                        )}
                        style={{ 
                          width: `${Math.min((task.actualMinutes / task.estimatedMinutes) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  )}

                  {/* Subtasks */}
                  {task.subtasks.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleExpanded(task.id)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                      >
                        {expandedTasks.has(task.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        Subtasks
                      </button>
                      {expandedTasks.has(task.id) && (
                        <ul className="mt-2 ml-4 space-y-1">
                          {task.subtasks.map(st => (
                            <li key={st.id} className="flex items-center gap-2">
                              <button
                                onClick={() => dispatch({
                                  type: 'TOGGLE_SUBTASK',
                                  payload: { taskId: task.id, subtaskId: st.id }
                                })}
                                className={cn(
                                  "w-4 h-4 rounded border flex items-center justify-center",
                                  st.completed 
                                    ? "bg-success border-success" 
                                    : "border-muted-foreground"
                                )}
                              >
                                {st.completed && <Check className="w-2.5 h-2.5 text-success-foreground" />}
                              </button>
                              <span className={cn(
                                "text-sm",
                                st.completed && "line-through text-muted-foreground"
                              )}>
                                {st.title}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {!task.completed && (
                    <button
                      onClick={() => dispatch({ type: 'SET_CURRENT_TASK', payload: task.id })}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        currentTaskId === task.id 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                      title="Set as current task"
                    >
                      <Target className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(task)}
                    className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'DELETE_TASK', payload: task.id })}
                    className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
