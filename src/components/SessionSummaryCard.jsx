import { useAppContext } from '../context/AppContext'
import { formatDate, formatDuration } from '../utils/helpers'

export const SessionSummaryCard = () => {
  const { state, dispatch } = useAppContext()

  if (!state.lastSessionSummary) {
    return null
  }

  const session = state.lastSessionSummary

  return (
    <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-700/50 dark:bg-cyan-900/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
            Session Complete
          </p>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {session.taskTitle || 'Focus block logged'}
          </h3>
        </div>
        <button
          className="rounded-md border border-cyan-300 px-2 py-1 text-xs text-cyan-700 dark:border-cyan-700 dark:text-cyan-300"
          onClick={() => dispatch({ type: 'CLEAR_LAST_SUMMARY' })}
        >
          Dismiss
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
        {formatDuration(session.durationMinutes * 60)} on {session.subject} • {formatDate(session.endTime)}
      </p>
      <p className="text-xs text-slate-500">
        Distractions logged: {session.distractions?.length || 0}
      </p>
    </article>
  )
}
