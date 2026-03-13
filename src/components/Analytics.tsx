import { useMemo } from 'react'
import { Flame, Trophy, Target, Clock, TrendingUp, Calendar } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { cn, formatDuration, exportToCSV } from '../lib/utils'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, subWeeks, getDay, startOfDay, isToday } from 'date-fns'

export default function Analytics() {
  const { state } = useApp()

  // Calculate weekly totals
  const weeklyStats = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    
    let totalMinutes = 0
    let sessionsCount = 0
    const subjectBreakdown: Record<string, number> = {}
    
    Object.entries(state.dailyStats).forEach(([dateStr, stats]) => {
      const date = new Date(dateStr)
      if (date >= weekStart && date <= weekEnd) {
        totalMinutes += stats.totalFocusTime
        sessionsCount += stats.sessionsCompleted
        Object.entries(stats.subjectBreakdown).forEach(([subject, minutes]) => {
          subjectBreakdown[subject] = (subjectBreakdown[subject] || 0) + minutes
        })
      }
    })
    
    return { totalMinutes, sessionsCount, subjectBreakdown }
  }, [state.dailyStats])

  // Generate heatmap data (last 12 weeks)
  const heatmapData = useMemo(() => {
    const today = startOfDay(new Date())
    const weeks: { date: Date; minutes: number }[][] = []
    
    for (let w = 11; w >= 0; w--) {
      const weekStart = startOfWeek(subWeeks(today, w), { weekStartsOn: 1 })
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
      
      weeks.push(days.map(date => {
        const dateKey = format(date, 'yyyy-MM-dd')
        const stats = state.dailyStats[dateKey]
        return {
          date,
          minutes: stats?.totalFocusTime || 0,
        }
      }))
    }
    
    return weeks
  }, [state.dailyStats])

  // Calculate max for color intensity
  const maxMinutes = useMemo(() => {
    return Math.max(
      1,
      ...heatmapData.flat().map(d => d.minutes)
    )
  }, [heatmapData])

  const getHeatmapColor = (minutes: number) => {
    if (minutes === 0) return 'bg-secondary'
    const intensity = minutes / maxMinutes
    if (intensity < 0.25) return 'bg-primary/30'
    if (intensity < 0.5) return 'bg-primary/50'
    if (intensity < 0.75) return 'bg-primary/75'
    return 'bg-primary'
  }

  // Weekly goal progress
  const weeklyGoalHours = state.appSettings.weeklyGoal
  const weeklyGoalMinutes = weeklyGoalHours * 60
  const weeklyProgress = Math.min((weeklyStats.totalMinutes / weeklyGoalMinutes) * 100, 100)

  // Subject data for pie-like display
  const sortedSubjects = useMemo(() => {
    return Object.entries(weeklyStats.subjectBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [weeklyStats.subjectBreakdown])

  const totalSubjectMinutes = sortedSubjects.reduce((sum, [, min]) => sum + min, 0)

  const subjectColors = [
    'bg-primary',
    'bg-accent',
    'bg-success',
    'bg-warning',
    'bg-destructive',
  ]

  const handleExport = () => {
    const data = state.sessions.map(s => ({
      date: format(new Date(s.startTime), 'yyyy-MM-dd'),
      startTime: format(new Date(s.startTime), 'HH:mm:ss'),
      endTime: format(new Date(s.endTime), 'HH:mm:ss'),
      durationMinutes: Math.floor(s.duration / 60),
      subject: s.subject,
      completed: s.completed,
      distractions: s.distractions.length,
    }))
    exportToCSV(data, `focusflow-sessions-${format(new Date(), 'yyyy-MM-dd')}.csv`)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Analytics</h2>
        <button
          onClick={handleExport}
          className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Flame className="w-4 h-4 text-destructive" />
            <span className="text-sm">Current Streak</span>
          </div>
          <p className="text-2xl font-bold">{state.currentStreak}</p>
          <p className="text-xs text-muted-foreground">days</p>
        </div>

        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Trophy className="w-4 h-4 text-warning" />
            <span className="text-sm">Best Streak</span>
          </div>
          <p className="text-2xl font-bold">{state.personalBests.longestStreak}</p>
          <p className="text-xs text-muted-foreground">days</p>
        </div>

        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm">Longest Session</span>
          </div>
          <p className="text-2xl font-bold">{state.personalBests.longestSession}</p>
          <p className="text-xs text-muted-foreground">minutes</p>
        </div>

        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm">Most Sessions</span>
          </div>
          <p className="text-2xl font-bold">{state.personalBests.mostSessionsInDay}</p>
          <p className="text-xs text-muted-foreground">in a day</p>
        </div>
      </div>

      {/* Weekly Goal */}
      <div className="p-4 bg-card border border-border rounded-lg mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-medium">Weekly Goal</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatDuration(weeklyStats.totalMinutes)} / {weeklyGoalHours}h
          </span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              weeklyProgress >= 100 ? 'bg-success' : 'bg-primary'
            )}
            style={{ width: `${weeklyProgress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {weeklyProgress >= 100 
            ? 'Goal achieved! Great work this week!' 
            : `${formatDuration(weeklyGoalMinutes - weeklyStats.totalMinutes)} remaining`
          }
        </p>
      </div>

      {/* Heatmap */}
      <div className="p-4 bg-card border border-border rounded-lg mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="font-medium">Activity Heatmap</span>
          <span className="text-xs text-muted-foreground ml-auto">Last 12 weeks</span>
        </div>
        
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-fit">
            {/* Day labels */}
            <div className="flex flex-col gap-1 text-xs text-muted-foreground pr-2">
              <span className="h-3">Mon</span>
              <span className="h-3">Tue</span>
              <span className="h-3">Wed</span>
              <span className="h-3">Thu</span>
              <span className="h-3">Fri</span>
              <span className="h-3">Sat</span>
              <span className="h-3">Sun</span>
            </div>
            
            {heatmapData.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {week.map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={cn(
                      'w-3 h-3 rounded-sm transition-colors cursor-pointer',
                      getHeatmapColor(day.minutes),
                      isToday(day.date) && 'ring-1 ring-primary'
                    )}
                    title={`${format(day.date, 'MMM d, yyyy')}: ${formatDuration(day.minutes)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-secondary" />
          <div className="w-3 h-3 rounded-sm bg-primary/30" />
          <div className="w-3 h-3 rounded-sm bg-primary/50" />
          <div className="w-3 h-3 rounded-sm bg-primary/75" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span>More</span>
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="p-4 bg-card border border-border rounded-lg">
        <h3 className="font-medium mb-4">This Week by Subject</h3>
        
        {sortedSubjects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No study sessions this week
          </p>
        ) : (
          <div className="space-y-3">
            {sortedSubjects.map(([subject, minutes], idx) => {
              const percentage = (minutes / totalSubjectMinutes) * 100
              return (
                <div key={subject}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{subject}</span>
                    <span className="text-muted-foreground">{formatDuration(minutes)}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', subjectColors[idx])}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
