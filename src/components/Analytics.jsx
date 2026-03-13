import { useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import {
  getHeatmapCells,
  getPersonalBests,
  getSessionsByDay,
  getStreak,
  getWeeklyMinutes,
  getWeeklySubjectBreakdown,
} from '../utils/analytics'
import { formatDuration } from '../utils/helpers'
import { SectionCard } from './SectionCard'

const heatColors = {
  0: 'bg-slate-200 dark:bg-slate-800',
  1: 'bg-cyan-200 dark:bg-cyan-900',
  2: 'bg-cyan-400 dark:bg-cyan-700',
  3: 'bg-cyan-500 dark:bg-cyan-500',
  4: 'bg-cyan-700 dark:bg-cyan-300',
}

export const Analytics = () => {
  const { state } = useAppContext()

  const heatmap = useMemo(() => getHeatmapCells(state.sessions), [state.sessions])
  const streak = useMemo(() => getStreak(state.sessions), [state.sessions])
  const weeklyMinutes = useMemo(() => getWeeklyMinutes(state.sessions), [state.sessions])
  const weeklyBySubject = useMemo(
    () => getWeeklySubjectBreakdown(state.sessions),
    [state.sessions],
  )
  const dailyBySubject = useMemo(() => {
    const byDay = getSessionsByDay(state.sessions)
    const today = new Date().toISOString().slice(0, 10)
    return Object.entries(byDay[today]?.subjects || {})
      .map(([subject, minutes]) => ({ subject, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
  }, [state.sessions])
  const bests = useMemo(() => getPersonalBests(state.sessions), [state.sessions])

  const weeklyGoalMinutes = state.settings.weeklyGoalHours * 60
  const goalProgress = Math.min(100, Math.round((weeklyMinutes / Math.max(1, weeklyGoalMinutes)) * 100))

  return (
    <SectionCard title="Analytics" subtitle="Study heatmap, streaks, personal bests, and goal progress.">
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div>
          <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">GitHub-style activity map</p>
          <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            {heatmap.map((cell) => (
              <div
                key={cell.key}
                title={`${cell.key}: ${cell.minutes} min`}
                className={`h-3 w-3 rounded-sm ${heatColors[cell.level]}`}
              />
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <h3 className="font-semibold">Today by Subject</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {dailyBySubject.length === 0 ? (
                  <li className="text-slate-500">No sessions today.</li>
                ) : (
                  dailyBySubject.map((item) => (
                    <li key={item.subject} className="flex justify-between">
                      <span>{item.subject}</span>
                      <span>{formatDuration(item.minutes * 60)}</span>
                    </li>
                  ))
                )}
              </ul>
            </article>

            <article className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <h3 className="font-semibold">This Week by Subject</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {weeklyBySubject.length === 0 ? (
                  <li className="text-slate-500">No sessions yet this week.</li>
                ) : (
                  weeklyBySubject.map((item) => (
                    <li key={item.subject} className="flex justify-between">
                      <span>{item.subject}</span>
                      <span>{formatDuration(item.minutes * 60)}</span>
                    </li>
                  ))
                )}
              </ul>
            </article>
          </div>
        </div>

        <div className="space-y-3">
          <article className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-sm text-slate-500">Current streak</p>
            <p className="text-2xl font-semibold">{streak} day{streak === 1 ? '' : 's'}</p>
          </article>

          <article className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-sm text-slate-500">Longest session</p>
            <p className="text-2xl font-semibold">{formatDuration(bests.longestSession * 60)}</p>
            <p className="mt-2 text-sm text-slate-500">Most sessions in a day: {bests.mostSessionsDay}</p>
          </article>

          <article className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-sm text-slate-500">Weekly goal</p>
            <p className="text-lg font-semibold">
              {formatDuration(weeklyMinutes * 60)} / {state.settings.weeklyGoalHours}h
            </p>
            <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-2 rounded-full bg-cyan-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">{goalProgress}% complete</p>
          </article>
        </div>
      </div>
    </SectionCard>
  )
}
