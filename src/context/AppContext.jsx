import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { getStreak } from '../utils/analytics'

const STORAGE_KEY = 'pomodoro-study-app-v1'

const defaultSettings = {
  focusMinutes: 45,
  shortBreakMinutes: 8,
  longBreakMinutes: 20,
  breakRatio: 4,
  flowMode: false,
  darkMode: true,
  zenMode: false,
  weeklyGoalHours: 10,
  notificationsEnabled: true,
  alarmEnabled: true,
  ambientVolume: 30,
  ambientTrack: 'rain',
}

const initialState = {
  tasks: [],
  sessions: [],
  settings: defaultSettings,
  streak: 0,
  lastSessionSummary: null,
}

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return initialState
    }
    const parsed = JSON.parse(raw)
    return {
      ...initialState,
      ...parsed,
      settings: {
        ...defaultSettings,
        ...(parsed.settings || {}),
      },
      streak: getStreak(parsed.sessions || []),
    }
  } catch {
    return initialState
  }
}

const mapTaskTime = (tasks, sessions) => {
  const totals = {}
  sessions.forEach((session) => {
    if (!session.taskId) return
    totals[session.taskId] = (totals[session.taskId] || 0) + session.durationMinutes
  })

  return tasks.map((task) => ({
    ...task,
    actualMinutes: totals[task.id] || 0,
  }))
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TASK': {
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
      }
    }
    case 'UPDATE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id ? { ...task, ...action.payload } : task,
        ),
      }
    }
    case 'DELETE_TASK': {
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
      }
    }
    case 'TOGGLE_TASK_COMPLETE': {
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload
            ? {
                ...task,
                completed: !task.completed,
              }
            : task,
        ),
      }
    }
    case 'TOGGLE_SUBTASK': {
      const { taskId, subtaskId } = action.payload
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks.map((subtask) =>
                  subtask.id === subtaskId
                    ? {
                        ...subtask,
                        done: !subtask.done,
                      }
                    : subtask,
                ),
              }
            : task,
        ),
      }
    }
    case 'ADD_SESSION': {
      const sessions = [action.payload, ...state.sessions]
      return {
        ...state,
        sessions,
        tasks: mapTaskTime(state.tasks, sessions),
        streak: getStreak(sessions),
        lastSessionSummary: action.payload,
      }
    }
    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      }
    }
    case 'CLEAR_LAST_SUMMARY': {
      return {
        ...state,
        lastSessionSummary: null,
      }
    }
    default:
      return state
  }
}

const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState, loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useAppContext = () => {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return ctx
}
