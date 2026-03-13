import { useState } from 'react'
import { Moon, Sun, Monitor, Bell, Volume2, Eye, Target, Clock, RotateCcw, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { cn, requestNotificationPermission } from '../lib/utils'

export default function Settings() {
  const { state, dispatch } = useApp()
  const { timerSettings, appSettings } = state
  const [showTimerSettings, setShowTimerSettings] = useState(true)

  const handleTimerSettingChange = (key: keyof typeof timerSettings, value: number | boolean) => {
    dispatch({ type: 'UPDATE_TIMER_SETTINGS', payload: { [key]: value } })
  }

  const handleAppSettingChange = (key: keyof typeof appSettings, value: unknown) => {
    dispatch({ type: 'UPDATE_APP_SETTINGS', payload: { [key]: value } })
    
    if (key === 'notificationsEnabled' && value) {
      requestNotificationPermission()
    }
  }

  const resetToDefaults = () => {
    if (confirm('Reset all settings to defaults?')) {
      dispatch({
        type: 'UPDATE_TIMER_SETTINGS',
        payload: {
          focusDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          longBreakInterval: 4,
          autoStartBreaks: false,
          autoStartFocus: false,
          flowMode: false,
        },
      })
      dispatch({
        type: 'UPDATE_APP_SETTINGS',
        payload: {
          theme: 'system',
          zenMode: false,
          weeklyGoal: 10,
          notificationsEnabled: true,
          soundEnabled: true,
        },
      })
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Settings</h2>
        <button
          onClick={resetToDefaults}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Theme Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Appearance</h3>
        <div className="flex gap-2">
          {[
            { value: 'light', icon: Sun, label: 'Light' },
            { value: 'dark', icon: Moon, label: 'Dark' },
            { value: 'system', icon: Monitor, label: 'System' },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => handleAppSettingChange('theme', value)}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                appSettings.theme === value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <Icon className={cn('w-5 h-5', appSettings.theme === value ? 'text-primary' : 'text-muted-foreground')} />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Timer Settings */}
      <div className="mb-6">
        <button
          onClick={() => setShowTimerSettings(!showTimerSettings)}
          className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground mb-3"
        >
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timer Settings
          </span>
          <ChevronRight className={cn('w-4 h-4 transition-transform', showTimerSettings && 'rotate-90')} />
        </button>
        
        {showTimerSettings && (
          <div className="space-y-4 p-4 bg-card border border-border rounded-lg">
            {/* Duration Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Focus</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={timerSettings.focusDuration}
                    onChange={e => handleTimerSettingChange('focusDuration', parseInt(e.target.value) || 25)}
                    className="w-full px-2 py-1.5 text-center bg-background border border-input rounded-md text-sm"
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground">Short Break</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={timerSettings.shortBreakDuration}
                    onChange={e => handleTimerSettingChange('shortBreakDuration', parseInt(e.target.value) || 5)}
                    className="w-full px-2 py-1.5 text-center bg-background border border-input rounded-md text-sm"
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground">Long Break</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={timerSettings.longBreakDuration}
                    onChange={e => handleTimerSettingChange('longBreakDuration', parseInt(e.target.value) || 15)}
                    className="w-full px-2 py-1.5 text-center bg-background border border-input rounded-md text-sm"
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Long break after</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={timerSettings.longBreakInterval}
                  onChange={e => handleTimerSettingChange('longBreakInterval', parseInt(e.target.value) || 4)}
                  className="w-20 px-2 py-1.5 text-center bg-background border border-input rounded-md text-sm"
                />
                <span className="text-sm text-muted-foreground">sessions</span>
              </div>
            </div>

            {/* Toggle Settings */}
            <div className="space-y-3 pt-2">
              <ToggleRow
                label="Auto-start breaks"
                description="Automatically start break after focus session"
                checked={timerSettings.autoStartBreaks}
                onChange={v => handleTimerSettingChange('autoStartBreaks', v)}
              />
              
              <ToggleRow
                label="Auto-start focus"
                description="Automatically start focus after break"
                checked={timerSettings.autoStartFocus}
                onChange={v => handleTimerSettingChange('autoStartFocus', v)}
              />
              
              <ToggleRow
                label="Flow Mode"
                description="No break prompts, continuous focus sessions"
                checked={timerSettings.flowMode}
                onChange={v => handleTimerSettingChange('flowMode', v)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Notifications & Sound */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifications & Sound
        </h3>
        <div className="space-y-3 p-4 bg-card border border-border rounded-lg">
          <ToggleRow
            label="Browser notifications"
            description="Get notified when timer ends"
            checked={appSettings.notificationsEnabled}
            onChange={v => handleAppSettingChange('notificationsEnabled', v)}
          />
          
          <ToggleRow
            label="Sound effects"
            description="Play sound when timer ends"
            checked={appSettings.soundEnabled}
            onChange={v => handleAppSettingChange('soundEnabled', v)}
          />
        </div>
      </div>

      {/* UI Settings */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Interface
        </h3>
        <div className="space-y-3 p-4 bg-card border border-border rounded-lg">
          <ToggleRow
            label="Zen Mode"
            description="Minimal UI for distraction-free focus"
            checked={appSettings.zenMode}
            onChange={v => handleAppSettingChange('zenMode', v)}
          />
        </div>
      </div>

      {/* Weekly Goal */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Goals
        </h3>
        <div className="p-4 bg-card border border-border rounded-lg">
          <label className="text-sm">Weekly study goal</label>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="range"
              min="1"
              max="40"
              value={appSettings.weeklyGoal}
              onChange={e => handleAppSettingChange('weeklyGoal', parseInt(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-sm font-medium w-12 text-right">{appSettings.weeklyGoal}h</span>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Keyboard Shortcuts</h3>
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Start/Pause</span>
              <kbd className="px-2 py-0.5 bg-secondary rounded text-xs">Space</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reset</span>
              <kbd className="px-2 py-0.5 bg-secondary rounded text-xs">R</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Skip</span>
              <kbd className="px-2 py-0.5 bg-secondary rounded text-xs">S</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Zen Mode</span>
              <kbd className="px-2 py-0.5 bg-secondary rounded text-xs">Z</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-10 h-6 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-secondary'
        )}
      >
        <span
          className={cn(
            'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  )
}
