import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { clamp, formatDuration, minutesToSeconds, uid } from '../utils/helpers'
import { SectionCard } from './SectionCard'

const modeMeta = {
  focus: { label: 'Focus', tone: 'text-cyan-600 dark:text-cyan-300' },
  shortBreak: { label: 'Short Break', tone: 'text-emerald-600 dark:text-emerald-300' },
  longBreak: { label: 'Long Break', tone: 'text-indigo-600 dark:text-indigo-300' },
}

const drawAlarm = () => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()

  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.45)

  gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.05)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.55)

  oscillator.connect(gainNode)
  gainNode.connect(audioCtx.destination)
  oscillator.start()
  oscillator.stop(audioCtx.currentTime + 0.6)
}

export const Timer = () => {
  const { state, dispatch } = useAppContext()
  const { settings, tasks } = state

  const [mode, setMode] = useState('focus')
  const [isRunning, setIsRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(minutesToSeconds(settings.focusMinutes))
  const [focusCycles, setFocusCycles] = useState(0)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [subject, setSubject] = useState('General')

  const activeSessionRef = useRef({ startTime: null, distractions: [] })

  const modeDurations = useMemo(
    () => ({
      focus: minutesToSeconds(settings.focusMinutes),
      shortBreak: minutesToSeconds(settings.shortBreakMinutes),
      longBreak: minutesToSeconds(settings.longBreakMinutes),
    }),
    [settings.focusMinutes, settings.longBreakMinutes, settings.shortBreakMinutes],
  )

  const currentTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId),
    [selectedTaskId, tasks],
  )

  useEffect(() => {
    if (currentTask?.subject) {
      setSubject(currentTask.subject)
    }
  }, [currentTask])

  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(modeDurations[mode])
    }
  }, [isRunning, mode, modeDurations])

  const notify = useCallback(
    (title, body) => {
      if (settings.notificationsEnabled && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body })
        }
      }
      if (settings.alarmEnabled) {
        drawAlarm()
      }
    },
    [settings.alarmEnabled, settings.notificationsEnabled],
  )

  const finalizeFocusSession = useCallback(
    (finished = true) => {
      const configuredSeconds = modeDurations.focus
      const elapsedSeconds = clamp(configuredSeconds - secondsLeft, 0, configuredSeconds)
      const totalSeconds = finished ? configuredSeconds : elapsedSeconds

      if (totalSeconds < 60) {
        activeSessionRef.current = { startTime: null, distractions: [] }
        return
      }

      const endTime = new Date()
      const startTime =
        activeSessionRef.current.startTime ||
        new Date(endTime.getTime() - totalSeconds * 1000).toISOString()

      dispatch({
        type: 'ADD_SESSION',
        payload: {
          id: uid(),
          startTime,
          endTime: endTime.toISOString(),
          durationMinutes: Math.round(totalSeconds / 60),
          taskId: selectedTaskId || null,
          taskTitle: currentTask?.title || null,
          subject: subject || currentTask?.subject || 'General',
          distractions: activeSessionRef.current.distractions,
          mode: 'focus',
        },
      })

      activeSessionRef.current = { startTime: null, distractions: [] }
    },
    [currentTask?.subject, currentTask?.title, dispatch, modeDurations.focus, secondsLeft, selectedTaskId, subject],
  )

  const handleCycleEnd = useCallback(
    (manualSkip = false) => {
      setIsRunning(false)

      if (mode === 'focus') {
        finalizeFocusSession(!manualSkip)
        notify('Focus Session Ended', 'Time for your next step.')

        if (settings.flowMode) {
          setMode('focus')
          setSecondsLeft(modeDurations.focus)
          setIsRunning(true)
          return
        }

        const nextFocusCycle = focusCycles + 1
        setFocusCycles(nextFocusCycle)
        const useLongBreak = nextFocusCycle % Math.max(1, settings.breakRatio) === 0
        const nextMode = useLongBreak ? 'longBreak' : 'shortBreak'
        const shouldBreak =
          manualSkip ||
          window.confirm(
            `${useLongBreak ? 'Long' : 'Short'} break is ready. Start break now?`,
          )

        setMode(shouldBreak ? nextMode : 'focus')
        setSecondsLeft(shouldBreak ? modeDurations[nextMode] : modeDurations.focus)
        return
      }

      notify('Break Complete', 'Ready for another deep work block?')
      const backToFocus =
        manualSkip || window.confirm('Break finished. Start your next focus session?')
      setMode('focus')
      setSecondsLeft(modeDurations.focus)
      if (backToFocus) {
        setIsRunning(true)
      }
    },
    [
      finalizeFocusSession,
      focusCycles,
      mode,
      modeDurations,
      notify,
      settings.breakRatio,
      settings.flowMode,
    ],
  )

  useEffect(() => {
    if (!isRunning) {
      return undefined
    }

    const id = window.setInterval(() => {
      setSecondsLeft((prev) => prev - 1)
    }, 1000)

    return () => window.clearInterval(id)
  }, [isRunning])

  useEffect(() => {
    if (secondsLeft <= 0 && isRunning) {
      handleCycleEnd(false)
    }
  }, [handleCycleEnd, isRunning, secondsLeft])

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return
      }

      if (event.code === 'Space') {
        event.preventDefault()
        if (!isRunning && mode === 'focus' && !activeSessionRef.current.startTime) {
          activeSessionRef.current.startTime = new Date().toISOString()
        }
        setIsRunning((prev) => !prev)
      }
      if (event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (mode === 'focus') {
          finalizeFocusSession(false)
        }
        setIsRunning(false)
        setSecondsLeft(modeDurations[mode])
      }
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault()
        handleCycleEnd(true)
      }
      if (event.key.toLowerCase() === 'x') {
        event.preventDefault()
        if (mode === 'focus') {
          finalizeFocusSession(false)
        }
        setIsRunning(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [finalizeFocusSession, handleCycleEnd, isRunning, mode, modeDurations])

  const onStartPause = () => {
    if (!isRunning && mode === 'focus' && !activeSessionRef.current.startTime) {
      activeSessionRef.current.startTime = new Date().toISOString()
    }
    setIsRunning((prev) => !prev)
  }

  const onStop = () => {
    if (mode === 'focus') {
      finalizeFocusSession(false)
    }
    setIsRunning(false)
    setSecondsLeft(modeDurations[mode])
  }

  const onSkip = () => {
    handleCycleEnd(true)
  }

  const addDistraction = () => {
    if (mode !== 'focus') {
      return
    }
    const note = window.prompt('What distracted you?')
    if (!note) {
      return
    }
    activeSessionRef.current.distractions = [
      ...activeSessionRef.current.distractions,
      {
        id: uid(),
        createdAt: new Date().toISOString(),
        note,
      },
    ]
  }

  const progress =
    1 -
    clamp(secondsLeft / Math.max(1, modeDurations[mode]), 0, 1)
  const radius = 115
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <SectionCard
      title="Focus Timer"
      subtitle="Custom cycles, break ratio reminders, and flow mode for uninterrupted deep work."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative grid h-72 w-72 place-items-center">
            <svg className="h-72 w-72 -rotate-90" viewBox="0 0 260 260" role="presentation">
              <circle cx="130" cy="130" r={radius} className="fill-none stroke-slate-200 stroke-[16] dark:stroke-slate-800" />
              <circle
                cx="130"
                cy="130"
                r={radius}
                className="fill-none stroke-cyan-500 stroke-[16] transition-all"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: offset,
                }}
              />
            </svg>
            <div className="absolute text-center">
              <p className={`text-sm uppercase tracking-[0.2em] ${modeMeta[mode].tone}`}>
                {modeMeta[mode].label}
              </p>
              <p className="font-mono text-5xl font-semibold text-slate-900 dark:text-slate-100">
                {formatDuration(secondsLeft)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg bg-cyan-600 px-4 py-2 text-white" onClick={onStartPause}>
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700"
              onClick={onSkip}
            >
              Skip
            </button>
            <button
              className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700"
              onClick={onStop}
            >
              Stop
            </button>
            <button
              className="rounded-lg border border-amber-300 px-4 py-2 text-amber-700 dark:border-amber-700 dark:text-amber-300"
              onClick={addDistraction}
              disabled={mode !== 'focus'}
            >
              Log Distraction
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Shortcuts: `Space` start/pause, `N` skip, `S` stop & reset, `X` stop
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm">
            Active task
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={selectedTaskId}
              onChange={(event) => setSelectedTaskId(event.target.value)}
            >
              <option value="">No linked task</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Subject tag
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950">
            <p>Focus: {settings.focusMinutes}m</p>
            <p>Short break: {settings.shortBreakMinutes}m</p>
            <p>Long break: {settings.longBreakMinutes}m</p>
            <p>Long break every {settings.breakRatio} focus sessions</p>
            <p>Flow mode: {settings.flowMode ? 'On' : 'Off'}</p>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
