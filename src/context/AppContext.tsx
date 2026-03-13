import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { AppState, Task, FocusSession, TimerSettings, AppSettings, DailyStats } from '../types'
import { generateId, getDateKey } from '../lib/utils'

const STORAGE_KEY = 'focusflow-data'

const defaultTimerSettings: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  flowMode: false,
}

const defaultAppSettings: AppSettings = {
  theme: 'system',
  zenMode: false,
  weeklyGoal: 10,
  notificationsEnabled: true,
  soundEnabled: true,
}

const defaultState: AppState = {
  timerSettings: defaultTimerSettings,
  appSettings: defaultAppSettings,
  tasks: [],
  sessions: [],
  dailyStats: {},
  personalBests: {
    longestSession: 0,
    mostSessionsInDay: 0,
    longestStreak: 0,
  },
  currentStreak: 0,
  lastStudyDate: null,
}

type Action =
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'UPDATE_TIMER_SETTINGS'; payload: Partial<TimerSettings> }
  | { type: 'UPDATE_APP_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'actualTime' | 'completed' | 'createdAt'> }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'ADD_SESSION'; payload: FocusSession }
  | { type: 'UPDATE_TASK_TIME'; payload: { taskId: string; minutes: number } }
  | { type: 'UPDATE_STREAK' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload

    case 'UPDATE_TIMER_SETTINGS':
      return {
        ...state,
        timerSettings: { ...state.timerSettings, ...action.payload },
      }

    case 'UPDATE_APP_SETTINGS':
      return {
        ...state,
        appSettings: { ...state.appSettings, ...action.payload },
      }

    case 'ADD_TASK':
      return {
        ...state,
        tasks: [
          ...state.tasks,
          {
            ...action.payload,
            id: generateId(),
            actualTime: 0,
            completed: false,
            createdAt: new Date().toISOString(),
          },
        ],
      }

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates }
            : task
        ),
      }

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      }

    case 'TOGGLE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {
                ...task,
                subtasks: task.subtasks.map(subtask =>
                  subtask.id === action.payload.subtaskId
                    ? { ...subtask, completed: !subtask.completed }
                    : subtask
                ),
              }
            : task
        ),
      }

    case 'ADD_SESSION': {
      const session = action.payload
      const dateKey = getDateKey(new Date(session.startTime))
      const durationMinutes = Math.floor(session.duration / 60)
      
      const existingStats = state.dailyStats[dateKey] || {
        date: dateKey,
        totalFocusTime: 0,
        sessionsCompleted: 0,
        subjectBreakdown: {},
      }

      const newStats: DailyStats = {
        ...existingStats,
        totalFocusTime: existingStats.totalFocusTime + durationMinutes,
        sessionsCompleted: existingStats.sessionsCompleted + 1,
        subjectBreakdown: {
          ...existingStats.subjectBreakdown,
          [session.subject]: (existingStats.subjectBreakdown[session.subject] || 0) + durationMinutes,
        },
      }

      const newPersonalBests = { ...state.personalBests }
      if (durationMinutes > state.personalBests.longestSession) {
        newPersonalBests.longestSession = durationMinutes
      }
      if (newStats.sessionsCompleted > state.personalBests.mostSessionsInDay) {
        newPersonalBests.mostSessionsInDay = newStats.sessionsCompleted
      }

      return {
        ...state,
        sessions: [...state.sessions, session],
        dailyStats: {
          ...state.dailyStats,
          [dateKey]: newStats,
        },
        personalBests: newPersonalBests,
        lastStudyDate: dateKey,
      }
    }

    case 'UPDATE_TASK_TIME':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? { ...task, actualTime: task.actualTime + action.payload.minutes }
            : task
        ),
      }

    case 'UPDATE_STREAK': {
      const today = getDateKey(new Date())
      const yesterday = getDateKey(new Date(Date.now() - 86400000))
      
      let newStreak = state.currentStreak
      
      if (state.lastStudyDate === today) {
        // Already studied today, no change
      } else if (state.lastStudyDate === yesterday) {
        // Continuing streak
        newStreak = state.currentStreak + 1
      } else if (state.lastStudyDate !== today) {
        // Streak broken or new streak
        newStreak = 1
      }

      const newPersonalBests = { ...state.personalBests }
      if (newStreak > state.personalBests.longestStreak) {
        newPersonalBests.longestStreak = newStreak
      }

      return {
        ...state,
        currentStreak: newStreak,
        personalBests: newPersonalBests,
      }
    }

    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        dispatch({ type: 'LOAD_STATE', payload: { ...defaultState, ...parsed } })
      } catch (e) {
        console.error('Failed to load saved state:', e)
      }
    }
  }, [])

  // Save to localStorage on state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Apply theme
  useEffect(() => {
    const root = document.documentElement
    const theme = state.appSettings.theme
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }, [state.appSettings.theme])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
