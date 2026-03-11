import { Trophy, Clock, AlertTriangle, Target, X } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import type { FocusSession } from '@/types'

interface SessionSummaryProps {
  session: FocusSession
  onClose: () => void
}

export default function SessionSummary({ session, onClose }: SessionSummaryProps) {
  const minutes = Math.floor(session.duration / 60)
  const focusScore = Math.max(0, 100 - session.distractions.length * 15)

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-xl border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Session Complete!</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <svg className="w-32 h-32" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                className="stroke-muted"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className="stroke-primary"
                strokeDasharray={`${focusScore * 2.83} 283`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Trophy className="w-6 h-6 text-primary mb-1" />
              <span className="text-2xl font-bold text-foreground">{focusScore}%</span>
              <span className="text-xs text-muted-foreground">Focus Score</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-secondary/50 rounded-xl text-center">
            <Clock className="w-5 h-5 text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{formatDuration(minutes)}</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-xl text-center">
            <AlertTriangle className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{session.distractions.length}</p>
            <p className="text-xs text-muted-foreground">Distractions</p>
          </div>
        </div>

        <div className="p-4 bg-secondary/30 rounded-xl mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Task</span>
          </div>
          <p className="text-foreground">{session.taskTitle || 'General Focus'}</p>
          <p className="text-sm text-muted-foreground">{session.subject}</p>
        </div>

        {session.distractions.length > 0 && (
          <div className="p-4 bg-warning/10 rounded-xl mb-6">
            <p className="text-sm font-medium text-warning mb-2">Distractions logged:</p>
            <ul className="space-y-1">
              {session.distractions.map(d => (
                <li key={d.id} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-warning mt-0.5">-</span>
                  <span>{d.note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
