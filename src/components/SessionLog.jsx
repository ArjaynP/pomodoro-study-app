import { useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { downloadCsv } from '../utils/csv'
import { formatDate, formatDuration } from '../utils/helpers'
import { SectionCard } from './SectionCard'

export const SessionLog = () => {
  const { state } = useAppContext()

  const rows = useMemo(
    () =>
      state.sessions.map((session) => ({
        start_time: session.startTime,
        end_time: session.endTime,
        duration_minutes: session.durationMinutes,
        task: session.taskTitle || '',
        subject: session.subject,
        distractions_count: session.distractions?.length || 0,
        distractions: (session.distractions || []).map((d) => d.note).join(' | '),
      })),
    [state.sessions],
  )

  return (
    <SectionCard
      title="Session History"
      subtitle="Every completed focus block with task link, subject tag, and distraction notes."
      actions={
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
          onClick={() => downloadCsv(rows, 'study-sessions.csv')}
        >
          Export CSV
        </button>
      }
    >
      <div className="space-y-3">
        {state.sessions.length === 0 ? (
          <p className="text-sm text-slate-500">No sessions recorded yet. Start a timer to begin.</p>
        ) : (
          state.sessions.map((session) => (
            <article
              key={session.id}
              className="rounded-lg border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/70"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {session.taskTitle || 'Unlinked Focus Session'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {formatDuration(session.durationMinutes * 60)}
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatDate(session.startTime)} • {session.subject}
              </p>
              {session.distractions?.length ? (
                <ul className="mt-2 list-inside list-disc text-xs text-amber-700 dark:text-amber-300">
                  {session.distractions.map((distraction) => (
                    <li key={distraction.id}>{distraction.note}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))
        )}
      </div>
    </SectionCard>
  )
}
