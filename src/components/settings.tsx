'use client'

import { useApp } from '@/lib/app-context'
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  Volume2,
  Zap,
  Download,
  Timer,
  Coffee,
} from 'lucide-react'

export function Settings() {
  const { state, dispatch } = useApp()
  const { timerSettings, appSettings, sessions } = state

  const exportToCSV = () => {
    if (sessions.length === 0) {
      alert('No sessions to export')
      return
    }

    const headers = [
      'Session ID',
      'Task',
      'Subject',
      'Start Time',
      'End Time',
      'Duration (min)',
      'Distractions',
    ]

    const rows = sessions.map(s => [
      s.id,
      s.taskTitle || 'Free Focus',
      s.subject || '',
      s.startTime,
      s.endTime,
      s.duration.toString(),
      s.distractions.length.toString(),
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pomodoro-sessions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>

      {/* Timer Settings */}
      <div className="bg-secondary rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">Timer</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Focus Duration (minutes)
            </label>
            <input
              type="number"
              value={timerSettings.focusDuration}
              onChange={e =>
                dispatch({
                  type: 'UPDATE_TIMER_SETTINGS',
                  payload: { focusDuration: parseInt(e.target.value) || 25 },
                })
              }
              min={1}
              max={120}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Short Break (min)
              </label>
              <input
                type="number"
                value={timerSettings.shortBreakDuration}
                onChange={e =>
                  dispatch({
                    type: 'UPDATE_TIMER_SETTINGS',
                    payload: { shortBreakDuration: parseInt(e.target.value) || 5 },
                  })
                }
                min={1}
                max={30}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Long Break (min)
              </label>
              <input
                type="number"
                value={timerSettings.longBreakDuration}
                onChange={e =>
                  dispatch({
                    type: 'UPDATE_TIMER_SETTINGS',
                    payload: { longBreakDuration: parseInt(e.target.value) || 15 },
                  })
                }
                min={1}
                max={60}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Long Break After (sessions)
            </label>
            <input
              type="number"
              value={timerSettings.longBreakInterval}
              onChange={e =>
                dispatch({
                  type: 'UPDATE_TIMER_SETTINGS',
                  payload: { longBreakInterval: parseInt(e.target.value) || 4 },
                })
              }
              min={2}
              max={10}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Auto-start Breaks</span>
              <button
                onClick={() =>
                  dispatch({
                    type: 'UPDATE_TIMER_SETTINGS',
                    payload: { autoStartBreaks: !timerSettings.autoStartBreaks },
                  })
                }
                className={`w-11 h-6 rounded-full transition-colors ${
                  timerSettings.autoStartBreaks ? 'bg-emerald-500' : 'bg-muted'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    timerSettings.autoStartBreaks ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Auto-start Focus</span>
              <button
                onClick={() =>
                  dispatch({
                    type: 'UPDATE_TIMER_SETTINGS',
                    payload: { autoStartFocus: !timerSettings.autoStartFocus },
                  })
                }
                className={`w-11 h-6 rounded-full transition-colors ${
                  timerSettings.autoStartFocus ? 'bg-emerald-500' : 'bg-muted'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    timerSettings.autoStartFocus ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm">Flow Mode</span>
              </div>
              <button
                onClick={() =>
                  dispatch({
                    type: 'UPDATE_TIMER_SETTINGS',
                    payload: { flowMode: !timerSettings.flowMode },
                  })
                }
                className={`w-11 h-6 rounded-full transition-colors ${
                  timerSettings.flowMode ? 'bg-emerald-500' : 'bg-muted'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    timerSettings.flowMode ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
            {timerSettings.flowMode && (
              <p className="text-xs text-muted-foreground pl-6">
                No break prompts - continuous focus sessions
              </p>
            )}
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-secondary rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Coffee className="w-4 h-4 text-sky-400" />
          <span className="font-medium">Preferences</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Theme</label>
            <div className="flex gap-2">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() =>
                    dispatch({
                      type: 'UPDATE_APP_SETTINGS',
                      payload: { theme: value as 'light' | 'dark' | 'system' },
                    })
                  }
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    appSettings.theme === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-background/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Weekly Goal (hours)
            </label>
            <input
              type="number"
              value={appSettings.weeklyGoalHours}
              onChange={e =>
                dispatch({
                  type: 'UPDATE_APP_SETTINGS',
                  payload: { weeklyGoalHours: parseInt(e.target.value) || 10 },
                })
              }
              min={1}
              max={100}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <span className="text-sm">Sound Effects</span>
              </div>
              <button
                onClick={() =>
                  dispatch({
                    type: 'UPDATE_APP_SETTINGS',
                    payload: { soundEnabled: !appSettings.soundEnabled },
                  })
                }
                className={`w-11 h-6 rounded-full transition-colors ${
                  appSettings.soundEnabled ? 'bg-emerald-500' : 'bg-muted'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    appSettings.soundEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="text-sm">Notifications</span>
              </div>
              <button
                onClick={() =>
                  dispatch({
                    type: 'UPDATE_APP_SETTINGS',
                    payload: { notificationsEnabled: !appSettings.notificationsEnabled },
                  })
                }
                className={`w-11 h-6 rounded-full transition-colors ${
                  appSettings.notificationsEnabled ? 'bg-emerald-500' : 'bg-muted'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    appSettings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm">Zen Mode</span>
              </div>
              <button
                onClick={() =>
                  dispatch({
                    type: 'UPDATE_APP_SETTINGS',
                    payload: { zenMode: !appSettings.zenMode },
                  })
                }
                className={`w-11 h-6 rounded-full transition-colors ${
                  appSettings.zenMode ? 'bg-emerald-500' : 'bg-muted'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    appSettings.zenMode ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="bg-secondary rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">Export Data</span>
        </div>

        <button
          onClick={exportToCSV}
          className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Export Sessions as CSV
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Download all your session data for backup or analysis
        </p>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-secondary rounded-xl p-4">
        <h3 className="font-medium mb-3">Keyboard Shortcuts</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Start/Pause Timer</span>
            <kbd className="px-2 py-1 bg-background rounded text-xs">Space</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Reset Timer</span>
            <kbd className="px-2 py-1 bg-background rounded text-xs">Shift + R</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Skip Timer</span>
            <kbd className="px-2 py-1 bg-background rounded text-xs">Shift + S</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Log Distraction</span>
            <kbd className="px-2 py-1 bg-background rounded text-xs">D</kbd>
          </div>
        </div>
      </div>
    </div>
  )
}
