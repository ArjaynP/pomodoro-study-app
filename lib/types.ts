export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  subject: string
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  estimatedMinutes: number
  actualMinutes: number
  subtasks: Subtask[]
  completed: boolean
  createdAt: string
}

export interface Session {
  id: string
  taskId: string | null
  taskTitle: string | null
  subject: string | null
  startTime: string
  endTime: string
  duration: number
  distractions: Distraction[]
}

export interface Distraction {
  id: string
  timestamp: string
  note: string
}

export interface TimerSettings {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  longBreakInterval: number
  autoStartBreaks: boolean
  autoStartFocus: boolean
  flowMode: boolean
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  zenMode: boolean
  soundEnabled: boolean
  notificationsEnabled: boolean
  weeklyGoalHours: number
}

export interface Stats {
  currentStreak: number
  longestStreak: number
  totalSessions: number
  totalMinutes: number
  lastStudyDate: string | null
}

export type TimerState = 'idle' | 'running' | 'paused' | 'break'
export type TimerMode = 'focus' | 'shortBreak' | 'longBreak'
export type AmbientSound = 'none' | 'rain' | 'lofi' | 'cafe' | 'forest' | 'waves'

export interface AppState {
  tasks: Task[]
  sessions: Session[]
  timerSettings: TimerSettings
  appSettings: AppSettings
  stats: Stats
  activeTaskId: string | null
  currentAmbientSound: AmbientSound
}
