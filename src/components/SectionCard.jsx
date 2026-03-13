export const SectionCard = ({ title, subtitle, actions, children }) => {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-slate-900 dark:text-slate-100">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  )
}
