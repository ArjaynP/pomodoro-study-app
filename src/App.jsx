import { useEffect, useState } from 'react'
import { Analytics } from './components/Analytics'
import { AmbientPlayer } from './components/AmbientPlayer'
import { SessionLog } from './components/SessionLog'
import { SessionSummaryCard } from './components/SessionSummaryCard'
import { Settings } from './components/Settings'
import { TaskManager } from './components/TaskManager'
import { Timer } from './components/Timer'
import { AppProvider, useAppContext } from './context/AppContext'

const tabs = ['Timer', 'Tasks', 'Analytics', 'SessionLog', 'Settings']

const AppShell = () => {
  const { state } = useAppContext()
  const [activeTab, setActiveTab] = useState('Timer')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.darkMode)
  }, [state.settings.darkMode])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.2),_transparent_48%),radial-gradient(circle_at_top_left,_rgba(251,191,36,0.15),_transparent_42%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-6 text-slate-900 dark:bg-[radial-gradient(circle_at_top_right,_rgba(8,145,178,0.22),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(14,116,144,0.16),_transparent_48%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-lg backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/65">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-700 dark:text-cyan-300">
                Study Command Center
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl">Pomodoro Flow Studio</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Focus timer, task planning, distraction capture, and local-first analytics.
              </p>
            </div>
            <div className="text-right text-sm text-slate-600 dark:text-slate-300">
              <p>{state.sessions.length} sessions logged</p>
              <p>{state.tasks.filter((task) => !task.completed).length} active tasks</p>
            </div>
          </div>
        </header>

        <SessionSummaryCard />

        {state.settings.zenMode ? (
          <div className="space-y-4">
            <Timer />
            <AmbientPlayer />
          </div>
        ) : (
          <>
            <nav className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    activeTab === tab
                      ? 'bg-cyan-600 text-white'
                      : 'bg-white/80 text-slate-700 hover:bg-cyan-100 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div className="space-y-4">
              {activeTab === 'Timer' ? <Timer /> : null}
              {activeTab === 'Tasks' ? <TaskManager /> : null}
              {activeTab === 'Analytics' ? <Analytics /> : null}
              {activeTab === 'SessionLog' ? <SessionLog /> : null}
              {activeTab === 'Settings' ? <Settings /> : null}
              <AmbientPlayer />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}

export default App
