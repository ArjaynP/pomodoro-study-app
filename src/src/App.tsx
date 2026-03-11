import { useState, useCallback } from 'react'
import { 
  Clock, ListTodo, BarChart3, Settings as SettingsIcon, 
  Menu, X
} from 'lucide-react'
import { AppProvider, useApp } from '@/context/AppContext'
import Timer from '@/components/Timer'
import TaskManager from '@/components/TaskManager'
import SessionLog from '@/components/SessionLog'
import SessionSummary from '@/components/SessionSummary'
import Analytics from '@/components/Analytics'
import Settings from '@/components/Settings'
import AmbientPlayer from '@/components/AmbientPlayer'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { cn } from '@/lib/utils'
import type { FocusSession } from '@/types'

type Tab = 'timer' | 'tasks' | 'analytics' | 'settings'

function AppContent() {
  const { state, dispatch } = useApp()
  const { settings, currentTaskId, tasks } = state
  
  const [activeTab, setActiveTab] = useState<Tab>('timer')
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [completedSession, setCompletedSession] = useState<FocusSession | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const currentTask = tasks.find(t => t.id === currentTaskId)

  const handleSessionComplete = useCallback((duration: number) => {
    const session: Omit<FocusSession, 'id'> = {
      taskId: currentTaskId,
      taskTitle: currentTask?.title || '',
      subject: currentTask?.subject || 'General',
      duration,
      timestamp: Date.now(),
      distractions: currentSessionId 
        ? state.sessions.find(s => s.id === currentSessionId)?.distractions || []
        : []
    }

    dispatch({ type: 'ADD_SESSION', payload: session })
    
    // Show summary
    const newSession = { ...session, id: 'temp' } as FocusSession
    setCompletedSession(newSession)
    setCurrentSessionId(null)
  }, [currentTaskId, currentTask, currentSessionId, state.sessions, dispatch])

  const handleAddDistraction = useCallback((note: string) => {
    if (currentSessionId) {
      dispatch({
        type: 'ADD_DISTRACTION',
        payload: { sessionId: currentSessionId, note }
      })
    }
  }, [currentSessionId, dispatch])

  const startSession = useCallback(() => {
    const session: Omit<FocusSession, 'id'> = {
      taskId: currentTaskId,
      taskTitle: currentTask?.title || '',
      subject: currentTask?.subject || 'General',
      duration: 0,
      timestamp: Date.now(),
      distractions: []
    }
    dispatch({ type: 'ADD_SESSION', payload: session })
    // Get the new session ID
    setTimeout(() => {
      const sessions = JSON.parse(localStorage.getItem('pomodoro-app-state') || '{}').sessions || []
      if (sessions.length > 0) {
        setCurrentSessionId(sessions[sessions.length - 1].id)
      }
    }, 100)
  }, [currentTaskId, currentTask, dispatch])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleZenMode: () => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: { zenMode: !settings.zenMode } })
    },
    onToggleFlowMode: () => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: { flowMode: !settings.flowMode } })
    }
  })

  const tabs = [
    { id: 'timer' as const, label: 'Timer', icon: Clock },
    { id: 'tasks' as const, label: 'Tasks', icon: ListTodo },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as const, label: 'Settings', icon: SettingsIcon }
  ]

  if (settings.zenMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Timer 
            onSessionComplete={handleSessionComplete}
            currentSessionId={currentSessionId}
          />
          <button
            onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { zenMode: false } })}
            className="mt-6 mx-auto block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Exit Zen Mode (Z)
          </button>
        </div>
        
        {completedSession && (
          <SessionSummary 
            session={completedSession} 
            onClose={() => setCompletedSession(null)} 
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Pomodoro</h1>
              <p className="text-xs text-muted-foreground">Study Timer</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border p-4 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setMobileMenuOpen(false)
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'timer' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Timer 
                onSessionComplete={handleSessionComplete}
                currentSessionId={currentSessionId}
              />
              <AmbientPlayer />
            </div>
            <div>
              <SessionLog 
                currentSessionId={currentSessionId}
                onAddDistraction={handleAddDistraction}
              />
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <TaskManager />
        )}

        {activeTab === 'analytics' && (
          <Analytics />
        )}

        {activeTab === 'settings' && (
          <Settings />
        )}
      </main>

      {/* Session Summary Modal */}
      {completedSession && (
        <SessionSummary 
          session={completedSession} 
          onClose={() => setCompletedSession(null)} 
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
