import { 
  Sun, Moon, Timer, Coffee, Zap, Bell, 
  Volume2, Download, Target, Keyboard, Eye
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { exportToCSV, cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function Settings() {
  const { state, dispatch } = useApp()
  const { settings, sessions } = state

  const updateSetting = <K extends keyof typeof settings>(
    key: K, 
    value: typeof settings[K]
  ) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } })
  }

  const handleExport = () => {
    const exportData = sessions.map(s => ({
      date: format(new Date(s.timestamp), 'yyyy-MM-dd'),
      time: format(new Date(s.timestamp), 'HH:mm'),
      task: s.taskTitle || 'General Focus',
      subject: s.subject,
      duration_minutes: Math.floor(s.duration / 60),
      distractions: s.distractions.length,
      distraction_notes: s.distractions.map(d => d.note).join('; ')
    }))
    exportToCSV(exportData, `pomodoro-sessions-${format(new Date(), 'yyyy-MM-dd')}.csv`)
  }

  return (
    <div className="bg-card rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Settings</h2>

      <div className="space-y-6">
        {/* Timer Settings */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
            <Timer className="w-4 h-4" />
            Timer Duration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-secondary/50 rounded-xl">
              <label className="block text-sm text-foreground mb-2">Focus Session</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="5"
                  value={settings.focusDuration}
                  onChange={e => updateSetting('focusDuration', Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-12 text-right text-foreground font-mono">
                  {settings.focusDuration}m
                </span>
              </div>
            </div>

            <div className="p-4 bg-secondary/50 rounded-xl">
              <label className="block text-sm text-foreground mb-2">Short Break</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={settings.shortBreakDuration}
                  onChange={e => updateSetting('shortBreakDuration', Number(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <span className="w-12 text-right text-foreground font-mono">
                  {settings.shortBreakDuration}m
                </span>
              </div>
            </div>

            <div className="p-4 bg-secondary/50 rounded-xl">
              <label className="block text-sm text-foreground mb-2">Long Break</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="10"
                  max="30"
                  step="5"
                  value={settings.longBreakDuration}
                  onChange={e => updateSetting('longBreakDuration', Number(e.target.value))}
                  className="flex-1 accent-chart-3"
                />
                <span className="w-12 text-right text-foreground font-mono">
                  {settings.longBreakDuration}m
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Break Settings */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
            <Coffee className="w-4 h-4" />
            Break Settings
          </h3>
          
          <div className="p-4 bg-secondary/50 rounded-xl">
            <label className="block text-sm text-foreground mb-2">
              Sessions until long break
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="2"
                max="6"
                step="1"
                value={settings.sessionsUntilLongBreak}
                onChange={e => updateSetting('sessionsUntilLongBreak', Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="w-12 text-right text-foreground font-mono">
                {settings.sessionsUntilLongBreak}
              </span>
            </div>
          </div>
        </section>

        {/* Weekly Goal */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
            <Target className="w-4 h-4" />
            Weekly Goal
          </h3>
          
          <div className="p-4 bg-secondary/50 rounded-xl">
            <label className="block text-sm text-foreground mb-2">
              Hours per week
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={settings.weeklyGoalHours}
                onChange={e => updateSetting('weeklyGoalHours', Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="w-12 text-right text-foreground font-mono">
                {settings.weeklyGoalHours}h
              </span>
            </div>
          </div>
        </section>

        {/* Toggles */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
            <Zap className="w-4 h-4" />
            Features
          </h3>
          
          <div className="space-y-3">
            <ToggleSetting
              icon={settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              label="Dark Mode"
              description="Switch between light and dark themes"
              checked={settings.darkMode}
              onChange={v => updateSetting('darkMode', v)}
            />
            
            <ToggleSetting
              icon={<Eye className="w-4 h-4" />}
              label="Zen Mode"
              description="Minimal UI for distraction-free focus"
              checked={settings.zenMode}
              onChange={v => updateSetting('zenMode', v)}
            />
            
            <ToggleSetting
              icon={<Zap className="w-4 h-4" />}
              label="Flow Mode"
              description="Skip break prompts for uninterrupted sessions"
              checked={settings.flowMode}
              onChange={v => updateSetting('flowMode', v)}
            />
            
            <ToggleSetting
              icon={<Volume2 className="w-4 h-4" />}
              label="Sound Effects"
              description="Play sounds when timer completes"
              checked={settings.soundEnabled}
              onChange={v => updateSetting('soundEnabled', v)}
            />
            
            <ToggleSetting
              icon={<Bell className="w-4 h-4" />}
              label="Notifications"
              description="Show browser notifications"
              checked={settings.notificationsEnabled}
              onChange={v => updateSetting('notificationsEnabled', v)}
            />
          </div>
        </section>

        {/* Export */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
            <Download className="w-4 h-4" />
            Data Export
          </h3>
          
          <button
            onClick={handleExport}
            disabled={sessions.length === 0}
            className="w-full py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Sessions as CSV
          </button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {sessions.length} sessions recorded
          </p>
        </section>

        {/* Keyboard Shortcuts */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
            <Keyboard className="w-4 h-4" />
            Keyboard Shortcuts
          </h3>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <ShortcutItem keys="Space" description="Start/Pause timer" />
            <ShortcutItem keys="R" description="Reset timer" />
            <ShortcutItem keys="S" description="Skip break" />
            <ShortcutItem keys="F" description="Toggle flow mode" />
            <ShortcutItem keys="Z" description="Toggle zen mode" />
          </div>
        </section>
      </div>
    </div>
  )
}

interface ToggleSettingProps {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}

function ToggleSetting({ icon, label, description, checked, onChange }: ToggleSettingProps) {
  return (
    <div 
      className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl cursor-pointer hover:bg-secondary/70 transition-colors"
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className={cn(
        "w-11 h-6 rounded-full transition-colors relative",
        checked ? "bg-primary" : "bg-muted"
      )}>
        <div className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )} />
      </div>
    </div>
  )
}

interface ShortcutItemProps {
  keys: string
  description: string
}

function ShortcutItem({ keys, description }: ShortcutItemProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono text-foreground">
        {keys}
      </kbd>
      <span className="text-muted-foreground">{description}</span>
    </div>
  )
}
