import { useAppContext } from '../context/AppContext'
import { SectionCard } from './SectionCard'

const numberFieldClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950'

export const Settings = () => {
  const { state, dispatch } = useAppContext()

  const update = (payload) => dispatch({ type: 'UPDATE_SETTINGS', payload })

  const askNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  return (
    <SectionCard title="Settings" subtitle="Customize durations, reminders, goals, and display options.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">
          Focus (minutes)
          <input
            type="number"
            min={5}
            className={numberFieldClass}
            value={state.settings.focusMinutes}
            onChange={(event) => update({ focusMinutes: Number(event.target.value) })}
          />
        </label>

        <label className="text-sm">
          Short break (minutes)
          <input
            type="number"
            min={1}
            className={numberFieldClass}
            value={state.settings.shortBreakMinutes}
            onChange={(event) => update({ shortBreakMinutes: Number(event.target.value) })}
          />
        </label>

        <label className="text-sm">
          Long break (minutes)
          <input
            type="number"
            min={1}
            className={numberFieldClass}
            value={state.settings.longBreakMinutes}
            onChange={(event) => update({ longBreakMinutes: Number(event.target.value) })}
          />
        </label>

        <label className="text-sm">
          Long break ratio
          <input
            type="number"
            min={1}
            className={numberFieldClass}
            value={state.settings.breakRatio}
            onChange={(event) => update({ breakRatio: Number(event.target.value) })}
          />
        </label>

        <label className="text-sm">
          Weekly goal (hours)
          <input
            type="number"
            min={1}
            className={numberFieldClass}
            value={state.settings.weeklyGoalHours}
            onChange={(event) => update({ weeklyGoalHours: Number(event.target.value) })}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">
          <input
            type="checkbox"
            checked={state.settings.flowMode}
            onChange={(event) => update({ flowMode: event.target.checked })}
          />
          Flow mode (no break prompts)
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">
          <input
            type="checkbox"
            checked={state.settings.darkMode}
            onChange={(event) => update({ darkMode: event.target.checked })}
          />
          Dark mode
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">
          <input
            type="checkbox"
            checked={state.settings.zenMode}
            onChange={(event) => update({ zenMode: event.target.checked })}
          />
          Zen mode (minimal UI)
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">
          <input
            type="checkbox"
            checked={state.settings.alarmEnabled}
            onChange={(event) => update({ alarmEnabled: event.target.checked })}
          />
          Timer alarm sound
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={state.settings.notificationsEnabled}
            onChange={async (event) => {
              update({ notificationsEnabled: event.target.checked })
              if (event.target.checked) {
                await askNotificationPermission()
              }
            }}
          />
          Browser notifications
        </label>
      </div>
    </SectionCard>
  )
}
