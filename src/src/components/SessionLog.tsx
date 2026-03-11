import { useState } from 'react'
import { Clock, BookOpen, AlertTriangle, X } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { formatDuration, cn } from '@/lib/utils'
import { format, isToday, isYesterday, startOfDay } from 'date-fns'

interface SessionLogProps {
  currentSessionId: string | null
  onAddDistraction: (note: string) => void
}

export default function SessionLog({ currentSessionId, onAddDistraction }: SessionLogProps) {
  const { state } = useApp()
  const { sessions } = state
  
  const [distractionNote, setDistractionNote] = useState('')
  const [showDistractionInput, setShowDistractionInput] = useState(false)

  const handleAddDistraction = () => {
    if (distractionNote.trim() && currentSessionId) {
      onAddDistraction(distractionNote)
      setDistractionNote('')
      setShowDistractionInput(false)
    }
  }

  // Group sessions by day
  const groupedSessions = sessions.reduce((acc, session) => {
    const day = startOfDay(new Date(session.timestamp)).getTime()
    if (!acc[day]) {
      acc[day] = []
    }
    acc[day].push(session)
    return acc
  }, {} as Record<number, typeof sessions>)

  const sortedDays = Object.keys(groupedSessions)
    .map(Number)
    .sort((a, b) => b - a)

  const formatDayLabel = (timestamp: number) => {
    const date = new Date(timestamp)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d')
  }

  const currentSession = currentSessionId 
    ? sessions.find(s => s.id === currentSessionId)
    : null

  return (
    <div className="bg-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Session History</h2>
        {currentSessionId && (
          <button
            onClick={() => setShowDistractionInput(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-warning/20 text-warning rounded-lg hover:bg-warning/30 transition-colors text-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Log Distraction
          </button>
        )}
      </div>

      {/* Distraction Input Modal */}
      {showDistractionInput && (
        <div className="mb-4 p-4 bg-warning/10 border border-warning/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-warning">Log a distraction</span>
            <button 
              onClick={() => setShowDistractionInput(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={distractionNote}
              onChange={e => setDistractionNote(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddDistraction()}
              placeholder="What distracted you?"
              className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-warning focus:outline-none text-sm"
              autoFocus
            />
            <button
              onClick={handleAddDistraction}
              className="px-4 py-2 bg-warning text-warning-foreground rounded-lg hover:bg-warning/90 text-sm"
            >
              Log
            </button>
          </div>
        </div>
      )}

      {/* Current Session */}
      {currentSession && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary">Active Session</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{currentSession.taskTitle || 'General Focus'}</p>
              <p className="text-sm text-muted-foreground">{currentSession.subject}</p>
            </div>
            {currentSession.distractions.length > 0 && (
              <div className="flex items-center gap-1 text-warning text-sm">
                <AlertTriangle className="w-4 h-4" />
                {currentSession.distractions.length} distraction{currentSession.distractions.length !== 1 && 's'}
              </div>
            )}
          </div>
          {currentSession.distractions.length > 0 && (
            <div className="mt-3 space-y-1">
              {currentSession.distractions.map(d => (
                <div key={d.id} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-warning">-</span>
                  {d.note}
                  <span className="text-xs">({format(new Date(d.timestamp), 'h:mm a')})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Session History */}
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {sortedDays.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No sessions yet. Start your first focus session!
          </p>
        ) : (
          sortedDays.map(day => (
            <div key={day}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {formatDayLabel(day)}
              </h3>
              <div className="space-y-2">
                {groupedSessions[day]
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map(session => (
                    <div
                      key={session.id}
                      className={cn(
                        "p-3 rounded-xl border border-border/50 bg-secondary/30",
                        session.id === currentSessionId && "ring-1 ring-primary"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {session.taskTitle || 'General Focus'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span>{session.subject}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(Math.floor(session.duration / 60))}
                            </span>
                            <span>{format(new Date(session.timestamp), 'h:mm a')}</span>
                          </div>
                        </div>
                        {session.distractions.length > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-warning/20 text-warning rounded-full text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            {session.distractions.length}
                          </div>
                        )}
                      </div>
                      {session.distractions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Distractions:</p>
                          <div className="space-y-0.5">
                            {session.distractions.map(d => (
                              <p key={d.id} className="text-xs text-muted-foreground pl-2 border-l-2 border-warning/50">
                                {d.note}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
