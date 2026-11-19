import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useRef } from 'react'
import { ThemeToggle } from '../components/ThemeToggle'
import { DOLLY, Icon, Logo, Num } from '../components/ui'
import { events, notices } from '../data/mock'
import type { CampusEvent } from '../data/types'
import { countdown, relativeDay, time, weekday } from '../lib/format'
import { href } from '../lib/router'

/**
 * Shot list
 * 1  Cold open: black. The Gold Line draws from centre; the crest rises above it.
 * 2  Title: two lines revealed behind a mask, slow push-in 1.04 → 1.
 * 3  The week (pinned, scroll-scrubbed): events drop onto the line one by one.
 * 4  Three jobs: asymmetric, each with a live fragment of the real product.
 * 5  What changed: findings → fixes, for the people judging the redesign.
 * 6  End card: the line again, one action.
 */
export function Landing() {
  return (
    <div className="grain overflow-x-clip">
      <TopBar />
      <ColdOpen />
      <TheWeek />
      <ThreeJobs />
      <WhatChanged />
      <EndCard />
    </div>
  )
}

function TopBar() {
  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-5 md:px-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2.2, duration: 0.8 }}
    >
      <span className="text-sm tracking-[0.2em] text-mute uppercase">RVU Connect</span>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <a href={href('home')} className="btn btn-ghost !min-h-10 text-sm">
          Enter <Icon name="arrow" className="h-4 w-4" />
        </a>
      </div>
    </motion.header>
  )
}

/* ---------------- Shot 1 + 2 ---------------- */

function MaskLine({ children, delay }: { children: string; delay: number }) {
  const reduce = useReducedMotion()
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className="block"
        initial={reduce ? false : { y: '105%' }}
        animate={{ y: 0 }}
        transition={{ duration: 1.1, ease: DOLLY, delay }}
      >
        {children}
      </motion.span>
    </span>
  )
}

