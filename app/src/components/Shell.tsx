import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { clubs, events, notices, projects } from '../data/mock'
import { relativeDay } from '../lib/format'
import { go, href, type Route } from '../lib/router'
import { useStore } from '../lib/store'
import { useOpenEvent } from './EventBits'
import { ThemeToggle } from './ThemeToggle'
import { DOLLY, Icon, Logo } from './ui'

const NAV = [
  { key: 'home', label: 'Today' },
  { key: 'events', label: 'Events' },
  { key: 'clubs', label: 'Clubs' },
  { key: 'projects', label: 'Projects' },
  { key: 'notices', label: 'Notices' },
] as const

export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { profile, readNotices } = useStore()
  const unread = notices.filter((n) => n.priority === 'High' && !readNotices.includes(n.id)).length

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('input, textarea, select')
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-[100dvh] pb-24 md:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 md:h-20 md:px-8">
          <a href={href('home')} aria-label="RVU Connect home" className="flex items-center gap-3">
            <Logo className="h-9 md:h-11" />
            <span className="hidden border-l border-line pl-3 text-sm text-mute lg:block">Connect</span>
          </a>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active = route.name === n.key
              return (
                <a
                  key={n.key}
                  href={href(n.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative px-3 py-2 text-sm transition-colors ${active ? 'text-paper' : 'text-mute hover:text-paper'}`}
                >
                  {n.label}
                  {n.key === 'notices' && unread > 0 && (
                    <span className="num ml-1.5 rounded-full bg-gold px-1.5 text-[0.68rem] font-bold text-ink">{unread}</span>
                  )}
                  {active && <motion.span layoutId="navline" className="absolute inset-x-3 -bottom-[1.45rem] h-px bg-gold" />}
                </a>
              )
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex h-10 items-center gap-3 rounded-full border border-line px-3 text-sm text-mute transition-colors hover:border-gold hover:text-paper md:w-64"
            >
              <Icon name="search" className="h-[18px] w-[18px]" />
              <span className="hidden md:inline">Search everything</span>
              <kbd className="num ml-auto hidden rounded border border-line px-1.5 text-[0.7rem] md:inline">Ctrl K</kbd>
            </button>
            <ThemeToggle />
            <a
              href={href('profile')}
              aria-label="Your profile"
              className={`grid h-10 w-10 place-items-center rounded-full border font-display italic transition-colors ${
                route.name === 'profile' ? 'border-gold text-gold' : 'border-line text-paper hover:border-gold'
              }`}
            >
              {profile?.name.trim()[0]?.toUpperCase() ?? 'R'}
            </a>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-7xl px-5 md:px-8">
        {children}
      </main>

      <footer className="mx-auto mt-24 max-w-7xl border-t border-line px-5 py-10 text-sm text-mute md:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <p>RV University · Bengaluru Campus | Mysuru Campus</p>
          <p>Office of Student Affairs · Built by Iterium · Prototype for RE:RVU v1.0</p>
        </div>
      </footer>

      {/* Mobile tab bar: thumb-reachable primary nav */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map((n) => {
            const active = route.name === n.key
            return (
              <li key={n.key}>
                <a
                  href={href(n.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex h-16 flex-col items-center justify-center text-xs ${active ? 'text-gold' : 'text-mute'}`}
                >
                  {active && <span className="absolute top-0 h-px w-8 bg-gold" />}
                  {n.label}
                  {n.key === 'notices' && unread > 0 && <span className="num absolute top-3 right-[22%] h-2 w-2 rounded-full bg-gold" aria-label={`${unread} unread`} />}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}

/* ---------- Command palette: one search across everything (F10) ---------- */

type Hit = { kind: 'Event' | 'Club' | 'Project' | 'Notice' | 'Go to'; label: string; meta: string; run: () => void }

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const openEvent = useOpenEvent()

  useEffect(() => {
    if (open) {
      setQ('')
      setI(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const hits = useMemo<Hit[]>(() => {
    const t = q.trim().toLowerCase()
    const all: Hit[] = [
      ...NAV.map((n) => ({ kind: 'Go to' as const, label: n.label, meta: 'Page', run: () => go(n.key) })),
      ...events.map((e) => ({ kind: 'Event' as const, label: e.title, meta: `${relativeDay(e.start)} · ${e.hostName}`, run: () => openEvent(e.id) })),
      ...clubs.map((c) => ({ kind: 'Club' as const, label: c.name, meta: c.tagline, run: () => go(`clubs/${c.id}`) })),
      ...projects.map((p) => ({ kind: 'Project' as const, label: p.title, meta: `Needs ${p.roles.join(', ')}`, run: () => go(`projects/${p.id}`) })),
      ...notices.map((n) => ({ kind: 'Notice' as const, label: n.title, meta: n.from, run: () => go('notices') })),
    ]
    if (!t) return all.filter((h) => h.kind === 'Go to' || h.kind === 'Event').slice(0, 9)
    return all.filter((h) => `${h.label} ${h.meta} ${h.kind}`.toLowerCase().includes(t)).slice(0, 12)
  }, [q, openEvent])

  const choose = (h?: Hit) => {
    if (!h) return
    onClose()
    h.run()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[55] flex items-start justify-center px-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/75 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search RVU Connect"
            className="panel relative w-full max-w-xl overflow-hidden shadow-2xl"
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.3, ease: DOLLY }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'ArrowDown') (e.preventDefault(), setI((x) => Math.min(x + 1, hits.length - 1)))
              if (e.key === 'ArrowUp') (e.preventDefault(), setI((x) => Math.max(x - 1, 0)))
              if (e.key === 'Enter') choose(hits[i])
            }}
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Icon name="search" className="h-5 w-5 text-gold" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => (setQ(e.target.value), setI(0))}
                placeholder="Search events, clubs, projects, notices"
                className="h-14 w-full bg-transparent text-paper placeholder:text-mute focus:outline-none"
                aria-label="Search"
              />
              <kbd className="num rounded border border-line px-1.5 text-[0.7rem] text-mute">Esc</kbd>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
              {hits.length === 0 && <li className="px-4 py-8 text-center text-mute">Nothing matches “{q}”. Try a club name or a day, such as Friday.</li>}
              {hits.map((h, idx) => (
                <li key={h.kind + h.label} role="option" aria-selected={idx === i}>
                  <button
                    onMouseEnter={() => setI(idx)}
                    onClick={() => choose(h)}
                    className={`flex w-full items-baseline gap-3 rounded-lg px-3 py-2.5 text-left ${idx === i ? 'bg-slate' : ''}`}
                  >
                    <span className="w-16 shrink-0 text-[0.7rem] uppercase tracking-[0.14em] text-gold">{h.kind}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-paper">{h.label}</span>
                      <span className="block truncate text-xs text-mute">{h.meta}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
