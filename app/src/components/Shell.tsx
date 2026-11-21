import { motion } from 'framer-motion'
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
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
  { key: 'people', label: 'People', icon: 'user' },
  { key: 'notices', label: 'Notices', icon: 'bell' },
]
// Phones: five thumb-reachable tabs. Notices move to the bell in the header.
const TABS: { key: Route['name']; label: string; icon: IconName }[] = [...NAV.slice(0, 4), { key: 'profile', label: 'You', icon: 'user' }]
// Pages reached from the header icons and the You tab, highlighted under "You" on phones
const UNDER_YOU: Route['name'][] = ['profile', 'saved', 'calendar', 'people', 'host', 'notices']

const SLAB = 'polygon(6% 0, 100% 0, 94% 100%, 0 100%)'

export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { profile, readNotices } = useStore()
  const { notices } = useCatalog()
  const unread = notices.filter((n) => n.priority === 'High' && !readNotices.includes(n.id)).length
  const { unseen } = useNotifications()

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

      <header className="sticky top-0 z-40 border-b border-line-strong bg-ink">
        <div className="wrap flex h-16 items-center gap-3 md:h-20 md:gap-6">
          <a href={href('home')} aria-label="RVU Connect, today" className="flex shrink-0 items-center gap-3">
            <Logo className="h-11 md:h-14" />
            <span className="hidden h-7 w-px bg-line-strong xl:block" aria-hidden />
            <span className="hidden font-display text-xl italic xl:block">Connect</span>
          </a>

          <nav aria-label="Main" className="ml-2 hidden h-full items-stretch md:flex lg:ml-6">
            {NAV.map((n) => {
              const active = route.name === n.key
              return (
                <a
                  key={n.key}
                  href={href(n.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center px-3 text-[0.72rem] font-bold tracking-[0.14em] uppercase transition-colors lg:px-4 ${active ? 'text-black' : 'hover-gold text-mute'}`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-slab"
                      className="absolute inset-x-0 inset-y-3 bg-gold"
                      style={{ clipPath: SLAB }}
                      transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                      aria-hidden
                    />
                  )}
                  <span className="relative">{n.label}</span>
                  {n.key === 'notices' && unread > 0 && (
                    <span className={`num relative ml-1.5 px-1 text-[0.62rem] ${active ? 'bg-black text-gold' : 'bg-gold text-black'}`}>{unread}</span>
                  )}
                </a>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Search everything (Ctrl K)"
              className="icon-btn lg:flex lg:w-56 lg:items-center lg:gap-3 lg:px-3"
            >
              <Icon name="search" className="h-[18px] w-[18px]" />
              <span className="hidden text-sm text-mute lg:inline">Search</span>
              <kbd className="num ml-auto hidden border border-line px-1.5 text-[0.64rem] text-mute lg:inline">Ctrl K</kbd>
            </button>
            <a href={href('saved')} aria-label="Saved" aria-current={route.name === 'saved' ? 'page' : undefined} className="icon-btn hidden md:grid" aria-pressed={route.name === 'saved'}>
              <Icon name="bookmark" className="h-[18px] w-[18px]" />
            </a>
            <a href={href('calendar')} aria-label="Your calendar" aria-current={route.name === 'calendar' ? 'page' : undefined} className="icon-btn hidden md:grid" aria-pressed={route.name === 'calendar'}>
              <Icon name="calendar" className="h-[18px] w-[18px]" />
            </a>
            <button onClick={() => setNotifOpen(true)} aria-label={`Notifications${unseen ? `, ${unseen} new` : ''}`} className="icon-btn relative">
              <Icon name="bell" className="h-[18px] w-[18px]" />
              {unseen > 0 && <span className="num absolute -top-1 -right-1 bg-gold px-1 text-[0.6rem] font-semibold text-black">{unseen > 9 ? '9+' : unseen}</span>}
            </button>
            <ThemeToggle />
            <a
              href={href('profile')}
              aria-label="Your profile"
              aria-current={route.name === 'profile' ? 'page' : undefined}
              className={`hidden h-10 min-w-10 place-items-center border px-2 font-display text-sm italic md:grid ${
                route.name === 'profile' ? 'border-gold bg-gold text-black' : 'hover-gold border-line-strong'
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

/** Phone tab bar after MNEMOS-ZERO: square cells, the active one inverted. */
function MobileTabs({ route }: { route: Route }) {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-ink pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="flex">
        {TABS.map((t) => {
          const active = route.name === t.key || (t.key === 'profile' && UNDER_YOU.includes(route.name))
          return (
            <li key={t.key} className="flex-1 border-l border-line first:border-l-0">
              <a
                href={href(t.key)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 text-[0.6rem] font-bold tracking-[0.12em] uppercase ${active ? 'text-black' : 'text-mute'}`}
              >
                {active && <motion.span layoutId="tab-fill" className="absolute inset-0 bg-gold" transition={{ type: 'spring', stiffness: 600, damping: 45 }} aria-hidden />}
                <Icon name={t.icon} className="relative h-[19px] w-[19px]" />
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

type Hit = { kind: 'Event' | 'Past' | 'Club' | 'Project' | 'Person' | 'Notice' | 'Go to'; label: string; meta: string; run: () => void }

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
      { kind: 'Go to', label: 'Your profile', meta: 'Page', run: () => go('profile') },
      { kind: 'Go to', label: 'Saved', meta: 'Events, notices and projects you kept', run: () => go('saved') },
      { kind: 'Go to', label: 'Your calendar', meta: 'Everything you said yes to', run: () => go('calendar') },
      { kind: 'Go to', label: 'Host dashboard', meta: 'For approved club cores', run: () => go('host') },
    ]
    const all: Hit[] = [
      ...events.map((e) => ({ kind: 'Event' as const, label: e.title, meta: `${relativeDay(e.start)} · ${e.hostName}`, run: () => openEvent(e.id) })),
      ...clubs.map((c) => ({ kind: 'Club' as const, label: c.name, meta: `${c.category} · ${c.tagline}`, run: () => go(`clubs/${c.id}`) })),
      ...projects.map((p) => ({ kind: 'Project' as const, label: p.name, meta: [p.status, ...p.stack, ...p.openings.map((o) => o.role)].join(', '), run: () => go(`projects/${p.id}`) })),
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
