import { toLocalDateKey } from './helpers'

const startOfWeek = (date) => {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = (day + 6) % 7
  copy.setDate(copy.getDate() - diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export const getSessionsByDay = (sessions) => {
  const dayMap = {}
  sessions.forEach((session) => {
    const key = toLocalDateKey(session.startTime)
    dayMap[key] = dayMap[key] || { minutes: 0, sessions: 0, subjects: {} }
    dayMap[key].minutes += session.durationMinutes
    dayMap[key].sessions += 1
    dayMap[key].subjects[session.subject || 'General'] =
      (dayMap[key].subjects[session.subject || 'General'] || 0) + session.durationMinutes
  })
  return dayMap
}

export const getStreak = (sessions) => {
  const dayMap = getSessionsByDay(sessions)
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  while (true) {
    const key = toLocalDateKey(cursor.toISOString())
    if (!dayMap[key]) {
      break
    }
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export const getWeeklyMinutes = (sessions) => {
  const start = startOfWeek(new Date())
  return sessions
    .filter((session) => new Date(session.startTime) >= start)
    .reduce((sum, session) => sum + session.durationMinutes, 0)
}

export const getWeeklySubjectBreakdown = (sessions) => {
  const start = startOfWeek(new Date())
  const map = {}
  sessions
    .filter((session) => new Date(session.startTime) >= start)
    .forEach((session) => {
      const key = session.subject || 'General'
      map[key] = (map[key] || 0) + session.durationMinutes
    })

  return Object.entries(map)
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
}

export const getPersonalBests = (sessions) => {
  if (!sessions.length) {
    return {
      longestSession: 0,
      mostSessionsDay: 0,
    }
  }

  const longestSession = Math.max(...sessions.map((session) => session.durationMinutes))
  const byDay = Object.values(getSessionsByDay(sessions)).map((entry) => entry.sessions)
  const mostSessionsDay = Math.max(...byDay, 0)

  return { longestSession, mostSessionsDay }
}

export const getHeatmapCells = (sessions, totalDays = 140) => {
  const byDay = getSessionsByDay(sessions)
  const end = new Date()
  end.setHours(0, 0, 0, 0)

  const cells = []
  for (let index = totalDays - 1; index >= 0; index -= 1) {
    const day = new Date(end)
    day.setDate(end.getDate() - index)
    const key = toLocalDateKey(day.toISOString())
    const minutes = byDay[key]?.minutes || 0
    let level = 0
    if (minutes >= 180) level = 4
    else if (minutes >= 120) level = 3
    else if (minutes >= 60) level = 2
    else if (minutes > 0) level = 1

    cells.push({
      key,
      minutes,
      dayOfWeek: day.getDay(),
      level,
    })
  }

  return cells
}
