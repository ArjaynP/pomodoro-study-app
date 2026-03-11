'use client'

import { useApp } from '@/lib/app-context'
import type { Session } from '@/lib/types'
import {
  Clock,
  Target,
  AlertCircle,
  Flame,
  X,
} from 'lucide-react'

interface SessionSummaryProps {
  session: Session
  onClose: () => void
}

export function SessionSummary({ session, onClose }: SessionSummaryProps) {
  const { state } = useApp()
  const { stats } = state

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden">
        <div className="bg-emerald-500/20 p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-background/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 bg-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-emerald-400" />
          </div>
          
          <h2 className="text-xl font-bold mb-1">Session Complete!</h2>
          <p className="text-muted-foreground">
            {session.taskTitle || 'Free Focus Session'}
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-secondary rounded-xl p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-2 text-sky-400" />
              <div className="text-xl font-bold">{formatDuration(session.duration)}</div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
            
            <div className="bg-secondary rounded-xl p-4 text-center">
              <Flame className="w-5 h-5 mx-auto mb-2 text-orange-400" />
              <div className="text-xl font-bold">{stats.currentStreak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>
          
          {session.distractions.length > 0 && (
            <div className="bg-amber-500/10 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="font-medium text-amber-400">
                  {session.distractions.length} Distraction{session.distractions.length > 1 ? 's' : ''} Logged
                </span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {session.distractions.slice(0, 3).map(d => (
                  <li key={d.id} className="truncate">• {d.note}</li>
                ))}
                {session.distractions.length > 3 && (
                  <li className="text-xs">...and {session.distractions.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
          
          <div className="text-center text-sm text-muted-foreground mb-4">
            Total focus time: {formatDuration(stats.totalMinutes)}
          </div>
          
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
