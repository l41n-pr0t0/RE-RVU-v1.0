import { motion } from 'framer-motion'
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useCatalog } from '../lib/catalog'
import { relativeDay } from '../lib/format'
import { NotificationsPanel, useNotifications } from './Notifications'
import { initials } from '../lib/identity'
import { go, href, type Route } from '../lib/router'
import { useStore } from '../lib/store'
import { useOpenEvent } from './EventBits'
import { Stage } from './Stage'
import { ThemeToggle } from './ThemeToggle'
import { Dialog, Icon, Logo, Num, type IconName } from './ui'

const NAV: { key: Route['name']; label: string; icon: IconName }[] = [
  { key: 'home', label: 'Today', icon: 'home' },
  { key: 'events', label: 'Events', icon: 'calendar' },
  { key: 'clubs', label: 'Clubs', icon: 'users' },
  { key: 'projects', label: 'Projects', icon: 'layers' },
]

/** Everything personal lives behind your monogram, the same on every screen size. */
const YOU: { key: Route['name']; label: string; meta: string; icon: IconName }[] = [
  { key: 'profile', label: 'Your profile', meta: 'Skills, links, what you have been to', icon: 'user' },
  { key: 'saved', label: 'Saved', meta: 'Events, notices and projects you kept', icon: 'bookmark' },
  { key: 'calendar', label: 'Your calendar', meta: 'Everything you said yes to', icon: 'calendar' },
  { key: 'notices', label: 'Notices', meta: 'From university offices', icon: 'bell' },
  { key: 'host', label: 'Host dashboard', meta: 'For approved club cores', icon: 'settings' },
]
const UNDER_YOU = YOU.map((y) => y.key)
const YOU_MENU = 'you-menu'

