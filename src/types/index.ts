export interface Task {
  id: string
  title: string
  subject: string
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  estimatedMinutes: number
  actualMinutes: number
  completed: boolean
  subtasks: Subtask[]
  createdAt: number
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface FocusSession {
  id: string
  taskId: string | null
  taskTitle: string
  subject: string
  duration: number // in seconds
  timestamp: number
  distractions: Distraction[]
}

export interface Distraction {
  id: string
  note: string
  timestamp: number
}

export interface Settings {
  focusDuration: number // minutes
  shortBreakDuration: number // minutes
  longBreakDuration: number // minutes
  sessionsUntilLongBreak: number
  flowMode: boolean
  darkMode: boolean
  zenMode: boolean
  soundEnabled: boolean
  notificationsEnabled: boolean
  weeklyGoalHours: number
}

export interface AppState {
  tasks: Task[]
  sessions: FocusSession[]
  settings: Settings
  currentTaskId: string | null
}

export type TimerStatus = 'idle' | 'focus' | 'shortBreak' | 'longBreak'

export type AmbientSound = 'none' | 'rain' | 'lofi' | 'cafe' | 'forest' | 'ocean'

export const SUBJECTS = [
  'Mathematics',
  'Science',
  'History',
  'Languages',
  'Programming',
  'Writing',
  'Reading',
  'Art',
  'Music',
  'Other'
] as const

export const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  flowMode: false,
  darkMode: true,
  zenMode: false,
  soundEnabled: true,
  notificationsEnabled: true,
  weeklyGoalHours: 10
}
