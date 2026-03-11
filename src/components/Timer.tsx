import { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, SkipForward, RotateCcw, Zap } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { formatTime, cn } from '@/lib/utils'
import type { TimerStatus } from '@/types'

const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAQXl9/Xp2YLGprf1p9fDSGm5tahUwInuPnoqkEDM9H9/6IfCUzq//KTBAhl//7OYwBP////swA5////4QAc/////wAA////AgDm////JgDD////VwCg////jgB8////xgBX////AAEy////QgEL////iAHk/v//0AHC/v//GwKf/v//aQJ7/v//uAJX/v//CgMy/v//XgMM/v//tAPl/f//DAW+/f//ZgWW/f//wQVu/f//HQZl/f//eQZc/f//1QZT/f//MQdK/f//jgdB/f//6gc4/f//RggP/f//ogj1/P///wjs/P//XQnj/P//uwna/P//GQrR/P//dwrI/P//1grP/P//NQvW/P//lAvd/P//8wsF/f//UwwN/f//swwV/f//Ew0d/f//cw0l/f//0w0d/f//Mw4V/f//kw4N/f//8w4F/f//Uw/9/P//sw/1/P//ExDt/P//cxDl/P//0xDd/P//MxHV/P//kxHN/P//8xHF/P//UxK9/f//sxK1/f//ExOt/f//cxOl/f//0xOd/f//MxSV/f//kxSN/f//8xSF/f//UxV9/f//sxV1/f//ExZt/f//cxZl/f//0xZd/f//MxdV/f//kxdN/f//8xdF/f//UxjN/f//sxjV/f//Exnd/f//cxnl/f//0xnt/f//Mxr1/f//kxr9/f//8xoF/v//Uxvm/f//sxve/f//Exzm/f//cxzu/f//0xz2/f//MR3+/f//kR0G/v//8R0O/v//UR4W/v//sR4e/v//ER8m/v//cR8u/v//0R82/v//MiA+/v//kiDG/v//8iBG/v//UiHO/v//siHW/v//EiLe/v//ciLm/v//0iLu/v//MiP2/v//kiP+/v//8iMG//8/'

interface TimerProps {
  onSessionComplete: (duration: number) => void
  currentSessionId: string | null
}

