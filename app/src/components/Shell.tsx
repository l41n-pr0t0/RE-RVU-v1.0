import { motion } from 'framer-motion'
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { CAMPUS_VENUES } from '../campus/venues'
import { useCatalog } from '../lib/catalog'
import { relativeDay } from '../lib/format'
import { NotificationsPanel, useNotifications } from './Notifications'
import { initials } from '../lib/identity'
import { go, href, type Route } from '../lib/router'
import { useStore } from '../lib/store'
import { useOpenEvent } from './EventBits'
import { ThemeToggle } from './ThemeToggle'
import { Dialog, Icon, Logo, Num, type IconName } from './ui'

const NAV: { key: Route['name']; label: string; icon: IconName }[] = [
  { key: 'home', label: 'Today', icon: 'home' },
  { key: 'events', label: 'Events', icon: 'calendar' },
  { key: 'clubs', label: 'Clubs', icon: 'users' },
  { key: 'projects', label: 'Projects', icon: 'layers' },
  { key: 'map', label: 'Map', icon: 'map' },
  { key: 'people', label: 'People', icon: 'user' },
]

// Phones: five thumb-reachable tabs with Map for instant campus wayfinding
const TABS: { key: Route['name']; label: string; icon: IconName }[] = [
  { key: 'home', label: 'Today', icon: 'home' },
  { key: 'events', label: 'Events', icon: 'calendar' },
  { key: 'map', label: 'Map', icon: 'map' },
  { key: 'clubs', label: 'Clubs', icon: 'users' },
  { key: 'profile', label: 'You', icon: 'user' },
]

// Pages reached from the header icons and the You tab, highlighted under "You" on phones
const UNDER_YOU: Route['name'][] = ['profile', 'saved', 'calendar', 'projects', 'people', 'host', 'notices']

