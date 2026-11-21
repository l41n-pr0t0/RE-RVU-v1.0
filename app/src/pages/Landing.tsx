import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CLUB_HOME, placeFor, type Place } from '../campus/venues'
import { blankLinks, SignIn } from '../components/SignIn'
import { ThemeToggle } from '../components/ThemeToggle'
import { DOLLY, Icon, Logo, Num } from '../components/ui'
import type { CampusEvent, Club } from '../data/types'
import { SCHOOLS } from '../data/types'
import { useCatalog } from '../lib/catalog'
import { relativeDay, time, weekday } from '../lib/format'
import { go } from '../lib/router'
import { useStore } from '../lib/store'

const CampusStage = lazy(() => import('../campus/CampusStage'))

/** If WebGL or the map chunk fails, the page still works: the scene is decoration. */
class SceneGuard extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

type Featured = { kind: 'event'; e: CampusEvent } | { kind: 'club'; c: Club }
type Focus = { place: Place; item: Featured } | null

/**
 * The landing page is one continuous shot over the real campus at night.
 * The map stays pinned; the page scrolls over it. Pointing at an event (or scrolling it into the
 * middle of the screen on a phone) flies the camera to where it happens and lights the building.
 * The first screen is complete on its own: headline, sign-in, what's next.
 */
export default function Landing() {
  const { profile, setProfile } = useStore()
  const reduce = useReducedMotion()
  const { events } = useCatalog()
  const [signIn, setSignIn] = useState(false)
  const [paused, setPaused] = useState(false)
  const [ready, setReady] = useState(false)
  const [focus, setFocus] = useState<Focus>(null)
  const [now] = useState(() => new Date())

  const week = useMemo(() => {
    const end = new Date(now)
    end.setDate(end.getDate() + 7)
    return events.filter((e) => e.end > now && e.start < end).sort((a, b) => +a.start - +b.start)
  }, [events, now])
  const weekItems = useMemo<Featured[]>(() => week.map((e) => ({ kind: 'event', e })), [week])

  const [, setTheme] = useState(() => (typeof document !== 'undefined' ? document.documentElement.dataset.theme : 'dark'))
  useEffect(() => {
    const onTheme = (e: CustomEvent) => setTheme(e.detail)
    window.addEventListener('rvu-theme', onTheme as EventListener)
    return () => window.removeEventListener('rvu-theme', onTheme as EventListener)
  }, [])

  const guest = (then = 'home') => {
    if (!profile || profile.name === 'Guest') {
      setProfile({ name: 'Guest', email: '', year: 1, school: SCHOOLS[0], role: 'Student', interests: [], links: blankLinks, skills: [], openToCollaborate: false, bio: '' })
    }
    go(then)
  }
  const start = () => {
    if (profile && profile.name !== 'Guest' && profile.year && profile.school) {
      go('home')
    } else {
      setSignIn(true)
    }
  }
  const open = (f: Featured) => {
    const path = f.kind === 'event' ? `events/${f.e.id}` : `clubs/${f.c.id}`
    if (profile) go(path)
    else guest(path)
  }

  return (
    <div className="relative bg-ink text-paper">
      {/* The pinned scene */}
      <div className="fixed inset-0 z-0" aria-hidden>
        <div className={`absolute inset-0 transition-opacity duration-[1600ms] ${ready ? 'opacity-100' : 'opacity-0'}`}>
          <SceneGuard>
            <Suspense fallback={null}>
              <CampusStage focus={focus?.place ?? null} paused={paused} onReady={() => setReady(true)} />
            </Suspense>
          </SceneGuard>
        </div>
        {/* Legibility: darker where the words are, open where the campus is */}
        <div className="landing-scrim absolute inset-0 transition-colors duration-500" />
        <div className="grain absolute inset-0" />
      </div>

      <div className="relative z-10">
        <Hero
          next={week[0]}
          signedIn={!!profile && profile.name !== 'Guest'}
          firstName={profile?.name.split(' ')[0]}
          onStart={start}
          onGuest={() => guest()}
          paused={paused}
          onPause={() => setPaused((p) => !p)}
          reduce={!!reduce}
        />

        <Tour
          id="this-week"
          eyebrow="This week on campus"
          title={`${week.length} things on in the next seven days.`}
          items={weekItems}
          onFocus={setFocus}
          onOpen={open}
        />


        <Closing onStart={start} signedIn={!!profile && profile.name !== 'Guest'} />
      </div>

      <AnimatePresence>
        {focus && <Caption key={focus.item.kind === 'event' ? focus.item.e.id : focus.item.c.id} item={focus.item} place={focus.place} now={now} />}
      </AnimatePresence>

      <SignIn open={signIn} onClose={() => setSignIn(false)} />
    </div>
  )
}

