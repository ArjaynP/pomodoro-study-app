import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import { type AppState, type Task, type FocusSession, type Settings, DEFAULT_SETTINGS } from '@/types'
import { generateId } from '@/lib/utils'

type Action =
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'actualMinutes' | 'completed' | 'createdAt'> }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'TOGGLE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'ADD_SESSION'; payload: Omit<FocusSession, 'id'> }
  | { type: 'ADD_DISTRACTION'; payload: { sessionId: string; note: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'SET_CURRENT_TASK'; payload: string | null }
  | { type: 'ADD_TIME_TO_TASK'; payload: { taskId: string; minutes: number } }
  | { type: 'LOAD_STATE'; payload: AppState }

const initialState: AppState = {
  tasks: [],
  sessions: [],
  settings: DEFAULT_SETTINGS,
  currentTaskId: null
}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [
          ...state.tasks,
          {
            ...action.payload,
            id: generateId(),
            actualMinutes: 0,
            completed: false,
            createdAt: Date.now()
          }
        ]
      }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t)
      }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
        currentTaskId: state.currentTaskId === action.payload ? null : state.currentTaskId
      }
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => 
          t.id === action.payload ? { ...t, completed: !t.completed } : t
        )
      }
    case 'TOGGLE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(t => 
          t.id === action.payload.taskId 
            ? {
                ...t,
                subtasks: t.subtasks.map(s => 
                  s.id === action.payload.subtaskId ? { ...s, completed: !s.completed } : s
                )
              }
            : t
        )
      }
    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [...state.sessions, { ...action.payload, id: generateId() }]
      }
    case 'ADD_DISTRACTION':
      return {
        ...state,
        sessions: state.sessions.map(s => 
          s.id === action.payload.sessionId
            ? {
                ...s,
                distractions: [
                  ...s.distractions,
                  { id: generateId(), note: action.payload.note, timestamp: Date.now() }
                ]
              }
            : s
        )
      }
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      }
    case 'SET_CURRENT_TASK':
      return {
        ...state,
        currentTaskId: action.payload
      }
    case 'ADD_TIME_TO_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => 
          t.id === action.payload.taskId
            ? { ...t, actualMinutes: t.actualMinutes + action.payload.minutes }
            : t
        )
      }
    case 'LOAD_STATE':
      return action.payload
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
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pomodoro-app-state')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        dispatch({ type: 'LOAD_STATE', payload: { ...initialState, ...parsed } })
      } catch {
        console.error('Failed to load state from localStorage')
      }
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoro-app-state', JSON.stringify(state))
  }, [state])

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('light', !state.settings.darkMode)
  }, [state.settings.darkMode])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