export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { profile, readNotices } = useStore()
  const { notices } = useCatalog()
  const unreadNotices = notices.filter((n) => n.priority === 'High' && !readNotices.includes(n.id)).length
  const { unseen } = useNotifications()
  const totalAlerts = unseen + unreadNotices

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('input, textarea, select, [contenteditable]')
      if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:bg-gold focus:px-3 focus:py-2 focus:text-black">
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-line-strong bg-ink/95 backdrop-blur-md">
        <div className="wrap flex h-16 items-center justify-between gap-2 md:h-20 md:gap-4 lg:gap-6">
          {/* Logo & Brand */}
          <a href={href('home')} aria-label="RVU Connect, today" className="flex shrink-0 items-center gap-3">
            <Logo className="h-10 md:h-13" />
            <span className="hidden h-6 w-px bg-line-strong xl:block" aria-hidden />
            <span className="hidden font-display text-lg italic xl:block">Connect</span>
          </a>

          {/* Primary Navigation - Balanced and Spacious */}
          <nav aria-label="Main" className="hidden h-full items-stretch lg:flex lg:gap-0.5 xl:gap-1">
            {NAV.map((n) => {
              const active = route.name === n.key
              return (
                <a
                  key={n.key}
                  href={href(n.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center px-2.5 text-[0.7rem] font-bold tracking-[0.14em] uppercase transition-colors xl:px-3.5 ${
                    active ? 'text-gold' : 'text-mute hover:text-paper'
                  }`}
                >
                  <span className="relative z-10">{n.label}</span>
                  {active && (
                    <motion.span
                      layoutId="nav-gold-line"
                      className="absolute inset-x-1.5 bottom-0 h-[2.5px] bg-gold"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      aria-hidden
                    />
                  )}
                </a>
              )
            })}
          </nav>

          {/* Utility Controls Cluster */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Quick Search Trigger */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Search everything (Ctrl K)"
              className="group flex h-9.5 items-center gap-2 border border-line bg-paper/[0.03] px-2.5 text-xs text-mute transition-colors hover:border-gold hover:text-paper md:h-10 xl:w-44 2xl:w-52"
            >
              <Icon name="search" className="h-4 w-4 shrink-0 text-mute transition-colors group-hover:text-gold" />
              <span className="hidden xl:inline font-sans text-xs">Search...</span>
              <kbd className="num ml-auto hidden border border-line px-1.5 py-0.5 text-[0.6rem] text-mute transition-colors group-hover:border-gold/50 xl:inline">
                Ctrl K
              </kbd>
            </button>

            {/* Architectural Control Strip */}
            <div className="flex h-9.5 items-center border border-line divide-x divide-line bg-paper/[0.03] md:h-10">
              <a
                href={href('saved')}
                aria-label="Saved items"
                aria-current={route.name === 'saved' ? 'page' : undefined}
                className={`hidden xl:grid h-full w-9.5 md:w-10 place-items-center text-mute transition-colors hover:text-gold hover:bg-paper/[0.04] ${
                  route.name === 'saved' ? 'text-gold bg-gold/10' : ''
                }`}
              >
                <Icon name="bookmark" className="h-4 w-4" />
              </a>
              <a
                href={href('calendar')}
                aria-label="Your calendar"
                aria-current={route.name === 'calendar' ? 'page' : undefined}
                className={`hidden xl:grid h-full w-9.5 md:w-10 place-items-center text-mute transition-colors hover:text-gold hover:bg-paper/[0.04] ${
                  route.name === 'calendar' ? 'text-gold bg-gold/10' : ''
                }`}
              >
                <Icon name="calendar" className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setNotifOpen(true)}
                aria-label={`Notifications and notices${totalAlerts ? `, ${totalAlerts} unread` : ''}`}
                className="relative grid h-full w-9.5 md:w-10 place-items-center text-mute transition-colors hover:text-gold hover:bg-paper/[0.04]"
              >
                <Icon name="bell" className="h-4 w-4" />
                {totalAlerts > 0 && (
                  <span className="num absolute top-1.5 right-1.5 flex h-3.5 min-w-[0.875rem] items-center justify-center bg-gold px-0.5 text-[0.55rem] font-bold text-black leading-none">
                    {totalAlerts > 9 ? '9+' : totalAlerts}
                  </span>
                )}
              </button>
              <ThemeToggle className="!h-full !w-9.5 md:!w-10 !border-0 text-mute hover:text-gold hover:bg-paper/[0.04]" />
            </div>

            {/* Monogram Profile */}
            <a
              href={href('profile')}
              aria-label="Your profile"
              aria-current={route.name === 'profile' ? 'page' : undefined}
              className={`flex h-9.5 min-w-9.5 items-center justify-center border px-2.5 font-display text-xs italic transition-colors md:h-10 md:min-w-10 md:text-sm ${
                route.name === 'profile'
                  ? 'border-gold bg-gold text-black font-semibold'
                  : 'border-line text-paper hover:border-gold hover:text-gold bg-paper/[0.03]'
              }`}
            >
              {profile ? initials(profile.name) : 'You'}
            </a>
          </div>
        </div>
      </header>

      <main id="main" className="wrap flex-1">
        {children}
      </main>

      <footer className="pb-tabs mt-20 border-t border-line">
        <div className="wrap flex flex-col justify-between gap-2 py-8 text-sm text-mute md:flex-row">
          <p>RV University · Bengaluru Campus | Mysuru Campus</p>
          <p>Office of Student Affairs · Prototype for RE:RVU v1.0</p>
        </div>
      </footer>

      <MobileTabs route={route} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  )
}

/** Phone tab bar: thumb-reachable, signature gold indicator, zero congestion */
function MobileTabs({ route }: { route: Route }) {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-ink/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="flex">
        {TABS.map((t) => {
          const active = route.name === t.key || (t.key === 'profile' && UNDER_YOU.includes(route.name))
          return (
            <li key={t.key} className="flex-1">
              <a
                href={href(t.key)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1.5 py-1 text-[0.64rem] font-bold tracking-[0.1em] uppercase transition-colors ${
                  active ? 'text-gold' : 'text-mute hover:text-paper'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-tab-line"
                    className="absolute top-0 inset-x-4 h-[2.5px] bg-gold"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    aria-hidden
                  />
                )}
                <Icon name={t.icon} className="relative h-5 w-5" />
                <span className="relative">{t.label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* ---------- Command palette: one search across everything (F10) ---------- */

type Hit = { kind: 'Event' | 'Past' | 'Club' | 'Project' | 'Person' | 'Notice' | 'Venue' | 'Go to'; label: string; meta: string; run: () => void }

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId()
  return (
    <Dialog open={open} onClose={onClose} variant="palette" labelledBy={titleId}>
      <PaletteBody titleId={titleId} onClose={onClose} />
    </Dialog>
  )
}

function PaletteBody({ titleId, onClose }: { titleId: string; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)
  const openEvent = useOpenEvent()
  const { events, pastEvents, clubs, projects, students, notices } = useCatalog()

  const hits = useMemo<Hit[]>(() => {
    const s = q.trim().toLowerCase()
    const nav: Hit[] = [
      ...NAV.map((n) => ({ kind: 'Go to' as const, label: n.label, meta: 'Page', run: () => go(n.key) })),
      { kind: 'Go to', label: 'Campus Map & Wayfinder', meta: 'Interactive 3D campus & building guide', run: () => go('map') },
      { kind: 'Go to', label: 'Your profile', meta: 'Page', run: () => go('profile') },
      { kind: 'Go to', label: 'Saved', meta: 'Events, notices and projects you kept', run: () => go('saved') },
      { kind: 'Go to', label: 'Your calendar', meta: 'Everything you said yes to', run: () => go('calendar') },
      { kind: 'Go to', label: 'Host dashboard', meta: 'For approved club cores', run: () => go('host') },
    ]
    const all: Hit[] = [
      ...events.map((e) => ({ kind: 'Event' as const, label: e.title, meta: `${relativeDay(e.start)} · ${e.hostName}`, run: () => openEvent(e.id) })),
      ...clubs.map((c) => ({ kind: 'Club' as const, label: c.name, meta: `${c.category} · ${c.tagline}`, run: () => go(`clubs/${c.id}`) })),
      ...projects.map((p) => ({ kind: 'Project' as const, label: p.name, meta: [p.status, ...p.stack, ...p.openings.map((o) => o.role)].join(', '), run: () => go(`projects/${p.id}`) })),
      ...CAMPUS_VENUES.map((v) => ({ kind: 'Venue' as const, label: v.place.name, meta: `${v.category} · ${v.description}`, run: () => go('map') })),
      ...students.map((p) => ({ kind: 'Person' as const, label: p.name, meta: p.skills.join(', '), run: () => go(`people/${p.id}`) })),
      ...pastEvents.map((e) => ({ kind: 'Past' as const, label: e.title, meta: `${e.hostName} · archive`, run: () => openEvent(e.id) })),
      ...notices.map((n) => ({ kind: 'Notice' as const, label: n.title, meta: n.from, run: () => go('notices') })),
    ]
    if (!s) return [...nav, ...all.filter((h) => h.kind === 'Event').slice(0, 4)]
    return [...nav, ...all].filter((h) => `${h.label} ${h.meta} ${h.kind}`.toLowerCase().includes(s)).slice(0, 12)
  }, [q, openEvent, events, pastEvents, clubs, projects, students, notices])

  useEffect(() => setI(0), [q])
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [i])

  const pick = (h?: Hit) => {
    if (!h) return
    onClose()
    h.run()
  }

  return (
    <div className="border border-line-strong bg-slate-2">
      <h2 id={titleId} className="sr-only">Search everything</h2>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Icon name="search" className="h-5 w-5 shrink-0 text-gold" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setI((x) => Math.min(x + 1, hits.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setI((x) => Math.max(x - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              pick(hits[i])
            }
          }}
          placeholder="Events, clubs, projects, people, skills"
          aria-label="Search"
          aria-controls="palette-list"
          aria-activedescendant={hits[i] ? `hit-${i}` : undefined}
          role="combobox"
          aria-expanded="true"
          className="h-14 w-full bg-transparent text-base text-paper placeholder:text-mute focus:outline-none"
        />
        <kbd className="num hidden border border-line px-1.5 text-[0.66rem] text-mute sm:inline">Esc</kbd>
      </div>
      <ul id="palette-list" ref={listRef} role="listbox" aria-label="Results" className="max-h-[55dvh] overflow-y-auto overscroll-contain py-1">
        {hits.length === 0 && <li className="px-4 py-8 text-center text-mute">Nothing matches “{q}”. Try a club name or a day.</li>}
        {hits.map((h, idx) => (
          <li key={`${h.kind}-${h.label}`} id={`hit-${idx}`} data-i={idx} role="option" aria-selected={idx === i}>
            <button
              onMouseMove={() => setI(idx)}
              onClick={() => pick(h)}
              tabIndex={-1}
              className={`grid w-full grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-3 px-4 py-2.5 text-left ${idx === i ? 'bg-gold text-black' : ''}`}
            >
              <span className={`text-[0.6rem] font-bold tracking-[0.14em] uppercase ${idx === i ? 'text-black/70' : 'text-mute'}`}>{h.kind}</span>
              <span className="min-w-0">
                <span className="block truncate">{h.label}</span>
                <span className={`block truncate text-xs ${idx === i ? 'text-black/70' : 'text-mute'}`}>{h.meta}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="flex gap-4 border-t border-line px-4 py-2 text-[0.68rem] text-mute">
        <span><Num>↑ ↓</Num> move</span>
        <span>Enter open</span>
        <span>Esc close</span>
      </p>
    </div>
  )
}
