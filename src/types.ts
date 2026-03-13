export type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

export interface TimerSettings {
  focusDuration: number // minutes
  shortBreakDuration: number // minutes
  longBreakDuration: number // minutes
  longBreakInterval: number // sessions before long break
  autoStartBreaks: boolean
  autoStartFocus: boolean
  flowMode: boolean // no break prompts
}

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
  estimatedTime: number // minutes
  actualTime: number // minutes
  subtasks: Subtask[]
  completed: boolean
  createdAt: string
}

export interface Distraction {
  id: string
  timestamp: string
  note: string
}

export interface FocusSession {
  id: string
  startTime: string
  endTime: string
  duration: number // seconds
  taskId: string | null
  subject: string
  distractions: Distraction[]
  completed: boolean
}

export interface DailyStats {
  date: string
  totalFocusTime: number // minutes
  sessionsCompleted: number
  subjectBreakdown: Record<string, number> // subject -> minutes
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  zenMode: boolean
  weeklyGoal: number // hours
  notificationsEnabled: boolean
  soundEnabled: boolean
}

export interface PersonalBests {
  longestSession: number // minutes
  mostSessionsInDay: number
  longestStreak: number // days
}

export interface AppState {
  timerSettings: TimerSettings
  appSettings: AppSettings
  tasks: Task[]
  sessions: FocusSession[]
  dailyStats: Record<string, DailyStats>
  personalBests: PersonalBests
  currentStreak: number
  lastStudyDate: string | null
}
