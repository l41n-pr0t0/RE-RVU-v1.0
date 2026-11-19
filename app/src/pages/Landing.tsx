import { motion, useReducedMotion } from 'framer-motion'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { blankLinks, SignIn } from '../components/SignIn'
import { ThemeToggle } from '../components/ThemeToggle'
import { DOLLY, Icon, Logo, Num } from '../components/ui'
import { SCHOOLS } from '../data/types'
import { clubs, events, projects } from '../data/mock'
import { countdown, isThisWeek, longDate, relativeDay, time } from '../lib/format'
import { go } from '../lib/router'
import { useStore } from '../lib/store'

const GlassScreen = lazy(() => import('../components/GlassScreen'))

/**
 * Scene 00: the cold open. One screen, no scroll.
 * Shot: letterbox bars part, the headline is revealed line by line, the
 * "screen" fades up on a slow orbit of the gold sculpture behind fluted glass.
 */
export default function Landing() {
  const { profile, setProfile } = useStore()
  const reduce = useReducedMotion()
  const [signIn, setSignIn] = useState(false)
  const [paused, setPaused] = useState(false)
  const [ready, setReady] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const next = useMemo(() => events.filter((e) => e.end > now).sort((a, b) => +a.start - +b.start)[0], [now])
  const stats = [
    { n: events.filter((e) => relativeDay(e.start, now) === 'Today').length, label: 'On today' },
    { n: events.filter((e) => isThisWeek(e.start, now)).length, label: 'This week' },
    { n: clubs.length, label: 'Clubs' },
    { n: projects.length, label: 'Teams hiring' },
  ]

  const guest = () => {
    setProfile({ name: 'Guest', email: '', year: 1, school: SCHOOLS[0], role: 'Student', interests: [], links: blankLinks })
    go('home')
  }

  const first = profile && profile.email ? profile.name.split(' ')[0] : null
  const lines = ['Everything on campus,', 'in the order you need it.']

  return (
    <div className="relative grid h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-ink">
      {/* Letterbox bars: the only "loading" the page needs */}
      {!reduce && (
        <>
          <motion.div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[12dvh] bg-black" initial={{ y: 0 }} animate={{ y: '-100%' }} transition={{ duration: 1.1, ease: DOLLY, delay: 0.15 }} />
          <motion.div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 z-50 h-[12dvh] bg-black" initial={{ y: 0 }} animate={{ y: '100%' }} transition={{ duration: 1.1, ease: DOLLY, delay: 0.15 }} />
        </>
      )}

      {/* Top bar */}
      <header className="wrap flex h-16 items-center justify-between gap-4 md:h-20">
        <a href="#/" aria-label="RVU Connect, start" className="flex items-center gap-3">
          <Logo className="h-10 md:h-12" />
          <span className="hidden h-6 w-px bg-line-strong sm:block" aria-hidden />
          <span className="hidden font-display text-lg italic sm:block">Connect</span>
        </a>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden text-sm text-mute lg:inline">
            <Num>{longDate(now)}</Num>
          </span>
          <ThemeToggle />
          {first ? (
            <button className="btn btn-sm" onClick={() => go('home')}>Open</button>
          ) : (
            <button className="btn btn-sm" onClick={() => setSignIn(true)}>Sign in</button>
          )}
        </div>
      </header>

      {/* Main: copy + screen. On phones the screen sits above the copy. */}
      <main className="wrap grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-5 pb-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:grid-rows-1 md:items-center md:gap-10 md:pb-6 lg:gap-16">
        {/* Copy */}
        <div className="order-2 min-w-0 md:order-1">
          <motion.p
            className="flex items-center gap-3"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <span className="slate-no">Sc. 00</span>
            <span className="h-px w-8 bg-line-strong" aria-hidden />
            <span className="eyebrow">Today’s call sheet</span>
          </motion.p>
          <h1 className="mt-3 text-[clamp(2.05rem,min(1.2rem+4.4vw,5.7svh),4.9rem)] leading-[0.98] tracking-[-0.01em] md:mt-5">
            {lines.map((l, i) => (
              <span key={l} className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  className={`block ${i === 1 ? 'italic text-gold' : ''}`}
                  initial={reduce ? false : { y: '105%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1.05, ease: DOLLY, delay: 0.55 + i * 0.14 }}
                >
                  {l}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: DOLLY, delay: 1.05 }}>
            <p className="mt-4 hidden max-w-[44ch] text-mute [@media(min-height:720px)]:block md:mt-6 md:text-lg">
              Events, clubs, notices and student projects at RV University, sorted by what starts next and what is due first.
            </p>
            <div className="mt-5 grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-2 sm:flex sm:flex-wrap sm:gap-3 md:mt-8">
              {first ? (
                <button className="btn btn-gold" onClick={() => go('home')}>
                  <span>Continue as {first}</span>
                  <Icon name="arrow" className="h-4 w-4" />
                </button>
              ) : (
                <button className="btn btn-gold" onClick={() => setSignIn(true)}>
                  <span><span className="sm:hidden">Sign in</span><span className="hidden sm:inline">Sign in with RVU email</span></span>
                  <Icon name="arrow" className="h-4 w-4" />
                </button>
              )}
              <button className="btn" onClick={guest}><span className="sm:hidden">Look around</span><span className="hidden sm:inline">Look around first</span></button>
            </div>
          </motion.div>
        </div>

        {/* The screen */}
        <motion.section
          aria-label="Showreel"
          className="stage-dark relative order-1 min-h-[9rem] overflow-hidden border border-line-strong bg-black md:order-2 md:h-[min(68svh,40rem)]"
          initial={reduce ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: DOLLY, delay: 0.35 }}
        >
          <Suspense fallback={null}>
            <GlassScreen paused={paused} onReady={() => setReady(true)} />
          </Suspense>
          <div aria-hidden className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-1000 ${ready ? 'opacity-0' : 'opacity-100'}`} />
          {/* Corner marks, like a camera viewfinder */}
          <span aria-hidden className="absolute top-3 left-3 h-4 w-4 border-t border-l border-gold/70" />
          <span aria-hidden className="absolute top-3 right-3 h-4 w-4 border-t border-r border-gold/70" />
          <span aria-hidden className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-gold/70" />
          <span aria-hidden className="absolute right-3 bottom-3 h-4 w-4 border-r border-b border-gold/70" />

          <div className="absolute top-3 left-9 flex items-center gap-2 md:top-4">
            <span className={`h-2 w-2 ${paused ? 'bg-mute' : 'bg-gold'}`} aria-hidden />
            <span className="eyebrow !text-[0.62rem] text-paper/80">{paused ? 'Paused' : 'Rolling'}</span>
          </div>
          <button
            className="icon-btn absolute top-2 right-9 h-9 w-9 bg-black/40 md:top-3"
            aria-label={paused ? 'Play the animation' : 'Pause the animation'}
            aria-pressed={paused}
            onClick={() => setPaused((p) => !p)}
          >
            <Icon name={paused ? 'play' : 'pause'} className="h-4 w-4" />
          </button>

          {next && (
            <button
              onClick={() => (profile ? go(`events/${next.id}`) : setSignIn(true))}
              className="group absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pt-10 pb-3 text-left md:px-6 md:pb-5"
            >
              <span className="min-w-0">
                <span className="eyebrow block !text-[0.62rem] text-gold">Now showing · {relativeDay(next.start, now)} <Num>{time(next.start)}</Num></span>
                <span className="mt-1 block truncate font-display text-lg md:text-2xl">{next.title}</span>
                <span className="hidden truncate text-sm text-mute sm:block">{next.hostName} · {next.venue}</span>
              </span>
              <span className="num shrink-0 border border-gold/60 px-2 py-1 text-xs text-gold">{next.start <= now ? 'On now' : countdown(next.start, now)}</span>
            </button>
          )}
        </motion.section>
      </main>

      {/* Stats strip: one bordered row, no cards */}
      <motion.footer
        className="wrap pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 1.2 }}
      >
        <dl className="grid grid-cols-4 border-y border-line">
          {stats.map((s, i) => (
            <div key={s.label} className={`flex flex-col-reverse gap-0.5 py-2.5 md:flex-row md:items-baseline md:gap-3 md:py-4 ${i ? 'border-l border-line pl-3 md:pl-6' : ''}`}>
              <dt className="eyebrow !text-[0.58rem] md:!text-[0.68rem]">{s.label}</dt>
              <dd className="num text-xl font-semibold md:text-3xl">{String(s.n).padStart(2, '0')}</dd>
            </div>
          ))}
        </dl>
      </motion.footer>

      <SignIn open={signIn} onClose={() => setSignIn(false)} />
    </div>
  )
}
