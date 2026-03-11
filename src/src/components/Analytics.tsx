import { useMemo } from 'react'
import { Flame, Trophy, Target, Clock, TrendingUp, Calendar } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { formatDuration, getStreakDays, isSameDay, cn } from '@/lib/utils'
import { 
  format, 
  startOfYear, 
  eachDayOfInterval, 
  getDay, 
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  subDays
} from 'date-fns'

export default function Analytics() {
  const { state } = useApp()
  const { sessions, settings } = state

  const stats = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)

    // Weekly stats
    const weekSessions = sessions.filter(s => 
      isWithinInterval(new Date(s.timestamp), { start: weekStart, end: weekEnd })
    )
    const weekMinutes = weekSessions.reduce((acc, s) => acc + Math.floor(s.duration / 60), 0)
    const weekGoalProgress = (weekMinutes / 60) / settings.weeklyGoalHours * 100

    // Today stats
    const todaySessions = sessions.filter(s => isSameDay(new Date(s.timestamp), now))
    const todayMinutes = todaySessions.reduce((acc, s) => acc + Math.floor(s.duration / 60), 0)

    // Personal bests
    const longestSession = sessions.reduce((max, s) => 
      s.duration > max ? s.duration : max, 0
    )

    const sessionsPerDay = sessions.reduce((acc, s) => {
      const day = format(new Date(s.timestamp), 'yyyy-MM-dd')
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const mostSessionsInDay = Math.max(0, ...Object.values(sessionsPerDay))

    // Subject breakdown
    const subjectMinutes = sessions.reduce((acc, s) => {
      acc[s.subject] = (acc[s.subject] || 0) + Math.floor(s.duration / 60)
      return acc
    }, {} as Record<string, number>)

    const sortedSubjects = Object.entries(subjectMinutes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Streak
    const streak = getStreakDays(sessions)

    return {
      streak,
      weekMinutes,
      weekGoalProgress,
      todayMinutes,
      todaySessions: todaySessions.length,
      longestSession,
      mostSessionsInDay,
      sortedSubjects,
      totalMinutes: sessions.reduce((acc, s) => acc + Math.floor(s.duration / 60), 0),
      totalSessions: sessions.length
    }
  }, [sessions, settings.weeklyGoalHours])

  // Generate heatmap data for the last year
  const heatmapData = useMemo(() => {
    const today = new Date()
    const yearAgo = subDays(today, 364)
    const days = eachDayOfInterval({ start: yearAgo, end: today })
    
    const sessionsByDay = sessions.reduce((acc, s) => {
      const day = format(new Date(s.timestamp), 'yyyy-MM-dd')
      acc[day] = (acc[day] || 0) + Math.floor(s.duration / 60)
      return acc
    }, {} as Record<string, number>)

    return days.map(day => ({
      date: day,
      dateStr: format(day, 'yyyy-MM-dd'),
      minutes: sessionsByDay[format(day, 'yyyy-MM-dd')] || 0,
      dayOfWeek: getDay(day)
    }))
  }, [sessions])

  const getHeatmapColor = (minutes: number) => {
    if (minutes === 0) return 'bg-muted'
    if (minutes < 30) return 'bg-primary/30'
    if (minutes < 60) return 'bg-primary/50'
    if (minutes < 120) return 'bg-primary/70'
    return 'bg-primary'
  }

  const maxMinutes = Math.max(...heatmapData.map(d => d.minutes), 1)

  return (
    <div className="bg-card rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Analytics</h2>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-secondary/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Streak</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.streak}</p>
          <p className="text-xs text-muted-foreground">days</p>
        </div>

        <div className="p-4 bg-secondary/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-accent" />
            <span className="text-sm text-muted-foreground">Today</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{formatDuration(stats.todayMinutes)}</p>
          <p className="text-xs text-muted-foreground">{stats.todaySessions} sessions</p>
        </div>

        <div className="p-4 bg-secondary/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-warning" />
            <span className="text-sm text-muted-foreground">Best Session</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {formatDuration(Math.floor(stats.longestSession / 60))}
          </p>
          <p className="text-xs text-muted-foreground">longest focus</p>
        </div>

        <div className="p-4 bg-secondary/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-chart-3" />
            <span className="text-sm text-muted-foreground">Total</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{formatDuration(stats.totalMinutes)}</p>
          <p className="text-xs text-muted-foreground">{stats.totalSessions} sessions</p>
        </div>
      </div>

      {/* Weekly Goal */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">Weekly Goal</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatDuration(stats.weekMinutes)} / {settings.weeklyGoalHours}h
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(stats.weekGoalProgress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {stats.weekGoalProgress >= 100 
            ? 'Goal achieved!'
            : `${Math.round(stats.weekGoalProgress)}% complete`
          }
        </p>
      </div>

      {/* Subject Breakdown */}
      {stats.sortedSubjects.length > 0 && (
        <div className="mb-8">
          <h3 className="flex items-center gap-2 font-medium text-foreground mb-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            Time by Subject
          </h3>
          <div className="space-y-3">
            {stats.sortedSubjects.map(([subject, minutes]) => {
              const percentage = (minutes / stats.totalMinutes) * 100
              return (
                <div key={subject}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{subject}</span>
                    <span className="text-sm text-muted-foreground">{formatDuration(minutes)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Activity Heatmap */}
      <div>
        <h3 className="flex items-center gap-2 font-medium text-foreground mb-4">
          <Flame className="w-5 h-5 text-muted-foreground" />
          Activity Heatmap
        </h3>
        
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-0.5 min-w-max">
            {/* Group by weeks */}
            {Array.from({ length: 53 }, (_, weekIndex) => {
              const weekDays = heatmapData.slice(weekIndex * 7, (weekIndex + 1) * 7)
              if (weekDays.length === 0) return null
              
              return (
                <div key={weekIndex} className="flex flex-col gap-0.5">
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const dayData = weekDays.find(d => d.dayOfWeek === dayIndex)
                    if (!dayData) {
                      return <div key={dayIndex} className="w-3 h-3" />
                    }
                    
                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "w-3 h-3 rounded-sm transition-colors cursor-pointer",
                          getHeatmapColor(dayData.minutes)
                        )}
                        title={`${format(dayData.date, 'MMM d, yyyy')}: ${formatDuration(dayData.minutes)}`}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-primary/30" />
            <div className="w-3 h-3 rounded-sm bg-primary/50" />
            <div className="w-3 h-3 rounded-sm bg-primary/70" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Personal Bests */}
      <div className="mt-8 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl">
        <h3 className="flex items-center gap-2 font-medium text-foreground mb-3">
          <Trophy className="w-5 h-5 text-warning" />
          Personal Bests
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Longest Session</p>
            <p className="text-lg font-bold text-foreground">
              {formatDuration(Math.floor(stats.longestSession / 60))}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Most Sessions/Day</p>
            <p className="text-lg font-bold text-foreground">{stats.mostSessionsInDay}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
