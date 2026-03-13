import { useState, useEffect, useCallback } from 'react'
import { Clock, ListTodo, BarChart3, History, Settings as SettingsIcon, X } from 'lucide-react'
import { AppProvider, useApp } from './context/AppContext'
import Timer from './components/Timer'
import TaskManager from './components/TaskManager'
import SessionLog, { SessionSummary } from './components/SessionLog'
import Analytics from './components/Analytics'
import Settings from './components/Settings'
import AmbientPlayer from './components/AmbientPlayer'
import type { Task, FocusSession } from './types'
import { cn, requestNotificationPermission } from './lib/utils'

type Tab = 'timer' | 'tasks' | 'sessions' | 'analytics' | 'settings'

function AppContent() {
  const { state, dispatch } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>('timer')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [completedSession, setCompletedSession] = useState<FocusSession | null>(null)

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key.toLowerCase()) {
        case 'z':
          dispatch({ type: 'UPDATE_APP_SETTINGS', payload: { zenMode: !state.appSettings.zenMode } })
          break
        case '1':
          setActiveTab('timer')
          break
        case '2':
          setActiveTab('tasks')
          break
        case '3':
          setActiveTab('sessions')
          break
        case '4':
          setActiveTab('analytics')
          break
        case '5':
          setActiveTab('settings')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.appSettings.zenMode, dispatch])

  const handleSessionComplete = useCallback((session: FocusSession) => {
    dispatch({ type: 'ADD_SESSION', payload: session })
    dispatch({ type: 'UPDATE_STREAK' })
    
    if (session.taskId) {
      const durationMinutes = Math.floor(session.duration / 60)
      dispatch({ type: 'UPDATE_TASK_TIME', payload: { taskId: session.taskId, minutes: durationMinutes } })
    }
    
    setCompletedSession(session)
  }, [dispatch])

  const handleAddDistraction = useCallback(() => {
    // Distraction tracking is handled in the Timer component
  }, [])

  const tabs: { id: Tab; icon: typeof Clock; label: string }[] = [
    { id: 'timer', icon: Clock, label: 'Timer' },
    { id: 'tasks', icon: ListTodo, label: 'Tasks' },
    { id: 'sessions', icon: History, label: 'Sessions' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ]

  const isZenMode = state.appSettings.zenMode

  return (
    <div className={cn('min-h-screen transition-all duration-500', isZenMode && 'zen-mode')}>
      {/* Session Summary Modal */}
      {completedSession && (
        <SessionSummary 
          session={completedSession} 
          onClose={() => setCompletedSession(null)} 
        />
      )}

      <div className={cn(
        'flex flex-col lg:flex-row min-h-screen',
        isZenMode && 'justify-center items-center'
      )}>
        {/* Sidebar - Hidden in Zen Mode */}
        {!isZenMode && (
          <aside className="w-full lg:w-64 bg-card border-b lg:border-b-0 lg:border-r border-border">
            <div className="p-4 lg:p-6">
              <h1 className="text-xl font-bold tracking-tight mb-1">FocusFlow</h1>
              <p className="text-sm text-muted-foreground">Stay focused, achieve more</p>
            </div>
            
            {/* Navigation */}
            <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible px-2 lg:px-4 pb-2 lg:pb-0 gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all whitespace-nowrap',
                      'text-sm font-medium',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden lg:inline">{tab.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Selected Task Indicator */}
            {selectedTask && (
              <div className="hidden lg:block mx-4 mt-6 p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Active Task</span>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm font-medium truncate">{selectedTask.title}</p>
                <span className="text-xs px-1.5 py-0.5 bg-secondary rounded mt-1 inline-block">
                  {selectedTask.subject}
                </span>
              </div>
            )}

            {/* Streak Display */}
            <div className="hidden lg:block mx-4 mt-6 p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-lg font-bold">{state.currentStreak} day streak</p>
                  <p className="text-xs text-muted-foreground">Keep it going!</p>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={cn(
          'flex-1 p-4 lg:p-8',
          isZenMode && 'flex items-center justify-center'
        )}>
          {isZenMode ? (
            <div className="text-center">
              <Timer
                selectedTask={selectedTask}
                onSessionComplete={handleSessionComplete}
                onAddDistraction={handleAddDistraction}
              />
              <button
                onClick={() => dispatch({ type: 'UPDATE_APP_SETTINGS', payload: { zenMode: false } })}
                className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Press Z to exit Zen Mode
              </button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {activeTab === 'timer' && (
                <div className="flex flex-col items-center py-8">
                  <Timer
                    selectedTask={selectedTask}
                    onSessionComplete={handleSessionComplete}
                    onAddDistraction={handleAddDistraction}
                  />
                </div>
              )}
              
              {activeTab === 'tasks' && (
                <TaskManager
                  selectedTask={selectedTask}
                  onSelectTask={setSelectedTask}
                />
              )}
              
              {activeTab === 'sessions' && <SessionLog />}
              
              {activeTab === 'analytics' && <Analytics />}
              
              {activeTab === 'settings' && <Settings />}
            </div>
          )}
        </main>
      </div>

      {/* Ambient Player */}
      {!isZenMode && <AmbientPlayer />}
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