/* ------------------------------------------------------------------ hero */

function Hero(props: {
  next?: CampusEvent
  signedIn: boolean
  firstName?: string
  onStart: () => void
  onGuest: () => void
  paused: boolean
  onPause: () => void
  reduce: boolean
}) {
  const { next, signedIn, firstName, onStart, onGuest, paused, onPause, reduce } = props
  const rise = (i: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1.1, ease: DOLLY, delay: 0.25 + i * 0.12 } }

  return (
    <section className="grid min-h-[100svh] grid-rows-[auto_1fr_auto]" aria-labelledby="hero-title">
      <header className="wrap flex h-20 items-center justify-between md:h-24">
        <a href="#/" aria-label="RVU Connect, start">
          <Logo className="h-12 md:h-16" />
        </a>
        <nav className="flex items-center gap-2 text-sm" aria-label="On this page">
          <a href="#this-week" className="hover-gold hidden px-3 py-2 text-paper/70 sm:inline-block">This week</a>
          <ThemeToggle />
          <button className="btn btn-sm ml-1" onClick={onStart}>{signedIn ? 'Open' : 'Sign in'}</button>
        </nav>
      </header>

      <div className="wrap flex flex-col justify-end pb-6 md:justify-center md:pb-0">
        <motion.p className="eyebrow text-gold" {...rise(0)}>RV University · Bengaluru</motion.p>
        <h1 id="hero-title" className="mt-4 max-w-[13ch] text-[clamp(2.9rem,1.4rem+5.6vw,7.2rem)] leading-[0.95] tracking-[-0.01em]">
          <motion.span className="block" {...rise(1)}>What’s on</motion.span>
          <motion.span className="block" {...rise(2)}>at RVU</motion.span>
          <motion.span className="block italic text-gold" {...rise(3)}>this week.</motion.span>
        </h1>
        <motion.p className="mt-5 max-w-[42ch] text-[1.05rem] leading-relaxed text-paper/80 md:mt-6" {...rise(4)}>
          Events, clubs, notices and student projects in one place, sorted by what starts next.
        </motion.p>
        <motion.div className="mt-7 flex flex-wrap gap-3 md:mt-8" {...rise(5)}>
          <button className="btn btn-gold" onClick={onStart}>
            {signedIn ? (
              <span>Continue as {firstName}</span>
            ) : (
              <>
                <GoogleMark />
                <span>Continue with Google</span>
              </>
            )}
          </button>
          {!signedIn && (
            <button className="btn" onClick={onGuest}>
              Look around first
            </button>
          )}
        </motion.div>
      </div>

      <div className="wrap flex items-end justify-between gap-4 pb-5 md:pb-8">
        {next ? (
          <motion.a
            href="#this-week"
            className="group min-w-0 max-w-md border-t border-line-strong pt-3"
            {...(reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 1.2, duration: 0.8 } })}
          >
            <span className="eyebrow">{next.start <= new Date() ? 'On now' : 'Next up'}</span>
            <span className="mt-1 block truncate font-semibold group-hover:text-gold">{next.title}</span>
            <span className="block truncate text-sm text-paper/65">
              {relativeDay(next.start)} · <Num>{time(next.start)}</Num> · {placeFor(next.venue).name}
            </span>
          </motion.a>
        ) : (
          <span />
        )}
        {!reduce && (
          <button
            className="icon-btn shrink-0"
            onClick={onPause}
            aria-pressed={paused}
            aria-label={paused ? 'Play the campus animation' : 'Pause the campus animation'}
          >
            <Icon name={paused ? 'play' : 'pause'} className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ tour */

/**
 * Dogstudio's project list, adapted: big names, dim until chosen.
 * Desktop: pointer or keyboard focus chooses. Phones: whichever row crosses the middle of the screen.
 */
function Tour(props: {
  id: string
  eyebrow: string
  title: string
  items: Featured[]
  small?: boolean
  onFocus: (f: Focus) => void
  onOpen: (item: Featured) => void
}) {
  const { id, eyebrow, title, items, small, onFocus, onOpen } = props
  const [active, setActive] = useState(-1)
  const listRef = useRef<HTMLOListElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const latest = useRef({ items, onFocus })
  latest.current = { items, onFocus }

  const choose = (i: number) => {
    const f = latest.current.items[i]
    if (!f) return
    setActive(i)
    latest.current.onFocus({ place: f.kind === 'event' ? placeFor(f.e.venue) : CLUB_HOME[f.c.category], item: f })
  }

  // The row crossing the middle band of the viewport becomes active as you scroll.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) if (en.isIntersecting) choose(Number((en.target as HTMLElement).dataset.row))
      },
      { rootMargin: '-46% 0px -46% 0px' },
    )
    list.querySelectorAll('[data-row]').forEach((r) => io.observe(r))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  // Leaving the list hands the camera back to the overview.
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([en]) => {
        if (!en.isIntersecting) {
          setActive(-1)
          latest.current.onFocus(null)
        }
      },
      { rootMargin: '-30% 0px -30% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id={id} ref={sectionRef} className="wrap scroll-mt-4 py-[16svh]" aria-labelledby={`${id}-title`}>
      <p className="eyebrow text-gold">{eyebrow}</p>
      <h2 id={`${id}-title`} className="mt-3 max-w-[22ch] text-[clamp(1.6rem,1.2rem+1.6vw,2.6rem)] leading-tight">
        {title}
      </h2>
      <ol ref={listRef} className="mt-[8svh] md:max-w-[62%]">
        {items.map((f, i) => {
          const on = i === active
          const name = f.kind === 'event' ? f.e.title : f.c.name
          const meta = f.kind === 'event' ? `${weekday(f.e.start)} ${time(f.e.start)}` : f.c.category
          return (
            <li key={f.kind === 'event' ? f.e.id : f.c.id} data-row={i}>
              <button
                className="grid w-full grid-cols-1 gap-0.5 py-2 text-left md:grid-cols-[7rem_minmax(0,1fr)] md:items-baseline md:gap-3 md:py-3"
                onMouseEnter={() => choose(i)}
                onFocus={() => choose(i)}
                onClick={() => onOpen(f)}
              >
                <Num className={`text-[0.7rem] uppercase tracking-[0.12em] transition-colors duration-500 md:text-xs ${on ? 'text-gold' : 'text-paper/50'}`}>
                  {meta}
                </Num>
                <span
                  className={`font-display leading-[1.02] transition-[color,translate] duration-500 ease-[cubic-bezier(.2,.7,.1,1)] ${
                    small ? 'text-[clamp(1.6rem,1rem+2.6vw,3.6rem)]' : 'text-[clamp(2rem,1.1rem+3.6vw,5rem)]'
                  } ${on ? 'translate-x-2 text-paper' : 'text-paper/45'}`}
                >
                  {name}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/* --------------------------------------------------------------- caption */

/** The line that fades in at the corner: when, where, who. Dogstudio's description slot. */
function Caption({ item, place, now }: { item: Featured; place: Place; now: Date }) {
  const reduce = useReducedMotion()
  return (
    <motion.aside
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 border-t border-line-strong bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:inset-x-auto md:right-8 md:bottom-8 md:w-[23rem] md:border md:pb-0"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: 8 }}
      transition={{ duration: 0.45, ease: DOLLY }}
    >
      <div className="flex gap-4 p-4">
        <div className="relative hidden h-20 w-28 shrink-0 overflow-hidden md:block" aria-hidden>
          <div className="frame-placeholder absolute inset-0" style={{ ['--seed' as string]: (place.id.charCodeAt(6) * 13) % 100 }} />
        </div>
        <div className="min-w-0 text-sm">
          {item.kind === 'event' ? (
            <>
              <p className="text-gold">
                {relativeDay(item.e.start, now)} · <Num>{time(item.e.start)}</Num>
              </p>
              <p className="mt-1 font-semibold">{place.name}</p>
              <p className="truncate text-paper/65">
                {item.e.venue === place.name ? item.e.hostName : `${item.e.venue} · ${item.e.hostName}`}
              </p>
              {item.e.seats > 0 && (
                <p className="mt-1 text-paper/65">
                  <Num>{Math.max(0, item.e.seats - item.e.registered)}</Num> of <Num>{item.e.seats}</Num> places left
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-gold">{item.c.recruiting ? 'Recruiting now' : item.c.category}</p>
              <p className="mt-1 font-semibold">{item.c.name}</p>
              <p className="line-clamp-2 text-paper/65">{item.c.tagline}</p>
              <p className="mt-1 text-xs text-paper/55">Usually around {place.name}</p>
            </>
          )}
        </div>
      </div>
    </motion.aside>
  )
}

/* --------------------------------------------------------------- closing */

function Closing({ onStart, signedIn }: { onStart: () => void; signedIn: boolean }) {
  return (
    <section className="flex min-h-[85svh] flex-col justify-between bg-gradient-to-b from-transparent via-ink/90 to-ink" aria-labelledby="close-title">
      <div className="wrap flex flex-1 flex-col justify-center py-20">
        <h2 id="close-title" className="max-w-[16ch] text-[clamp(2.2rem,1.3rem+3.4vw,4.8rem)] leading-[1.02]">
          Sign in once. <span className="italic text-gold">Your week sorts itself.</span>
        </h2>
        <p className="mt-5 max-w-[46ch] text-paper/75">
          Save an event and it’s in your calendar. Follow a club and its news reaches you first. Due dates show up before they’re due.
        </p>
        <div className="mt-8">
          <button className="btn btn-gold" onClick={onStart}>
            {!signedIn && <GoogleMark />}
            <span>{signedIn ? 'Open my week' : 'Continue with Google'}</span>
          </button>
        </div>
      </div>
      <footer className="wrap flex flex-col gap-2 border-t border-line py-6 text-xs text-paper/55 sm:flex-row sm:justify-between">
        <span>RVU Connect · a student project for RV University</span>
        <span>Campus map data © OpenStreetMap contributors, ODbL</span>
      </footer>
    </section>
  )
}

/** Google's "G" in one colour, so it sits on the gold button. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="currentColor">
      <path d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.4a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.75 2.97-4.32 2.97-7.33ZM12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.5c-.9.6-2.04.95-3.39.95-2.6 0-4.81-1.76-5.6-4.12H3.07v2.58A10 10 0 0 0 12 22Zm-5.6-8.1a6 6 0 0 1 0-3.8V7.52H3.07a10 10 0 0 0 0 8.96L6.4 13.9ZM12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.52L6.4 10.1C7.19 7.74 9.4 5.98 12 5.98Z" />
    </svg>
  )
}
