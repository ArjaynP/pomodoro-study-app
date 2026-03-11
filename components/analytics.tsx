'use client'

import { useMemo } from 'react'
import { useApp } from '@/lib/app-context'
import {
  Flame,
  Trophy,
  Clock,
  Target,
  TrendingUp,
  Calendar,
} from 'lucide-react'

export function Analytics() {
  const { state } = useApp()
  const { sessions, stats, appSettings } = state

  // Calculate heatmap data for the last 365 days
  const heatmapData = useMemo(() => {
    const today = new Date()
    const data: Record<string, number> = {}
    
    // Initialize last 365 days with 0
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      data[key] = 0
    }
    
    // Fill in session data
    sessions.forEach(session => {
      const key = session.startTime.split('T')[0]
      if (data[key] !== undefined) {
        data[key] += session.duration
      }
    })
    
    return data
  }, [sessions])

  // Calculate subject breakdown
  const subjectBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {}
    
    sessions.forEach(session => {
      const subject = session.subject || 'Other'
      breakdown[subject] = (breakdown[subject] || 0) + session.duration
    })
    
    return Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [sessions])

  // Calculate weekly progress
  const weeklyProgress = useMemo(() => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const weekMinutes = sessions
      .filter(s => new Date(s.startTime) >= weekStart)
      .reduce((acc, s) => acc + s.duration, 0)
    
    const goalMinutes = appSettings.weeklyGoalHours * 60
    const progress = Math.min(1, weekMinutes / goalMinutes)
    
    return { weekMinutes, goalMinutes, progress }
  }, [sessions, appSettings.weeklyGoalHours])

  // Calculate personal bests
  const personalBests = useMemo(() => {
    if (sessions.length === 0) {
      return { longestSession: 0, mostSessionsDay: 0 }
    }
    
    const longestSession = Math.max(...sessions.map(s => s.duration))
    
    const sessionsByDay: Record<string, number> = {}
    sessions.forEach(s => {
      const day = s.startTime.split('T')[0]
      sessionsByDay[day] = (sessionsByDay[day] || 0) + 1
    })
    const mostSessionsDay = Math.max(...Object.values(sessionsByDay))
    
    return { longestSession, mostSessionsDay }
  }, [sessions])

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const getHeatmapColor = (minutes: number) => {
    if (minutes === 0) return 'bg-secondary'
    if (minutes < 30) return 'bg-emerald-900/50'
    if (minutes < 60) return 'bg-emerald-700/60'
    if (minutes < 120) return 'bg-emerald-500/70'
    return 'bg-emerald-400'
  }

  // Generate weeks for heatmap
  const weeks = useMemo(() => {
    const entries = Object.entries(heatmapData)
    const result: { date: string; minutes: number }[][] = []
    
    for (let i = 0; i < entries.length; i += 7) {
      result.push(entries.slice(i, i + 7).map(([date, minutes]) => ({ date, minutes })))
    }
    
    return result
  }, [heatmapData])

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Analytics</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs">Current Streak</span>
          </div>
          <div className="text-2xl font-bold">{stats.currentStreak} days</div>
        </div>
        
        <div className="bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs">Best Streak</span>
          </div>
          <div className="text-2xl font-bold">{stats.longestStreak} days</div>
        </div>
        
        <div className="bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span className="text-xs">Total Time</span>
          </div>
          <div className="text-2xl font-bold">{formatDuration(stats.totalMinutes)}</div>
        </div>
        
        <div className="bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-xs">Total Sessions</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalSessions}</div>
        </div>
      </div>

      {/* Weekly Goal */}
      <div className="bg-secondary rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">Weekly Goal</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatDuration(weeklyProgress.weekMinutes)} / {formatDuration(weeklyProgress.goalMinutes)}
          </span>
        </div>
        <div className="h-3 bg-background rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${weeklyProgress.progress * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {Math.round(weeklyProgress.progress * 100)}% complete
        </p>
      </div>

      {/* Personal Bests */}
      <div className="bg-secondary rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="font-medium">Personal Bests</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-lg font-bold">
              {formatDuration(personalBests.longestSession)}
            </div>
            <div className="text-xs text-muted-foreground">Longest Session</div>
          </div>
          <div>
            <div className="text-lg font-bold">{personalBests.mostSessionsDay}</div>
            <div className="text-xs text-muted-foreground">Most Sessions/Day</div>
          </div>
        </div>
      </div>

      {/* Subject Breakdown */}
      {subjectBreakdown.length > 0 && (
        <div className="bg-secondary rounded-xl p-4 mb-6">
          <h3 className="font-medium mb-3">Time by Subject</h3>
          <div className="space-y-3">
            {subjectBreakdown.map(([subject, minutes], index) => {
              const maxMinutes = subjectBreakdown[0][1]
              const width = (minutes / maxMinutes) * 100
              const colors = [
                'bg-emerald-500',
                'bg-sky-500',
                'bg-amber-500',
                'bg-rose-500',
                'bg-violet-500',
              ]
              
              return (
                <div key={subject}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{subject}</span>
                    <span className="text-muted-foreground">
                      {formatDuration(minutes)}
                    </span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[index % colors.length]} rounded-full`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Activity Heatmap */}
      <div className="bg-secondary rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">Activity</span>
        </div>
        
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map(({ date, minutes }) => (
                  <div
                    key={date}
                    className={`w-3 h-3 rounded-sm ${getHeatmapColor(minutes)} transition-colors`}
                    title={`${date}: ${formatDuration(minutes)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-2 mt-3">
          <span className="text-xs text-muted-foreground">Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-secondary" />
            <div className="w-3 h-3 rounded-sm bg-emerald-900/50" />
            <div className="w-3 h-3 rounded-sm bg-emerald-700/60" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
            <div className="w-3 h-3 rounded-sm bg-emerald-400" />
          </div>
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  )
}
