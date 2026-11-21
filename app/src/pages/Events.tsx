import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ClubCover } from '../components/ClubCover'
import { isOpen, RsvpButton, SaveButton, SeatMeter, seatsLeft, StatusTag, useOpenEvent, useRsvp } from '../components/EventBits'
import { DOLLY, EmptyState, ErrorState, Icon, Num } from '../components/ui'
import { CATEGORIES, type CampusEvent, type Category, type ClubLook } from '../data/types'
import { useCatalog } from '../lib/catalog'
import { dayMonth, daysFrom, longDate, relativeDay, time, weekday } from '../lib/format'
import { useQuery, useStore } from '../lib/store'

/**
 * Sc. 03: Events.
 * 1. Spotlight: the events about to happen, one at a time, drawn in the host club's own theme.
 * 2. Shelves: starting soon, and the ones filling fastest.
 * 3. The calendar: every event under its date, with a date strip to jump along.
 */

const SCHOOL_LOOK: ClubLook = { theme: 'night-gold', layout: 'cover', pattern: 'rays', type: 'classic' }
const initials = (s: string) => s.replace(/^School of /, '').split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join('').slice(0, 2) || s.slice(0, 2)

function useHostLook() {
  const { hostOf, clubPage } = useCatalog()
  return (e: CampusEvent) => {
    const c = hostOf(e)
    return c ? { look: clubPage(c.id).look, mono: c.mono, category: c.category, name: c.name } : { look: SCHOOL_LOOK, mono: initials(e.hostName), category: e.category, name: e.hostName }
  }
}

function startsLabel(e: CampusEvent, now: Date) {
  if (e.start <= now && e.end > now) return 'Happening now'
  const mins = Math.round((+e.start - +now) / 60_000)
  if (mins < 60) return `Starts in ${mins} min`
  if (mins < 6 * 60) return `Starts in ${Math.round(mins / 60)} h`
  const d = daysFrom(e.start, now)
  if (d === 0) return 'Tonight'
  if (d === 1) return 'Tomorrow'
  return weekday(e.start, 'long')
}

