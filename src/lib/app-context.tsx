'use client'

import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { AppState, Task, Session, TimerSettings, AppSettings, AmbientSound, Subtask, Distraction } from './types'

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
  theme: 'dark',
  zenMode: false,
  soundEnabled: true,
  notificationsEnabled: true,
  weeklyGoalHours: 10,
}

const defaultStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalSessions: 0,
  totalMinutes: 0,
  lastStudyDate: null,
}

const initialState: AppState = {
  tasks: [],
  sessions: [],
  timerSettings: defaultTimerSettings,
  appSettings: defaultAppSettings,
  stats: defaultStats,
  activeTaskId: null,
  currentAmbientSound: 'none',
}

type Action =
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'ADD_SUBTASK'; payload: { taskId: string; subtask: Subtask } }
  | { type: 'TOGGLE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'DELETE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'ADD_TIME_TO_TASK'; payload: { taskId: string; minutes: number } }
  | { type: 'ADD_SESSION'; payload: Session }
  | { type: 'ADD_DISTRACTION'; payload: { sessionId: string; distraction: Distraction } }
  | { type: 'UPDATE_TIMER_SETTINGS'; payload: Partial<TimerSettings> }
  | { type: 'UPDATE_APP_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_ACTIVE_TASK'; payload: string | null }
  | { type: 'SET_AMBIENT_SOUND'; payload: AmbientSound }
  | { type: 'UPDATE_STATS'; payload: { minutes: number; date: string } }

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t),
      }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
        activeTaskId: state.activeTaskId === action.payload ? null : state.activeTaskId,
      }
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload ? { ...t, completed: !t.completed } : t
        ),
      }
    case 'ADD_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, subtasks: [...t.subtasks, action.payload.subtask] }
            : t
        ),
      }
    case 'TOGGLE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? {
                ...t,
                subtasks: t.subtasks.map(s =>
                  s.id === action.payload.subtaskId
                    ? { ...s, completed: !s.completed }
                    : s
                ),
              }
            : t
        ),
      }
    case 'DELETE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, subtasks: t.subtasks.filter(s => s.id !== action.payload.subtaskId) }
            : t
        ),
      }
    case 'ADD_TIME_TO_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, actualMinutes: t.actualMinutes + action.payload.minutes }
            : t
        ),
      }
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] }
    case 'ADD_DISTRACTION':
      return {
        ...state,
        sessions: state.sessions.map(s =>
          s.id === action.payload.sessionId
            ? { ...s, distractions: [...s.distractions, action.payload.distraction] }
            : s
        ),
      }
    case 'UPDATE_TIMER_SETTINGS':
      return { ...state, timerSettings: { ...state.timerSettings, ...action.payload } }
    case 'UPDATE_APP_SETTINGS':
      return { ...state, appSettings: { ...state.appSettings, ...action.payload } }
    case 'SET_ACTIVE_TASK':
      return { ...state, activeTaskId: action.payload }
    case 'SET_AMBIENT_SOUND':
      return { ...state, currentAmbientSound: action.payload }
    case 'UPDATE_STATS': {
      const today = action.payload.date.split('T')[0]
      const lastDate = state.stats.lastStudyDate
      let newStreak = state.stats.currentStreak
      
      if (lastDate) {
        const lastDateObj = new Date(lastDate)
        const todayObj = new Date(today)
        const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 0) {
          // Same day, streak unchanged
        } else if (diffDays === 1) {
          newStreak += 1
        } else {
          newStreak = 1
        }
      } else {
        newStreak = 1
      }
      
      return {
        ...state,
        stats: {
          ...state.stats,
          currentStreak: newStreak,
          longestStreak: Math.max(state.stats.longestStreak, newStreak),
          totalSessions: state.stats.totalSessions + 1,
          totalMinutes: state.stats.totalMinutes + action.payload.minutes,
          lastStudyDate: today,
        },
      }
    }
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pomodoro-app-state')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        dispatch({ type: 'LOAD_STATE', payload: { ...initialState, ...parsed } })
      } catch (e) {
        console.error('Failed to parse saved state', e)
      }
    }
  }, [])

  // Save to localStorage on state change
  useEffect(() => {
    localStorage.setItem('pomodoro-app-state', JSON.stringify(state))
  }, [state])

  // Apply theme
  useEffect(() => {
    const root = document.documentElement
    if (state.appSettings.theme === 'dark') {
      root.classList.add('dark')
    } else if (state.appSettings.theme === 'light') {
      root.classList.remove('dark')
    } else {
      // system
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
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