export default function Timer({ onSessionComplete, currentSessionId }: TimerProps) {
  const { state, dispatch } = useApp()
  const { settings, currentTaskId, tasks } = state
  
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60)
  const [totalTime, setTotalTime] = useState(settings.focusDuration * 60)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<number | null>(null)

  const currentTask = tasks.find(t => t.id === currentTaskId)

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0
  const circumference = 2 * Math.PI * 140

  const playSound = useCallback(() => {
    if (settings.soundEnabled) {
      if (!audioRef.current) {
        audioRef.current = new Audio(NOTIFICATION_SOUND)
      }
      audioRef.current.play().catch(() => {})
    }
    if (settings.notificationsEnabled && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
          body: status === 'focus' ? 'Focus session complete! Time for a break.' : 'Break is over! Ready to focus?',
          icon: '/vite.svg'
        })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission()
      }
    }
  }, [settings.soundEnabled, settings.notificationsEnabled, status])

  const handleComplete = useCallback(() => {
    playSound()
    
    if (status === 'focus') {
      const duration = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : totalTime
      onSessionComplete(duration)
      
      if (currentTaskId) {
        dispatch({
          type: 'ADD_TIME_TO_TASK',
          payload: { taskId: currentTaskId, minutes: Math.floor(duration / 60) }
        })
      }
      
      const newCompleted = completedSessions + 1
      setCompletedSessions(newCompleted)
      
      if (!settings.flowMode) {
        if (newCompleted % settings.sessionsUntilLongBreak === 0) {
          setStatus('longBreak')
          setTimeLeft(settings.longBreakDuration * 60)
          setTotalTime(settings.longBreakDuration * 60)
        } else {
          setStatus('shortBreak')
          setTimeLeft(settings.shortBreakDuration * 60)
          setTotalTime(settings.shortBreakDuration * 60)
        }
      } else {
        setTimeLeft(settings.focusDuration * 60)
        setTotalTime(settings.focusDuration * 60)
        setSessionStartTime(Date.now())
      }
    } else {
      setStatus('idle')
      setTimeLeft(settings.focusDuration * 60)
      setTotalTime(settings.focusDuration * 60)
    }
  }, [status, completedSessions, settings, playSound, onSessionComplete, currentTaskId, dispatch, sessionStartTime, totalTime])

  useEffect(() => {
    if (status !== 'idle' && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete()
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
  }, [status, handleComplete, timeLeft])

  const startFocus = () => {
    setStatus('focus')
    setTimeLeft(settings.focusDuration * 60)
    setTotalTime(settings.focusDuration * 60)
    setSessionStartTime(Date.now())
  }

  const togglePause = () => {
    if (status === 'idle') {
      startFocus()
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    } else {
      // Resume - will be handled by useEffect
      setStatus(status)
    }
  }

  const skipBreak = () => {
    if (status === 'shortBreak' || status === 'longBreak') {
      setStatus('idle')
      setTimeLeft(settings.focusDuration * 60)
      setTotalTime(settings.focusDuration * 60)
    }
  }

  const reset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setStatus('idle')
    setTimeLeft(settings.focusDuration * 60)
    setTotalTime(settings.focusDuration * 60)
    setSessionStartTime(null)
  }

  const toggleFlowMode = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { flowMode: !settings.flowMode } })
  }

  const getStatusColor = () => {
    switch (status) {
      case 'focus': return 'stroke-primary'
      case 'shortBreak': return 'stroke-accent'
      case 'longBreak': return 'stroke-chart-3'
      default: return 'stroke-muted'
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'focus': return 'Focus Time'
      case 'shortBreak': return 'Short Break'
      case 'longBreak': return 'Long Break'
      default: return 'Ready to Focus'
    }
  }

  return (
    <div className={cn(
      "flex flex-col items-center gap-6 p-8 rounded-2xl",
      settings.zenMode ? "bg-transparent" : "bg-card"
    )}>
      {/* Progress Ring */}
      <div className="relative w-80 h-80">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
          {/* Background circle */}
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            strokeWidth="8"
            className="stroke-muted"
          />
          {/* Progress circle */}
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn("transition-all duration-300", getStatusColor())}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
          />
        </svg>
        
        {/* Timer display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground mb-2">
            {getStatusLabel()}
          </span>
          <span className="text-6xl font-mono font-bold text-foreground tracking-tight">
            {formatTime(timeLeft)}
          </span>
          {currentTask && !settings.zenMode && (
            <span className="mt-3 px-3 py-1 bg-secondary rounded-full text-sm text-secondary-foreground">
              {currentTask.title}
            </span>
          )}
          {!settings.zenMode && (
            <span className="mt-2 text-xs text-muted-foreground">
              Session {completedSessions + 1}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="p-3 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
          title="Reset (R)"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        
        <button
          onClick={togglePause}
          className="p-5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-lg shadow-primary/25"
          title={status === 'idle' ? 'Start (Space)' : 'Pause (Space)'}
        >
          {status === 'idle' || !intervalRef.current ? (
            <Play className="w-8 h-8 ml-1" />
          ) : (
            <Pause className="w-8 h-8" />
          )}
        </button>
        
        {(status === 'shortBreak' || status === 'longBreak') && (
          <button
            onClick={skipBreak}
            className="p-3 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            title="Skip Break (S)"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        )}
        
        <button
          onClick={toggleFlowMode}
          className={cn(
            "p-3 rounded-full transition-colors",
            settings.flowMode 
              ? "bg-accent text-accent-foreground" 
              : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          )}
          title="Flow Mode (F)"
        >
          <Zap className="w-5 h-5" />
        </button>
      </div>

      {/* Flow mode indicator */}
      {settings.flowMode && !settings.zenMode && (
        <div className="flex items-center gap-2 text-sm text-accent">
          <Zap className="w-4 h-4" />
          <span>Flow Mode Active - No break prompts</span>
        </div>
      )}

      {/* Session summary */}
      {!settings.zenMode && currentSessionId && status === 'focus' && (
        <div className="mt-2 text-center">
          <p className="text-sm text-muted-foreground">
            Elapsed: {formatTime(totalTime - timeLeft)}
          </p>
        </div>
      )}
    </div>
  )
}