export default function Events({ id }: { id?: string }) {
  const openEvent = useOpenEvent()
  const { events, pastEvents } = useCatalog()
  const q = useQuery(events)
  const [now] = useState(() => new Date())

  useEffect(() => {
    if (id) openEvent(id)
  }, [id, openEvent])

  // About to happen, weighted to the next three days, then by how much room is left.
  const spotlight = useMemo(() => {
    return [...events]
      .filter((e) => daysFrom(e.start, now) <= 7 && e.registrationOpen)
      .map((e) => {
        const hours = Math.max(0, (+e.start - +now) / 3_600_000)
        const fill = e.registered / e.seats
        return { e, score: 10 / (hours + 6) + fill * 0.6 + (e.kind === 'School event' ? 0.2 : 0) }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.e)
      .sort((a, b) => +a.start - +b.start)
  }, [events, now])

  const soon = events.filter((e) => daysFrom(e.start, now) <= 3).slice(0, 10)
  const filling = [...events].filter((e) => e.registrationOpen).sort((a, b) => b.registered / b.seats - a.registered / a.seats).slice(0, 5)

  return (
    <div className="pb-16">
      <h1 className="sr-only">Events</h1>
      {q.status === 'loading' ? (
        <div className="skeleton mt-6 h-[28rem]" aria-busy="true" aria-label="Loading events" />
      ) : q.status === 'error' ? (
        <div className="mt-8"><ErrorState onRetry={q.retry} /></div>
      ) : spotlight.length ? (
        <Spotlight items={spotlight} now={now} />
      ) : null}

      {soon.length > 0 && (
        <section aria-labelledby="soon" className="mt-14">
          <ShelfTitle id="soon" title="Starting soon" note="Next three days" />
          <ul className="no-scrollbar -mx-[clamp(1rem,0.6rem+2vw,2.5rem)] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[clamp(1rem,0.6rem+2vw,2.5rem)] pb-2">
            {soon.map((e) => (
              <li key={e.id} className="w-[17rem] shrink-0 snap-start md:w-[19rem]">
                <Capsule e={e} now={now} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {filling.length > 0 && (
        <section aria-labelledby="filling" className="mt-14">
          <ShelfTitle id="filling" title="Filling fast" note="By seats taken" />
          <ol className="grid gap-x-8 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr]">
            {filling.map((e, i) => <Ranked key={e.id} e={e} rank={i + 1} wide={i === 0} />)}
          </ol>
        </section>
      )}

      <Calendar events={events} past={pastEvents} now={now} />
    </div>
  )
}

function ShelfTitle({ id, title, note }: { id: string; title: string; note: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-line pb-3">
      <h2 id={id} className="text-2xl md:text-3xl">{title}</h2>
      <p className="eyebrow">{note}</p>
    </div>
  )
}

/* ---------- Spotlight ---------- */

const SLIDE_MS = 7000

function Spotlight({ items, now }: { items: CampusEvent[]; now: Date }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduce = useReducedMotion()
  const host = useHostLook()
  const openEvent = useOpenEvent()
  const { profile } = useStore()
  const e = items[i % items.length]
  const h = host(e)
  const state = useRsvp(e)
  const go = useCallback((n: number) => setI((n + items.length) % items.length), [items.length])
  const timer = useRef<number>(0)

  useEffect(() => {
    if (reduce || paused || items.length < 2) return
    timer.current = window.setTimeout(() => go(i + 1), SLIDE_MS)
    return () => window.clearTimeout(timer.current)
  }, [i, paused, reduce, go, items.length])

  const left = seatsLeft(e)
  const fill = e.registered / e.seats

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Coming up"
      className="relative mt-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(k) => {
        if (k.key === 'ArrowRight') go(i + 1)
        if (k.key === 'ArrowLeft') go(i - 1)
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-px bg-line lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="relative min-h-[30rem] overflow-hidden md:min-h-[34rem]">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={e.id}
              className="absolute inset-0"
              initial={reduce ? false : { opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.9, ease: DOLLY }}
            >
              <ClubCover club={{ name: h.name, mono: h.mono, category: h.category }} look={h.look} live className="h-full">
                <div className="relative flex h-full flex-col justify-end p-5 md:p-10">
                  <span aria-hidden className="club-display pointer-events-none absolute top-2 right-4 text-[clamp(8rem,4rem+16vw,20rem)] leading-none text-paper/10 md:right-10">{h.mono}</span>
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: DOLLY, delay: 0.15 }}
                    className="max-w-[44rem]"
                  >
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="tag tag-gold">{startsLabel(e, now)}</span>
                      {fill >= 0.85 && left > 0 && <span className="tag">Almost full</span>}
                      {left === 0 && <span className="tag">Full · waitlist</span>}
                    </p>
                    <h2 className="mt-4 font-display text-[clamp(2.4rem,1.6rem+3.4vw,4.8rem)] leading-[0.98]">{e.title}</h2>
                    <dl className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <Meta k="Date"><Num>{longDate(e.start)}</Num></Meta>
                      <Meta k="Time"><Num>{time(e.start)}</Num></Meta>
                      <Meta k="Venue">{e.venue}</Meta>
                      <Meta k="Host">{e.hostName}</Meta>
                      <Meta k="Seats left"><Num>{left}</Num> of <Num>{e.seats}</Num></Meta>
                    </dl>
                    <p className="mt-4 line-clamp-2 max-w-[56ch] leading-relaxed text-mute">{e.summary}</p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <RsvpButton e={e} state={state} guest={!profile?.email} />
                      <button type="button" className="btn" onClick={() => openEvent(e.id)}>Details <Icon name="arrow" className="h-4 w-4" /></button>
                      <SaveButton id={e.id} />
                    </div>
                  </motion.div>
                </div>
              </ClubCover>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col bg-ink">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="num text-sm" aria-live="polite"><span className="text-gold">{String(i + 1).padStart(2, '0')}</span> <span className="text-mute">/ {String(items.length).padStart(2, '0')}</span></p>
            <div className="flex gap-1">
              <button type="button" className="icon-btn !h-9 !w-9" aria-label="Previous" onClick={() => go(i - 1)}><Icon name="arrow-left" className="h-4 w-4" /></button>
              <button type="button" className="icon-btn !h-9 !w-9" aria-label="Next" onClick={() => go(i + 1)}><Icon name="arrow" className="h-4 w-4" /></button>
            </div>
          </div>
          <ol className="no-scrollbar flex overflow-x-auto lg:block lg:flex-1 lg:overflow-visible">
            {items.map((x, k) => {
              const xh = host(x)
              const on = k === i
              return (
                <li key={x.id} className="min-w-[15rem] border-r border-line last:border-r-0 lg:min-w-0 lg:border-r-0 lg:border-b">
                  <button type="button" aria-current={on} onClick={() => go(k)} className={`relative flex w-full items-center gap-3 p-3 text-left transition-colors ${on ? 'bg-slate-2' : 'hover:bg-slate-2/60'}`}>
                    <ClubCover club={{ name: xh.name, mono: xh.mono, category: xh.category }} look={xh.look} size="mini" className="h-14 w-14 shrink-0">
                      <span className="club-display grid h-full place-items-center text-lg text-paper">{xh.mono}</span>
                    </ClubCover>
                    <span className="min-w-0">
                      <span className={`block truncate text-sm ${on ? 'text-gold' : ''}`}>{x.title}</span>
                      <span className="block truncate text-xs text-mute">{startsLabel(x, now)} · <Num>{time(x.start)}</Num></span>
                    </span>
                    {on && (
                      <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-line">
                        <motion.span
                          key={`${x.id}-${paused}`}
                          className="block h-full origin-left bg-gold"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: reduce || paused ? 0 : 1 }}
                          transition={{ duration: reduce || paused ? 0 : SLIDE_MS / 1000, ease: 'linear' }}
                        />
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}

const Meta = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div>
    <dt className="eyebrow !text-[0.55rem]">{k}</dt>
    <dd className="mt-0.5">{children}</dd>
  </div>
)

/* ---------- Capsules (poster cards) ---------- */

function Capsule({ e, now }: { e: CampusEvent; now: Date }) {
  const openEvent = useOpenEvent()
  const h = useHostLook()(e)
  const past = e.end < now
  return (
    <article className="group relative h-full">
      <ClubCover club={{ name: h.name, mono: h.mono, category: h.category }} look={h.look} className="aspect-[16/10]">
        <div className="flex h-full flex-col justify-between p-3">
          <span className="flex items-start justify-between gap-2">
            <span className="tag tag-gold"><Num>{past ? dayMonth(e.start) : time(e.start)}</Num></span>
          </span>
          <span className="club-display self-end text-6xl leading-[0.8] text-paper/90">{h.mono}</span>
        </div>
      </ClubCover>
      <div className="pt-3">
        <p className="eyebrow !text-[0.58rem]">{past ? longDate(e.start) : startsLabel(e, now)}</p>
        <h3 className="mt-1 text-lg leading-snug">
          <button type="button" className="hover-gold text-left after:absolute after:inset-0 after:content-['']" onClick={() => openEvent(e.id)}>{e.title}</button>
        </h3>
        <p className="mt-1 truncate text-xs text-mute">{e.hostName} · {e.venue}</p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <StatusTag e={e} />
          <span className="relative z-10"><SaveButton id={e.id} /></span>
        </div>
      </div>
    </article>
  )
}

function Ranked({ e, rank, wide }: { e: CampusEvent; rank: number; wide: boolean }) {
  const openEvent = useOpenEvent()
  const h = useHostLook()(e)
  const pct = Math.round((e.registered / e.seats) * 100)
  return (
    <li className={`group relative grid grid-cols-[3.5rem_4.5rem_minmax(0,1fr)] items-center gap-4 border-b border-line py-4 ${wide ? 'xl:row-span-2 xl:grid-cols-[4.5rem_minmax(0,1fr)] xl:items-end xl:border-b-0' : ''}`}>
      <span className={`num leading-none text-transparent [-webkit-text-stroke:1px_var(--color-line-strong)] group-hover:[-webkit-text-stroke:1px_var(--color-gold)] ${wide ? 'text-7xl xl:text-[7rem]' : 'text-6xl'}`}>{rank}</span>
      <ClubCover club={{ name: h.name, mono: h.mono, category: h.category }} look={h.look} size="mini" className={wide ? 'aspect-square xl:hidden' : 'aspect-square'}>
        <span className="club-display grid h-full place-items-center text-2xl text-paper">{h.mono}</span>
      </ClubCover>
      <div className="min-w-0">
        {wide && (
          <ClubCover club={{ name: h.name, mono: h.mono, category: h.category }} look={h.look} className="mb-4 hidden aspect-[16/9] xl:block" />
        )}
        <h3 className={`leading-snug ${wide ? 'text-xl md:text-2xl' : 'text-lg'}`}>
          <button type="button" className="hover-gold text-left after:absolute after:inset-0 after:content-['']" onClick={() => openEvent(e.id)}>{e.title}</button>
        </h3>
        <p className="mt-1 truncate text-xs text-mute">{relativeDay(e.start)} · <Num>{time(e.start)}</Num> · {e.hostName}</p>
        <p className="mt-2 flex items-center gap-3 text-xs">
          <span className="h-1 flex-1 bg-line"><span className="block h-full bg-gold" style={{ width: `${Math.min(100, pct)}%` }} /></span>
          <Num className={pct >= 90 ? 'text-gold' : 'text-mute'}>{pct}%</Num>
        </p>
      </div>
    </li>
  )
}

/* ---------- Calendar: every event under its date ---------- */

function Calendar({ events, past, now }: { events: CampusEvent[]; past: CampusEvent[]; now: Date }) {
  const { savedEvents, registered } = useStore()
  const [mode, setMode] = useState<'upcoming' | 'past'>('upcoming')
  const [cats, setCats] = useState<Category[]>([])
  const [openOnly, setOpenOnly] = useState(false)
  const [mineOnly, setMineOnly] = useState(false)
  const [text, setText] = useState('')
  const [activeDay, setActiveDay] = useState<string | null>(null)

  const list = useMemo(() => {
    const src = mode === 'past' ? past : events
    const s = text.trim().toLowerCase()
    return src.filter((e) => {
      if (cats.length && !cats.includes(e.category)) return false
      if (openOnly && !isOpen(e)) return false
      if (mineOnly && !savedEvents.includes(e.id) && !registered.includes(e.id)) return false
      if (s && !`${e.title} ${e.hostName} ${e.venue} ${e.summary}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [mode, events, past, cats, openOnly, mineOnly, text, savedEvents, registered])

  const groups = useMemo(() => {
    const m = new Map<string, CampusEvent[]>()
    for (const e of list) {
      const k = e.start.toDateString()
      m.set(k, [...(m.get(k) ?? []), e])
    }
    return [...m.entries()]
  }, [list])

  // The strip: the next fourteen days (or the last fourteen, for past).
  const strip = useMemo(() => {
    return Array.from({ length: 14 }, (_, k) => {
      const d = new Date(now)
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() + (mode === 'past' ? -13 + k : k))
      return d
    })
  }, [now, mode])
  const counts = new Map(groups.map(([k, g]) => [k, g.length]))

  useEffect(() => {
    const els = groups.map(([k]) => document.getElementById(`day-${k.replace(/\s/g, '-')}`)).filter((x): x is HTMLElement => !!x)
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((x) => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) setActiveDay(hit.target.getAttribute('data-day'))
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [groups])

  const jump = (d: Date) => document.getElementById(`day-${d.toDateString().replace(/\s/g, '-')}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const filtered = cats.length > 0 || openOnly || mineOnly || text.trim() !== ''
  const clear = () => {
    setCats([])
    setOpenOnly(false)
    setMineOnly(false)
    setText('')
  }

  return (
    <section aria-labelledby="calendar" className="mt-16">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4 border-b border-line-strong pb-3">
        <div>
          <p className="slate-no">Sc. 03 · The calendar</p>
          <h2 id="calendar" className="mt-2 text-3xl md:text-4xl">Every event, by date</h2>
        </div>
        <div role="group" aria-label="Range" className="flex border border-line">
          {(['upcoming', 'past'] as const).map((m) => (
            <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)} className={`h-10 px-4 text-[0.7rem] font-bold tracking-[0.12em] uppercase ${mode === m ? 'bg-paper text-ink' : 'hover-gold text-mute'}`}>{m}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative min-w-[12rem] flex-1">
          <span className="sr-only">Search events</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute" />
          <input className="field !h-10 !pl-9" type="search" placeholder="Search by name, club or venue" value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <button className="chip shrink-0" aria-pressed={mineOnly} onClick={() => setMineOnly((x) => !x)}><Icon name="bookmark" className="h-3.5 w-3.5" /> Mine</button>
          {mode === 'upcoming' && <button className="chip shrink-0" aria-pressed={openOnly} onClick={() => setOpenOnly((x) => !x)}>Open to register</button>}
          {CATEGORIES.map((c) => (
            <button key={c} className="chip shrink-0" aria-pressed={cats.includes(c)} onClick={() => setCats((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))}>{c}</button>
          ))}
        </div>
      </div>

      {/* Date strip: sticky, one column per day, like a sale calendar */}
      <div className="sticky top-[var(--head)] z-20 mt-5 -mx-[clamp(1rem,0.6rem+2vw,2.5rem)] border-y border-line bg-ink/95 px-[clamp(1rem,0.6rem+2vw,2.5rem)] backdrop-blur">
        <ol className="no-scrollbar grid auto-cols-[minmax(3.6rem,1fr)] grid-flow-col overflow-x-auto">
          {strip.map((d) => {
            const k = d.toDateString()
            const n = counts.get(k) ?? 0
            const on = activeDay === k
            const today = daysFrom(d, now) === 0
            return (
              <li key={k} className="border-l border-line first:border-l-0">
                <button
                  type="button"
                  disabled={!n}
                  onClick={() => jump(d)}
                  aria-label={`${longDate(d)}, ${n} ${n === 1 ? 'event' : 'events'}`}
                  className={`relative flex w-full flex-col items-center gap-0.5 py-2.5 transition-colors disabled:opacity-35 ${on ? 'bg-slate-2' : n ? 'hover:bg-slate-2/60' : ''}`}
                >
                  <span className={`text-[0.6rem] font-bold tracking-[0.14em] uppercase ${today ? 'text-gold' : 'text-mute'}`}>{today ? 'Today' : weekday(d)}</span>
                  <Num className={`text-xl ${on ? 'text-gold' : ''}`}>{d.getDate()}</Num>
                  <span aria-hidden className="flex h-1.5 gap-0.5">{Array.from({ length: Math.min(n, 4) }, (_, j) => <span key={j} className="h-1.5 w-1.5 bg-gold" />)}</span>
                  {on && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-gold" />}
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      <div aria-live="polite" className="mt-4 flex items-center justify-between text-sm text-mute">
        <span><Num>{list.length}</Num> event{list.length === 1 ? '' : 's'}</span>
        {filtered && <button className="hover-gold underline underline-offset-4" onClick={clear}>Clear filters</button>}
      </div>

      {groups.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No events match" body="Try fewer categories, or switch between upcoming and past." action={filtered ? <button className="btn" onClick={clear}>Clear filters</button> : undefined} />
        </div>
      ) : (
        <div className="mt-2">
          {groups.map(([k, g]) => {
            const d = g[0].start
            return (
              <section key={k} id={`day-${k.replace(/\s/g, '-')}`} data-day={k} aria-label={longDate(d)} className="scroll-mt-[calc(var(--head)+6rem)] border-b border-line py-8 md:grid md:grid-cols-[9rem_minmax(0,1fr)] md:gap-8">
                <header className="mb-4 flex items-baseline gap-3 md:sticky md:top-[calc(var(--head)+6rem)] md:mb-0 md:block md:self-start">
                  <p className={`text-[0.7rem] font-bold tracking-[0.16em] uppercase ${daysFrom(d, now) === 0 ? 'text-gold' : 'text-mute'}`}>{relativeDay(d, now)}</p>
                  <Num className="block text-5xl leading-none md:mt-1 md:text-6xl">{d.getDate()}</Num>
                  <p className="text-sm text-mute md:mt-1">{d.toLocaleString('en-GB', { month: 'long' })} <Num>{d.getFullYear()}</Num></p>
                </header>
                <ul className="grid gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                  {g.map((e) => (
                    <li key={e.id}>
                      <Capsule e={e} now={now} />
                      {mode === 'upcoming' && <div className="mt-3"><SeatMeter e={e} /></div>}
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </section>
  )
}
