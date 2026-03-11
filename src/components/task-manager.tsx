'use client'

import { useState } from 'react'
import { useApp } from '@/lib/app-context'
import type { Task, Subtask } from '@/lib/types'
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
  Tag,
  Target,
  X,
} from 'lucide-react'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

const SUBJECTS = ['Math', 'Science', 'English', 'History', 'Art', 'Programming', 'Other']
const PRIORITIES: { value: Task['priority']; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'high', label: 'High', color: 'bg-rose-500/20 text-rose-400' },
]

export function TaskManager() {
  const { state, dispatch } = useApp()
  const { tasks, activeTaskId } = state
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [newSubtaskText, setNewSubtaskText] = useState<Record<string, string>>({})
  
  // Form state
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [dueDate, setDueDate] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState(30)

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    
    const newTask: Task = {
      id: generateId(),
      title: title.trim(),
      subject,
      priority,
      dueDate: dueDate || null,
      estimatedMinutes,
      actualMinutes: 0,
      subtasks: [],
      completed: false,
      createdAt: new Date().toISOString(),
    }
    
    dispatch({ type: 'ADD_TASK', payload: newTask })
    setTitle('')
    setSubject(SUBJECTS[0])
    setPriority('medium')
    setDueDate('')
    setEstimatedMinutes(30)
    setShowAddForm(false)
  }

  const toggleExpand = (taskId: string) => {
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

  const addSubtask = (taskId: string) => {
    const text = newSubtaskText[taskId]?.trim()
    if (!text) return
    
    const subtask: Subtask = {
      id: generateId(),
      title: text,
      completed: false,
    }
    
    dispatch({ type: 'ADD_SUBTASK', payload: { taskId, subtask } })
    setNewSubtaskText(prev => ({ ...prev, [taskId]: '' }))
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const activeTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <form onSubmit={handleAddTask} className="bg-secondary rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">New Task</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="p-1 hover:bg-secondary-foreground/10 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task title..."
            className="w-full px-3 py-2 bg-background border border-border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Task['priority'])}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Est. Time (min)</label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(parseInt(e.target.value) || 0)}
                min={1}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Add Task
          </button>
        </form>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tasks yet</p>
            <p className="text-sm">Add a task to get started</p>
          </div>
        ) : (
          <>
            {/* Active Tasks */}
            <div className="space-y-2 mb-4">
              {activeTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isActive={task.id === activeTaskId}
                  isExpanded={expandedTasks.has(task.id)}
                  onToggleExpand={() => toggleExpand(task.id)}
                  onToggleComplete={() => dispatch({ type: 'TOGGLE_TASK', payload: task.id })}
                  onDelete={() => dispatch({ type: 'DELETE_TASK', payload: task.id })}
                  onSetActive={() => dispatch({ type: 'SET_ACTIVE_TASK', payload: task.id === activeTaskId ? null : task.id })}
                  onToggleSubtask={(subtaskId) => dispatch({ type: 'TOGGLE_SUBTASK', payload: { taskId: task.id, subtaskId } })}
                  onDeleteSubtask={(subtaskId) => dispatch({ type: 'DELETE_SUBTASK', payload: { taskId: task.id, subtaskId } })}
                  newSubtaskText={newSubtaskText[task.id] || ''}
                  onNewSubtaskTextChange={(text) => setNewSubtaskText(prev => ({ ...prev, [task.id]: text }))}
                  onAddSubtask={() => addSubtask(task.id)}
                  formatTime={formatTime}
                />
              ))}
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Completed ({completedTasks.length})
                </h3>
                <div className="space-y-2">
                  {completedTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      isActive={false}
                      isExpanded={expandedTasks.has(task.id)}
                      onToggleExpand={() => toggleExpand(task.id)}
                      onToggleComplete={() => dispatch({ type: 'TOGGLE_TASK', payload: task.id })}
                      onDelete={() => dispatch({ type: 'DELETE_TASK', payload: task.id })}
                      onSetActive={() => {}}
                      onToggleSubtask={(subtaskId) => dispatch({ type: 'TOGGLE_SUBTASK', payload: { taskId: task.id, subtaskId } })}
                      onDeleteSubtask={(subtaskId) => dispatch({ type: 'DELETE_SUBTASK', payload: { taskId: task.id, subtaskId } })}
                      newSubtaskText={newSubtaskText[task.id] || ''}
                      onNewSubtaskTextChange={(text) => setNewSubtaskText(prev => ({ ...prev, [task.id]: text }))}
                      onAddSubtask={() => addSubtask(task.id)}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface TaskItemProps {
  task: Task
  isActive: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onToggleComplete: () => void
  onDelete: () => void
  onSetActive: () => void
  onToggleSubtask: (subtaskId: string) => void
  onDeleteSubtask: (subtaskId: string) => void
  newSubtaskText: string
  onNewSubtaskTextChange: (text: string) => void
  onAddSubtask: () => void
  formatTime: (minutes: number) => string
}

function TaskItem({
  task,
  isActive,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onDelete,
  onSetActive,
  onToggleSubtask,
  onDeleteSubtask,
  newSubtaskText,
  onNewSubtaskTextChange,
  onAddSubtask,
  formatTime,
}: TaskItemProps) {
  const priorityColor = PRIORITIES.find(p => p.value === task.priority)?.color || ''
  const completedSubtasks = task.subtasks.filter(s => s.completed).length
  const totalSubtasks = task.subtasks.length
  
  return (
    <div
      className={`bg-secondary rounded-xl overflow-hidden transition-colors ${
        isActive ? 'ring-2 ring-emerald-500' : ''
      } ${task.completed ? 'opacity-60' : ''}`}
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          <button
            onClick={onToggleComplete}
            className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                {task.title}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-secondary-foreground/10">
                <Tag className="w-3 h-3 inline mr-1" />
                {task.subject}
              </span>
              <span className={`px-2 py-0.5 rounded-full ${priorityColor}`}>
                {task.priority}
              </span>
              {task.dueDate && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(task.actualMinutes)} / {formatTime(task.estimatedMinutes)}
              </span>
              {totalSubtasks > 0 && (
                <span>
                  {completedSubtasks}/{totalSubtasks} subtasks
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {!task.completed && (
              <button
                onClick={onSetActive}
                className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-secondary-foreground/10 hover:bg-secondary-foreground/20'
                }`}
              >
                {isActive ? 'Active' : 'Focus'}
              </button>
            )}
            <button
              onClick={onToggleExpand}
              className="p-1 hover:bg-secondary-foreground/10 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onDelete}
              className="p-1 hover:bg-destructive/20 hover:text-destructive rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Expanded Section - Subtasks */}
      {isExpanded && (
        <div className="border-t border-border px-3 py-2 bg-background/50">
          <div className="space-y-2">
            {task.subtasks.map(subtask => (
              <div key={subtask.id} className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => onToggleSubtask(subtask.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {subtask.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
                <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                  {subtask.title}
                </span>
                <button
                  onClick={() => onDeleteSubtask(subtask.id)}
                  className="ml-auto p-1 hover:bg-destructive/20 hover:text-destructive rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={e => onNewSubtaskTextChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onAddSubtask()
                  }
                }}
                placeholder="Add subtask..."
                className="flex-1 px-2 py-1 text-sm bg-transparent border-b border-border focus:outline-none focus:border-ring"
              />
              <button
                onClick={onAddSubtask}
                className="p-1 hover:bg-secondary-foreground/10 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
