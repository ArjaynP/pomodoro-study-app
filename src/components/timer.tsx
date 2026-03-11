'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '@/lib/app-context'
import type { TimerState, TimerMode, Session, Distraction } from '@/lib/types'
import { Play, Pause, RotateCcw, SkipForward, AlertCircle } from 'lucide-react'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function Timer() {
  const { state, dispatch } = useApp()
  const { timerSettings, activeTaskId, tasks, appSettings } = state
  
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [timerMode, setTimerMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(timerSettings.focusDuration * 60)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [showDistractionModal, setShowDistractionModal] = useState(false)
  const [distractionNote, setDistractionNote] = useState('')
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const activeTask = tasks.find(t => t.id === activeTaskId)

  const getTotalSeconds = useCallback(() => {
    switch (timerMode) {
      case 'focus':
        return timerSettings.focusDuration * 60
      case 'shortBreak':
        return timerSettings.shortBreakDuration * 60
      case 'longBreak':
        return timerSettings.longBreakDuration * 60
    }
  }, [timerMode, timerSettings])

  const progress = 1 - timeLeft / getTotalSeconds()
  const circumference = 2 * Math.PI * 140
  const strokeDashoffset = circumference * (1 - progress)

  const playSound = useCallback(() => {
    if (appSettings.soundEnabled) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
      }
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }, [appSettings.soundEnabled])

  const sendNotification = useCallback((title: string, body: string) => {
    if (appSettings.notificationsEnabled && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body })
          }
        })
      }
    }
  }, [appSettings.notificationsEnabled])

  const completeSession = useCallback(() => {
    if (timerMode === 'focus' && sessionStartTime && currentSessionId) {
      const endTime = new Date()
      const duration = Math.round((endTime.getTime() - sessionStartTime.getTime()) / 1000 / 60)
      
      const session: Session = {
        id: currentSessionId,
        taskId: activeTaskId,
        taskTitle: activeTask?.title || null,
        subject: activeTask?.subject || null,
        startTime: sessionStartTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        distractions: [],
      }
      
      dispatch({ type: 'ADD_SESSION', payload: session })
      dispatch({ type: 'UPDATE_STATS', payload: { minutes: duration, date: endTime.toISOString() } })
      
      if (activeTaskId) {
        dispatch({ type: 'ADD_TIME_TO_TASK', payload: { taskId: activeTaskId, minutes: duration } })
      }
      
      setSessionsCompleted(prev => prev + 1)
    }
    
    playSound()
    
    if (timerMode === 'focus') {
      if (timerSettings.flowMode) {
        sendNotification('Focus Session Complete', 'Great work! Starting another focus session.')
        setTimeLeft(timerSettings.focusDuration * 60)
        if (timerSettings.autoStartFocus) {
          startNewSession()
        } else {
          setTimerState('idle')
        }
      } else {
        const isLongBreak = (sessionsCompleted + 1) % timerSettings.longBreakInterval === 0
        const nextMode = isLongBreak ? 'longBreak' : 'shortBreak'
        setTimerMode(nextMode)
        setTimeLeft(isLongBreak ? timerSettings.longBreakDuration * 60 : timerSettings.shortBreakDuration * 60)
        sendNotification('Break Time!', isLongBreak ? 'Time for a long break.' : 'Time for a short break.')
        if (timerSettings.autoStartBreaks) {
          setTimerState('running')
        } else {
          setTimerState('idle')
        }
      }
    } else {
      setTimerMode('focus')
      setTimeLeft(timerSettings.focusDuration * 60)
      sendNotification('Break Over', 'Ready to focus again?')
      if (timerSettings.autoStartFocus) {
        startNewSession()
      } else {
        setTimerState('idle')
      }
    }
  }, [timerMode, sessionStartTime, currentSessionId, activeTaskId, activeTask, sessionsCompleted, timerSettings, playSound, sendNotification, dispatch])

  const startNewSession = useCallback(() => {
    const newSessionId = generateId()
    setCurrentSessionId(newSessionId)
    setSessionStartTime(new Date())
    setTimerState('running')
  }, [])

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            completeSession()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerState, completeSession])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          if (timerState === 'running') {
            setTimerState('paused')
          } else if (timerState === 'paused' || timerState === 'idle') {
            if (timerState === 'idle' && timerMode === 'focus') {
              startNewSession()
            } else {
              setTimerState('running')
            }
          }
          break
        case 'KeyR':
          if (e.shiftKey) {
            resetTimer()
          }
          break
        case 'KeyS':
          if (e.shiftKey) {
            skipTimer()
          }
          break
        case 'KeyD':
          if (timerState === 'running' && timerMode === 'focus') {
            setShowDistractionModal(true)
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [timerState, timerMode, startNewSession])

  const resetTimer = () => {
    setTimerState('idle')
    setTimerMode('focus')
    setTimeLeft(timerSettings.focusDuration * 60)
    setCurrentSessionId(null)
    setSessionStartTime(null)
  }

  const skipTimer = () => {
    if (timerMode === 'focus') {
      const isLongBreak = (sessionsCompleted + 1) % timerSettings.longBreakInterval === 0
      setTimerMode(isLongBreak ? 'longBreak' : 'shortBreak')
      setTimeLeft(isLongBreak ? timerSettings.longBreakDuration * 60 : timerSettings.shortBreakDuration * 60)
    } else {
      setTimerMode('focus')
      setTimeLeft(timerSettings.focusDuration * 60)
    }
    setTimerState('idle')
  }

  const handleStart = () => {
    if (timerState === 'idle' && timerMode === 'focus') {
      startNewSession()
    } else {
      setTimerState('running')
    }
  }

  const handlePause = () => {
    setTimerState('paused')
  }

  const logDistraction = () => {
    if (currentSessionId && distractionNote.trim()) {
      const distraction: Distraction = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        note: distractionNote.trim(),
      }
      dispatch({ type: 'ADD_DISTRACTION', payload: { sessionId: currentSessionId, distraction } })
    }
    setDistractionNote('')
    setShowDistractionModal(false)
  }

  const getModeColor = () => {
    switch (timerMode) {
      case 'focus':
        return 'stroke-emerald-500'
      case 'shortBreak':
        return 'stroke-sky-500'
      case 'longBreak':
        return 'stroke-amber-500'
    }
  }

  const getModeLabel = () => {
    switch (timerMode) {
      case 'focus':
        return 'Focus'
      case 'shortBreak':
        return 'Short Break'
      case 'longBreak':
        return 'Long Break'
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Mode Tabs */}
      <div className="flex gap-2 mb-8">
        {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => {
              if (timerState === 'idle') {
                setTimerMode(mode)
                setTimeLeft(
                  mode === 'focus'
                    ? timerSettings.focusDuration * 60
                    : mode === 'shortBreak'
                    ? timerSettings.shortBreakDuration * 60
                    : timerSettings.longBreakDuration * 60
                )
              }
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timerMode === mode
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Short' : 'Long'}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="relative w-80 h-80 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300">
          {/* Background circle */}
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            strokeWidth="8"
            className="stroke-secondary"
          />
          {/* Progress circle */}
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={`${getModeColor()} transition-all duration-300`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground mb-2">
            {getModeLabel()}
          </span>
          <span className="text-6xl font-mono font-bold tracking-tight">
            {formatTime(timeLeft)}
          </span>
          {activeTask && timerMode === 'focus' && (
            <span className="text-sm text-muted-foreground mt-2 max-w-48 truncate text-center">
              {activeTask.title}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={resetTimer}
          className="p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          title="Reset (Shift+R)"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        
        {timerState === 'running' ? (
          <button
            onClick={handlePause}
            className="p-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            title="Pause (Space)"
          >
            <Pause className="w-8 h-8" />
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="p-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            title="Start (Space)"
          >
            <Play className="w-8 h-8 ml-1" />
          </button>
        )}
        
        <button
          onClick={skipTimer}
          className="p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          title="Skip (Shift+S)"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Distraction Button */}
      {timerState === 'running' && timerMode === 'focus' && (
        <button
          onClick={() => setShowDistractionModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          title="Log Distraction (D)"
        >
          <AlertCircle className="w-4 h-4" />
          Log Distraction
        </button>
      )}

      {/* Session Counter */}
      <div className="flex items-center gap-2 mt-4">
        {Array.from({ length: timerSettings.longBreakInterval }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < sessionsCompleted % timerSettings.longBreakInterval
                ? 'bg-emerald-500'
                : 'bg-secondary'
            }`}
          />
        ))}
      </div>

      {/* Distraction Modal */}
      {showDistractionModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Log Distraction</h3>
            <textarea
              value={distractionNote}
              onChange={e => setDistractionNote(e.target.value)}
              placeholder="What distracted you?"
              className="w-full h-24 px-3 py-2 bg-secondary border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setDistractionNote('')
                  setShowDistractionModal(false)
                }}
                className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={logDistraction}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
              >
                Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