export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { profile, readNotices } = useStore()
  const { notices } = useCatalog()
  const unreadNotices = notices.filter((n) => n.priority === 'High' && !readNotices.includes(n.id)).length
  const { unseen } = useNotifications()
  const totalAlerts = unseen + unreadNotices
  const youActive = UNDER_YOU.includes(route.name)

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

  // A new page closes the menu.
  useEffect(() => {
    const m = document.getElementById(YOU_MENU) as HTMLElement & { hidePopover?: () => void }
    if (m?.matches?.(':popover-open')) m.hidePopover?.()
  }, [route])

  return (
    <div className="relative isolate flex min-h-[100dvh] flex-col">
      <Stage route={route} />
      <div className="motif" data-motif={route.name} aria-hidden />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:bg-gold focus:px-3 focus:py-2 focus:text-black">
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-line-strong bg-ink/85 backdrop-blur-md">
        <div className="wrap flex h-[var(--head-inner)] items-center gap-3 md:gap-4 lg:gap-8">
          <a href={href('home')} aria-label="RVU Connect, today" className="flex shrink-0 items-center gap-3">
            <Logo />
          </a>

          <nav aria-label="Main" className="hidden h-full items-stretch lg:flex">
            {NAV.map((n) => {
              const active = route.name === n.key
              return (
                <a
                  key={n.key}
                  href={href(n.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center px-3 text-[0.7rem] font-bold tracking-[0.14em] uppercase transition-colors xl:px-4 ${active ? 'text-gold' : 'text-mute hover:text-paper'}`}
                >
                  {n.label}
                  {active && (
                    <motion.span layoutId="nav-gold-line" className="absolute inset-x-2 bottom-0 h-[2.5px] bg-gold" transition={{ type: 'spring', stiffness: 500, damping: 38 }} aria-hidden />
                  )}
                </a>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Search everything (Ctrl K or /)"
              className="group flex h-10 w-9 items-center justify-center gap-2.5 border border-line text-sm sm:w-10 md:justify-start md:px-3 text-mute transition-colors hover:border-gold hover:text-paper md:w-56 xl:w-72"
            >
              <Icon name="search" className="h-4 w-4 shrink-0 transition-colors group-hover:text-gold" />
              <span className="hidden md:inline">Search events, clubs, projects</span>
              <kbd className="num ml-auto hidden border border-line px-1.5 py-0.5 text-[0.6rem] xl:inline">/</kbd>
            </button>
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              aria-label={`Notifications${totalAlerts ? `, ${totalAlerts} unread` : ''}`}
              className="relative grid h-10 w-9 place-items-center border border-line text-mute sm:w-10 transition-colors hover:border-gold hover:text-gold"
            >
              <Icon name="bell" className="h-4 w-4" />
              {totalAlerts > 0 && (
                <span className="num absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center bg-gold px-1 text-[0.6rem] font-bold leading-none text-black">
                  {totalAlerts > 9 ? '9+' : totalAlerts}
                </span>
              )}
            </button>
            <ThemeToggle className="!h-10 !w-9 text-mute sm:!w-10" />
            <button
              type="button"
              popoverTarget={YOU_MENU}
              aria-label="You: profile, saved, calendar, settings"
              className={`flex h-10 min-w-9 items-center justify-center gap-2 border px-2 font-display sm:min-w-10 sm:px-2.5 text-sm italic transition-colors ${
                youActive ? 'border-gold bg-gold text-black' : 'border-line hover:border-gold hover:text-gold'
              }`}
            >
              {profile ? initials(profile.name) : 'You'}
              <Icon name="down" className="hidden h-3.5 w-3.5 not-italic md:block" />
            </button>
          </div>
        </div>
      </header>

      <YouMenu route={route} />

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

/** The monogram's menu: native popover, so Escape, outside click and focus come free. */
function YouMenu({ route }: { route: Route }) {
  const { profile } = useStore()
  const close = () => (document.getElementById(YOU_MENU) as HTMLElement & { hidePopover?: () => void })?.hidePopover?.()
  return (
    <div id={YOU_MENU} popover="auto" className="you-menu">
      {profile && (
        <div className="flex items-center gap-3 border-b border-line px-4 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-gold font-display italic text-gold">{initials(profile.name)}</span>
          <span className="min-w-0">
            <span className="block truncate">{profile.name}</span>
            <span className="block truncate text-xs text-mute">{profile.year ? <>Year <Num>{profile.year}</Num> · </> : null}{profile.school.replace('School of ', '')}</span>
          </span>
        </div>
      )}
      <ul className="py-1.5">
        {YOU.map((y) => {
          const active = route.name === y.key
          return (
            <li key={y.key}>
              <a href={href(y.key)} onClick={close} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${active ? 'text-gold' : 'hover:bg-paper/[0.05] hover:text-gold'}`}>
                <Icon name={y.icon} className="h-4 w-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm">{y.label}</span>
                  <span className="block truncate text-xs text-mute">{y.meta}</span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Phone tab bar: the same five sections as the desktop bar. You lives on the monogram up top. */
function MobileTabs({ route }: { route: Route }) {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-ink/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="flex">
        {NAV.map((t) => {
          const active = route.name === t.key
          return (
            <li key={t.key} className="flex-1">
              <a
                href={href(t.key)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1.5 py-1 text-[0.62rem] font-bold tracking-[0.1em] uppercase transition-colors ${active ? 'text-gold' : 'text-mute hover:text-paper'}`}
              >
                {active && <motion.span layoutId="mobile-tab-line" className="absolute top-0 inset-x-4 h-[2.5px] bg-gold" transition={{ type: 'spring', stiffness: 500, damping: 40 }} aria-hidden />}
                <Icon name={t.icon} className="h-5 w-5" />
                <span>{t.label}</span>
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
      ...YOU.map((y) => ({ kind: 'Go to' as const, label: y.label, meta: y.meta, run: () => go(y.key) })),
    ]
    const all: Hit[] = [
      ...events.map((e) => ({ kind: 'Event' as const, label: e.title, meta: `${relativeDay(e.start)} · ${e.hostName}`, run: () => openEvent(e.id) })),
      ...clubs.map((c) => ({ kind: 'Club' as const, label: c.name, meta: `${c.category} · ${c.tagline}`, run: () => go(`clubs/${c.id}`) })),
      ...projects.map((p) => ({ kind: 'Project' as const, label: p.name, meta: [p.status, ...p.stack, ...p.openings.map((o) => o.role)].join(', '), run: () => go(`projects/${p.id}`) })),
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
          placeholder="Events, clubs, projects, skills"
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