function ColdOpen() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // Exit: the frame drifts up and dims as you scroll into the next shot
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={ref} className="relative flex min-h-[100dvh] items-center overflow-hidden">
      {/* Gold light spill, top right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 right-[-20%] h-[90vh] w-[90vh] rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #D7AC54 0%, transparent 65%)' }}
      />
      <motion.div
        style={{ y, opacity: fade }}
        className="relative mx-auto w-full max-w-7xl px-5 md:px-10"
        initial={reduce ? false : { scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.6, ease: DOLLY }}
      >
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: DOLLY, delay: 0.9 }}
        >
          <Logo className="h-16 md:h-24" />
        </motion.div>

        <motion.div
          aria-hidden
          className="mt-8 h-px w-full origin-left bg-gold md:mt-10"
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.6, ease: DOLLY, delay: 0.2 }}
        />

        <h1 className="mt-10 text-[clamp(2.8rem,8.4vw,7.5rem)] leading-[0.98] md:mt-14">
          <MaskLine delay={1.3}>Everything on campus,</MaskLine>
          <span className="italic text-gold">
            <MaskLine delay={1.5}>in the order you need it.</MaskLine>
          </span>
        </h1>

        <motion.div
          className="mt-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-end"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.1 }}
        >
          <p className="max-w-[46ch] text-lg text-paper/80">
            Events, clubs, projects and notices at RV University in one place. Today comes first, this week sits on a single line, and nothing
            important gets buried.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={href('home')} className="btn btn-gold">
              Open the demo
            </a>
            <a href="#week" className="btn btn-ghost">
              See this week
            </a>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        aria-hidden
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs tracking-[0.2em] text-mute uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
      >
        Scroll
        <span className="h-10 w-px bg-gradient-to-b from-gold to-transparent" />
      </motion.div>
    </section>
  )
}

/* ---------------- Shot 3: the week, scroll-scrubbed ---------------- */

function TheWeek() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const week = events.filter((e) => {
    const d = Math.round((new Date(e.start).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000)
    return d >= 0 && d < 7
  })
  const lineScale = useTransform(scrollYProgress, [0, 0.18], [reduce ? 1 : 0, 1])
  const now = new Date()
  const days = Array.from({ length: 7 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + i))

  return (
    <section id="week" ref={ref} className="relative h-[320vh]">
      <div className="sticky top-0 flex h-[100dvh] flex-col justify-center overflow-hidden px-5 md:px-10">
        <div className="mx-auto w-full max-w-7xl">
          <p className="eyebrow">This week at RV University</p>
          <h2 className="mt-3 max-w-[18ch] text-4xl leading-tight md:text-6xl">
            Seven days. <span className="italic text-gold">One line.</span>
          </h2>

          <div className="relative mt-16 md:mt-24">
            <div className="grid grid-cols-7 text-mute">
              {days.map((d, i) => (
                <div key={i}>
                  <p className="text-[0.68rem] tracking-[0.16em] uppercase">{i === 0 ? 'Today' : weekday(d)}</p>
                  <Num className="text-2xl text-paper md:text-4xl">{d.getDate()}</Num>
                </div>
              ))}
            </div>
            <div className="relative mt-6 h-px">
              <motion.div style={{ scaleX: lineScale }} className="absolute inset-0 origin-left bg-gold" />
            </div>
            <div className="relative mt-0 h-[46vh] md:h-[40vh]">
              {week.map((e, i) => (
                <WeekPin key={e.id} e={e} i={i} n={week.length} progress={scrollYProgress} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function WeekPin({ e, i, n, progress }: { e: CampusEvent; i: number; n: number; progress: MotionValue<number> }) {
  const reduce = useReducedMotion()
  const start = 0.2 + (i / n) * 0.7
  const opacity = useTransform(progress, [start, start + 0.06], [reduce ? 1 : 0, 1])
  const y = useTransform(progress, [start, start + 0.08], [reduce ? 0 : -40, 0])
  const now = new Date()
  const day = Math.round((new Date(e.start).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000)
  const left = ((day + 0.08) / 7) * 100
  const row = i % 3

  const top = row * 30 + 6
  return (
    <>
      <motion.span
        aria-hidden
        style={{ opacity, left: `${left}%`, height: `${top}%` }}
        className="absolute top-0 w-px bg-gradient-to-b from-gold to-gold/10"
      />
      <motion.div style={{ opacity, y, left: `${left}%`, top: `${top}%` }} className="absolute w-[min(15rem,40vw)] pl-3">
        <span aria-hidden className="absolute top-1 -left-[3.5px] block h-2 w-2 rotate-45 bg-gold" />
        <p className="text-[0.7rem] tracking-[0.14em] text-mute uppercase">
          {relativeDay(e.start)} · <Num>{time(e.start)}</Num>
        </p>
        <p className="mt-1 font-display text-lg leading-snug md:text-2xl">{e.title}</p>
        <p className="hidden text-sm text-mute md:block">{e.hostName}</p>
      </motion.div>
    </>
  )
}

/* ---------------- Shot 4: three jobs (asymmetric, not three equal cards) ---------------- */

function ThreeJobs() {
  const next = events[0]
  const notice = notices.find((n) => n.priority === 'High' && n.due)!
  return (
    <section className="mx-auto max-w-7xl px-5 py-32 md:px-10 md:py-48">
      <Job n="01" title="Find what’s on" body="Today first, then the week on a single line. Filter by what you care about, not by guessing a club’s name from a list of 26.">
        <div className="panel mt-10 p-6 md:mt-0 md:p-8">
          <p className="eyebrow">Next up</p>
          <p className="mt-3 font-display text-3xl">{next.title}</p>
          <p className="mt-1 text-mute">
            {next.hostName} · <Num>{time(next.start)}</Num> · starts {countdown(next.start)}
          </p>
          <div className="mt-6 h-[3px] w-full rounded-full bg-paper/10">
            <div className="h-full origin-left bg-gold" style={{ transform: `scaleX(${next.registered / next.seats})` }} />
          </div>
          <p className="mt-2 text-xs text-mute">
            <Num>{next.seats - next.registered}</Num> seats left
          </p>
        </div>
      </Job>

      <Job n="02" title="Join the right people" body="Every club, what it actually does, whether it’s recruiting, and what it did last month. Past events no longer disappear." flip>
        <div className="mt-10 flex flex-wrap gap-2 md:mt-0">
          {['Iterium', 'Vyoma', 'CyberSec', 'RUDRA', 'Presscorps', 'ECell', 'Happytails', 'Thesis'].map((c, i) => (
            <span key={c} className={`chip !min-h-11 !px-5 ${i % 3 === 0 ? 'border-gold text-gold' : ''}`}>
              {c}
              {i % 3 === 0 && <span className="text-xs text-mute">recruiting</span>}
            </span>
          ))}
        </div>
      </Job>

      <Job n="03" title="Never miss what matters" body="Deadlines float to the top with a countdown, and clear the moment you’ve read them. No ticker. No noise.">
        <div className="mt-10 border-l-2 border-gold pl-6 md:mt-0">
          <p className="text-xs tracking-[0.16em] text-gold uppercase">High priority · due {countdown(notice.due!)}</p>
          <p className="mt-2 font-display text-2xl">{notice.title}</p>
          <p className="mt-1 text-sm text-mute">{notice.from}</p>
        </div>
      </Job>
    </section>
  )
}

function Job({ n, title, body, children, flip }: { n: string; title: string; body: string; children: React.ReactNode; flip?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <motion.article
      className={`grid items-center gap-6 border-t border-line py-16 md:grid-cols-12 md:gap-12 md:py-24`}
      initial={reduce ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15%' }}
      transition={{ duration: 0.9, ease: DOLLY }}
    >
      <div className={`md:col-span-5 ${flip ? 'md:order-2 md:col-start-8' : ''}`}>
        <Num className="text-sm text-gold">{n}</Num>
        <h3 className="mt-3 text-4xl leading-tight md:text-5xl">{title}</h3>
        <p className="mt-4 max-w-[42ch] text-mute">{body}</p>
      </div>
      <div className={`md:col-span-6 ${flip ? 'md:order-1 md:col-start-1' : 'md:col-start-7'}`}>{children}</div>
    </motion.article>
  )
}

/* ---------------- Shot 5: what changed ---------------- */

const CHANGES = [
  ['The first screen led with “0 live events”', 'Today opens on your next event, your deadlines and your week'],
  ['Onboarding came back on every reload', 'One step, saved instantly, never repeated'],
  ['Empty states talked about “Firestore”', 'Every empty state gives a reason and a next step'],
  ['Find an event: choose from a 26-club dropdown', 'Quick filters, interests and one search for everything'],
  ['Past events vanished', 'Clubs keep their history, so you can judge them before you join'],
  ['Fonts and gold were off-brand', 'Cantarell, Playfair Display, Montserrat; Gold #D7AC54 on black'],
] as const

function WhatChanged() {
  return (
    <section className="border-y border-line bg-slate-2">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
        <p className="eyebrow">What we changed</p>
        <h2 className="mt-3 max-w-[20ch] text-4xl leading-tight md:text-5xl">Improved before expanded.</h2>
        <ol className="mt-14">
          {CHANGES.map(([before, after], i) => (
            <motion.li
              key={i}
              className="grid gap-2 border-t border-line py-6 md:grid-cols-[4rem_1fr_2rem_1fr] md:items-baseline md:gap-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
            >
              <Num className="text-sm text-gold">{String(i + 1).padStart(2, '0')}</Num>
              <p className="text-mute line-through decoration-gold/40">{before}</p>
              <Icon name="arrow" className="hidden h-4 w-4 text-gold md:block" />
              <p className="text-paper">{after}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ---------------- Shot 6: end card ---------------- */

function EndCard() {
  const reduce = useReducedMotion()
  return (
    <section className="relative flex min-h-[80dvh] flex-col items-center justify-center px-5 text-center">
      <motion.div
        aria-hidden
        className="h-px w-[min(36rem,80vw)] bg-gold"
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: DOLLY }}
      />
      <h2 className="mt-10 text-5xl leading-tight md:text-7xl">Your week is waiting.</h2>
      <p className="mt-4 text-mute">No sign-in needed to explore the prototype.</p>
      <a href={href('home')} className="btn btn-gold mt-10">
        Open RVU Connect <Icon name="arrow" className="h-4 w-4" />
      </a>
      <div className="mt-24">
        <Logo className="h-12" />
      </div>
    </section>
  )
}
