import { useState } from 'react'
import { Clock, Target, AlertCircle, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { FocusSession } from '../types'
import { cn, formatDuration } from '../lib/utils'
import { format, isToday, isYesterday, startOfDay } from 'date-fns'

interface SessionSummaryProps {
  session: FocusSession
  onClose: () => void
}

export function SessionSummary({ session, onClose }: SessionSummaryProps) {
  const durationMinutes = Math.floor(session.duration / 60)
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Session Complete!</h2>
          <p className="text-muted-foreground">Great work on your focus session</p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              Duration
            </span>
            <span className="font-semibold">{formatDuration(durationMinutes)}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-4 h-4" />
              Subject
            </span>
            <span className="font-semibold">{session.subject}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <span className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              Distractions
            </span>
            <span className={cn(
              'font-semibold',
              session.distractions.length === 0 ? 'text-success' : 'text-warning'
            )}>
              {session.distractions.length}
            </span>
          </div>
        </div>
        
        {session.distractions.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">Distractions logged:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {session.distractions.map(d => (
                <li key={d.id} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5" />
                  {d.note}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default function SessionLog() {
  const { state } = useApp()
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set([format(new Date(), 'yyyy-MM-dd')]))

  // Group sessions by day
  const sessionsByDay = state.sessions.reduce((acc, session) => {
    const day = format(new Date(session.startTime), 'yyyy-MM-dd')
    if (!acc[day]) acc[day] = []
    acc[day].push(session)
    return acc
  }, {} as Record<string, FocusSession[]>)

  const sortedDays = Object.keys(sessionsByDay).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  const toggleDay = (day: string) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(day)) {
      newExpanded.delete(day)
    } else {
      newExpanded.add(day)
    }
    setExpandedDays(newExpanded)
  }

  const formatDayLabel = (dateStr: string) => {
    const date = startOfDay(new Date(dateStr))
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMM d')
  }

  const getDayStats = (sessions: FocusSession[]) => {
    const totalMinutes = sessions.reduce((sum, s) => sum + Math.floor(s.duration / 60), 0)
    const totalDistractions = sessions.reduce((sum, s) => sum + s.distractions.length, 0)
    return { totalMinutes, totalDistractions, count: sessions.length }
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Session History</h2>
      
      {sortedDays.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
          <div>
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No sessions yet</p>
            <p className="text-sm">Complete a focus session to see it here</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {sortedDays.map(day => {
            const sessions = sessionsByDay[day]
            const stats = getDayStats(sessions)
            const isExpanded = expandedDays.has(day)
            
            return (
              <div key={day} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleDay(day)}
                  className="w-full flex items-center justify-between p-3 bg-card hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{formatDayLabel(day)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{stats.count} sessions</span>
                    <span>{formatDuration(stats.totalMinutes)}</span>
                    {stats.totalDistractions > 0 && (
                      <span className="flex items-center gap-1 text-warning">
                        <AlertCircle className="w-3 h-3" />
                        {stats.totalDistractions}
                      </span>
                    )}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="border-t border-border">
                    {sessions.sort((a, b) => 
                      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                    ).map(session => (
                      <div
                        key={session.id}
                        className="flex items-center gap-3 p-3 border-b border-border last:border-b-0 hover:bg-secondary/30"
                      >
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          session.completed ? 'bg-success' : 'bg-warning'
                        )} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {format(new Date(session.startTime), 'h:mm a')}
                            </span>
                            <span className="text-xs text-muted-foreground">-</span>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(session.endTime), 'h:mm a')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs px-1.5 py-0.5 bg-secondary rounded">
                              {session.subject}
                            </span>
                            {!session.completed && (
                              <span className="text-xs text-warning">Incomplete</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatDuration(Math.floor(session.duration / 60))}
                          </p>
                          {session.distractions.length > 0 && (
                            <p className="text-xs text-warning flex items-center gap-1 justify-end">
                              <AlertCircle className="w-3 h-3" />
                              {session.distractions.length} distractions
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
