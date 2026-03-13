import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { TimerMode, FocusSession, Task } from '../types'
import { cn, formatTime, generateId, playNotificationSound, sendNotification } from '../lib/utils'

interface TimerProps {
  selectedTask: Task | null
  onSessionComplete: (session: FocusSession) => void
  onAddDistraction: () => void
}

export default function Timer({ selectedTask, onSessionComplete, onAddDistraction }: TimerProps) {
  const { state: { timerSettings, appSettings } } = useApp()
  
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(timerSettings.focusDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [distractions, setDistractions] = useState<{ id: string; timestamp: string; note: string }[]>([])
  
  const intervalRef = useRef<number | null>(null)

  const getDuration = useCallback((timerMode: TimerMode) => {
    switch (timerMode) {
      case 'focus':
        return timerSettings.focusDuration * 60
      case 'shortBreak':
        return timerSettings.shortBreakDuration * 60
      case 'longBreak':
        return timerSettings.longBreakDuration * 60
    }
  }, [timerSettings])

  const totalTime = getDuration(mode)
  const progress = ((totalTime - timeLeft) / totalTime) * 100
  const circumference = 2 * Math.PI * 45

  // Reset timer when settings change
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(getDuration(mode))
    }
  }, [timerSettings, mode, isRunning, getDuration])

  const handleTimerComplete = useCallback(() => {
    if (appSettings.soundEnabled) {
      playNotificationSound()
    }
    
    if (appSettings.notificationsEnabled) {
      const message = mode === 'focus' 
        ? 'Great work! Time for a break.' 
        : 'Break is over. Ready to focus?'
      sendNotification('FocusFlow', message)
    }

    if (mode === 'focus') {
      // Complete the focus session
      const session: FocusSession = {
        id: generateId(),
        startTime: sessionStartTime?.toISOString() || new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: totalTime,
        taskId: selectedTask?.id || null,
        subject: selectedTask?.subject || 'General',
        distractions,
        completed: true,
      }
      onSessionComplete(session)
      setDistractions([])
      
      const newSessionsCompleted = sessionsCompleted + 1
      setSessionsCompleted(newSessionsCompleted)
      
      if (!timerSettings.flowMode) {
        // Determine next break type
        const nextMode = newSessionsCompleted % timerSettings.longBreakInterval === 0 
          ? 'longBreak' 
          : 'shortBreak'
        setMode(nextMode)
        setTimeLeft(getDuration(nextMode))
        
        if (timerSettings.autoStartBreaks) {
          setIsRunning(true)
          setSessionStartTime(new Date())
        } else {
          setIsRunning(false)
        }
      } else {
        // Flow mode - just restart focus
        setTimeLeft(getDuration('focus'))
        if (timerSettings.autoStartFocus) {
          setSessionStartTime(new Date())
        } else {
          setIsRunning(false)
        }
      }
    } else {
      // Break complete
      setMode('focus')
      setTimeLeft(getDuration('focus'))
      
      if (timerSettings.autoStartFocus) {
        setIsRunning(true)
        setSessionStartTime(new Date())
      } else {
        setIsRunning(false)
      }
    }
  }, [mode, sessionsCompleted, timerSettings, appSettings, selectedTask, sessionStartTime, totalTime, distractions, onSessionComplete, getDuration])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  useEffect(() => {
    if (timeLeft === 0 && !isRunning) {
      handleTimerComplete()
    }
  }, [timeLeft, isRunning, handleTimerComplete])

  const toggleTimer = () => {
    if (!isRunning && mode === 'focus' && !sessionStartTime) {
      setSessionStartTime(new Date())
    }
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(getDuration(mode))
    setSessionStartTime(null)
    setDistractions([])
  }

  const skipToNext = () => {
    if (mode === 'focus' && sessionStartTime) {
      // Save partial session
      const elapsed = totalTime - timeLeft
      if (elapsed > 60) {
        const session: FocusSession = {
          id: generateId(),
          startTime: sessionStartTime.toISOString(),
          endTime: new Date().toISOString(),
          duration: elapsed,
          taskId: selectedTask?.id || null,
          subject: selectedTask?.subject || 'General',
          distractions,
          completed: false,
        }
        onSessionComplete(session)
      }
    }
    
    setIsRunning(false)
    setDistractions([])
    setSessionStartTime(null)
    
    if (mode === 'focus') {
      const nextMode = (sessionsCompleted + 1) % timerSettings.longBreakInterval === 0 
        ? 'longBreak' 
        : 'shortBreak'
      setMode(nextMode)
      setTimeLeft(getDuration(nextMode))
    } else {
      setMode('focus')
      setTimeLeft(getDuration('focus'))
    }
  }

  const handleAddDistraction = () => {
    const note = prompt('What distracted you?')
    if (note) {
      setDistractions(prev => [...prev, {
        id: generateId(),
        timestamp: new Date().toISOString(),
        note,
      }])
    }
    onAddDistraction()
  }

  const switchMode = (newMode: TimerMode) => {
    if (isRunning) return
    setMode(newMode)
    setTimeLeft(getDuration(newMode))
    setSessionStartTime(null)
  }

  const getModeColor = () => {
    switch (mode) {
      case 'focus':
        return 'text-primary'
      case 'shortBreak':
        return 'text-accent'
      case 'longBreak':
        return 'text-success'
    }
  }

  const getModeStroke = () => {
    switch (mode) {
      case 'focus':
        return 'stroke-primary'
      case 'shortBreak':
        return 'stroke-accent'
      case 'longBreak':
        return 'stroke-success'
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Mode Selector */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => switchMode('focus')}
          disabled={isRunning}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            mode === 'focus'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            isRunning && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Brain className="w-4 h-4" />
          Focus
        </button>
        <button
          onClick={() => switchMode('shortBreak')}
          disabled={isRunning}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            mode === 'shortBreak'
              ? 'bg-accent text-accent-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            isRunning && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Coffee className="w-4 h-4" />
          Short Break
        </button>
        <button
          onClick={() => switchMode('longBreak')}
          disabled={isRunning}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            mode === 'longBreak'
              ? 'bg-success text-success-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            isRunning && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Zap className="w-4 h-4" />
          Long Break
        </button>
      </div>

      {/* Timer Display with Progress Ring */}
      <div className={cn('relative w-64 h-64 mb-8', isRunning && mode === 'focus' && 'timer-pulse')}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
            className="stroke-muted"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={cn('progress-ring-circle', getModeStroke())}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: circumference - (progress / 100) * circumference,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-5xl font-mono font-bold', getModeColor())}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm text-muted-foreground mt-2 capitalize">
            {mode === 'shortBreak' ? 'Short Break' : mode === 'longBreak' ? 'Long Break' : 'Focus Time'}
          </span>
          {selectedTask && mode === 'focus' && (
            <span className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
              {selectedTask.title}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={resetTimer}
          className="p-3 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={toggleTimer}
          className={cn(
            'p-5 rounded-full transition-all transform hover:scale-105',
            isRunning
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-primary text-primary-foreground'
          )}
        >
          {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
        </button>
        <button
          onClick={skipToNext}
          className="p-3 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          title="Skip"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Distraction Button (only during focus) */}
      {mode === 'focus' && isRunning && (
        <button
          onClick={handleAddDistraction}
          className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-warning" />
          Log Distraction {distractions.length > 0 && `(${distractions.length})`}
        </button>
      )}

      {/* Session Counter */}
      <div className="mt-4 text-sm text-muted-foreground">
        Sessions today: <span className="font-semibold text-foreground">{sessionsCompleted}</span>
        {timerSettings.flowMode && (
          <span className="ml-2 px-2 py-0.5 bg-accent/20 text-accent rounded text-xs">
            Flow Mode
          </span>
        )}
      </div>
    </div>
  )
}
