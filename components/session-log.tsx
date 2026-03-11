'use client'

import { useState } from 'react'
import { useApp } from '@/lib/app-context'
import type { Session } from '@/lib/types'
import {
  Clock,
  Calendar,
  Tag,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Target,
} from 'lucide-react'

export function SessionLog() {
  const { state } = useApp()
  const { sessions } = state
  
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  const toggleExpand = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, session) => {
    const date = new Date(session.startTime).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(session)
    return acc
  }, {} as Record<string, Session[]>)

  const sortedDates = Object.keys(groupedSessions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  // Calculate today's stats
  const today = new Date().toDateString()
  const todaySessions = groupedSessions[today] || []
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0)
  const todayDistractions = todaySessions.reduce((acc, s) => acc + s.distractions.length, 0)

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Session Log</h2>

      {/* Today's Summary */}
      <div className="bg-secondary rounded-xl p-4 mb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Today</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold">{todaySessions.length}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatDuration(todayMinutes)}</div>
            <div className="text-xs text-muted-foreground">Focus Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{todayDistractions}</div>
            <div className="text-xs text-muted-foreground">Distractions</div>
          </div>
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No sessions yet</p>
            <p className="text-sm">Start a focus session to see your history</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map(date => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(date)}
                </h3>
                <div className="space-y-2">
                  {groupedSessions[date]
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .map(session => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isExpanded={expandedSessions.has(session.id)}
                        onToggleExpand={() => toggleExpand(session.id)}
                        formatDuration={formatDuration}
                        formatTime={formatTime}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface SessionItemProps {
  session: Session
  isExpanded: boolean
  onToggleExpand: () => void
  formatDuration: (minutes: number) => string
  formatTime: (dateString: string) => string
}

function SessionItem({
  session,
  isExpanded,
  onToggleExpand,
  formatDuration,
  formatTime,
}: SessionItemProps) {
  return (
    <div className="bg-secondary rounded-xl overflow-hidden">
      <div
        className="p-3 cursor-pointer hover:bg-secondary/80 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium truncate">
                {session.taskTitle || 'Free Focus'}
              </span>
              {session.distractions.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-400">
                  <AlertCircle className="w-3 h-3" />
                  {session.distractions.length}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(session.startTime)} - {formatTime(session.endTime)}
              </span>
              {session.subject && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {session.subject}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {formatDuration(session.duration)}
            </span>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
      
      {isExpanded && session.distractions.length > 0 && (
        <div className="border-t border-border px-3 py-2 bg-background/50">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            Distractions ({session.distractions.length})
          </h4>
          <div className="space-y-2">
            {session.distractions.map(distraction => (
              <div key={distraction.id} className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p>{distraction.note}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(distraction.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
