import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { events, pastEvents } from '../data/mock'
import type { CampusEvent } from '../data/types'
import { countdown, icsFor, longDate, relativeDay, time } from '../lib/format'
import { href } from '../lib/router'
import { useStore } from '../lib/store'
import { DOLLY, Icon, Num } from './ui'

/* ---------- drawer context: open an event from anywhere without losing your place ---------- */

const Ctx = createContext<(id: string) => void>(() => {})
export const useOpenEvent = () => useContext(Ctx)

export function EventDrawerProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null)
  return (
    <Ctx.Provider value={setId}>
      {children}
      <EventDrawer id={id} onClose={() => setId(null)} />
    </Ctx.Provider>
  )
}

function seatsLeft(e: CampusEvent) {
  return Math.max(e.seats - e.registered, 0)
}

export function SeatMeter({ e }: { e: CampusEvent }) {
  const pct = Math.min(e.registered / e.seats, 1)
  const left = seatsLeft(e)
  return (
    <div>
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-paper/10">
        <div className="h-full origin-left bg-gold" style={{ transform: `scaleX(${pct})` }} />
      </div>
      <p className="mt-1.5 text-xs text-mute">
        {left === 0 ? (
          'Full: join the waitlist at the venue'
        ) : (
          <>
            <Num>{left}</Num> of <Num>{e.seats}</Num> seats left
          </>
        )}
      </p>
    </div>
  )
}

export function StatusTag({ e }: { e: CampusEvent }) {
  if (!e.registrationOpen || seatsLeft(e) === 0)
    return <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-mute">Registration closed</span>
  if (seatsLeft(e) / e.seats < 0.15)
    return <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs text-gold">Filling fast</span>
  return <span className="rounded-full bg-teal px-2.5 py-0.5 text-xs text-paper">Open</span>
}

export function SaveButton({ id, compact = false }: { id: string; compact?: boolean }) {
  const { savedEvents, toggleSaved } = useStore()
  const saved = savedEvents.includes(id)
  return (
    <button
      onClick={(ev) => {
        ev.stopPropagation()
        toggleSaved(id)
      }}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved' : 'Save event'}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors ${
        saved ? 'border-gold bg-gold text-ink' : 'border-line text-paper hover:border-gold hover:text-gold'
      } ${compact ? 'h-9 w-9' : ''}`}
    >
      <Icon name={saved ? 'bookmark-fill' : 'bookmark'} className="h-[18px] w-[18px]" />
    </button>
  )
}

/** Row layout — date column in Montserrat, title in Playfair. Not a card grid. */
export function EventRow({ e }: { e: CampusEvent }) {
  const open = useOpenEvent()
  return (
    <article
      onClick={() => open(e.id)}
      className="group grid cursor-pointer grid-cols-[4.5rem_1fr_auto] items-start gap-4 border-b border-line py-5 md:grid-cols-[6rem_1fr_14rem_auto] md:gap-6"
    >
      <div className="pt-1">
        <p className="text-[0.7rem] uppercase tracking-[0.16em] text-mute">{relativeDay(e.start).slice(0, 9)}</p>
        <Num className="mt-1 block text-lg text-paper">{time(e.start)}</Num>
      </div>
      <div className="min-w-0">
        <button className="text-left" onClick={() => open(e.id)}>
          <h3 className="text-xl leading-snug transition-colors group-hover:text-gold md:text-2xl">{e.title}</h3>
        </button>
        <p className="mt-1 text-sm text-mute">
          {e.hostName} · {e.venue}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 md:hidden">
          <StatusTag e={e} />
        </div>
      </div>
      <div className="hidden pt-1 md:block">
        <div className="mb-2">
          <StatusTag e={e} />
        </div>
        <SeatMeter e={e} />
      </div>
      <SaveButton id={e.id} />
    </article>
  )
}

function EventDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const reduce = useReducedMotion()
  const e = [...events, ...pastEvents].find((x) => x.id === id)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [registered, setRegistered] = useState(false)
  const { savedEvents, toggleSaved } = useStore()
  const register = () => {
    setRegistered(true)
    if (e && !savedEvents.includes(e.id)) toggleSaved(e.id)
  }

  useEffect(() => {
    setRegistered(false)
    if (!id) return
    closeRef.current?.focus()
    const onKey = (k: KeyboardEvent) => k.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [id, onClose])

  const past = e ? e.end < new Date() : false

  return (
    <AnimatePresence>
      {e && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl border-t border-gold/40 bg-slate-2 md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[32rem] md:rounded-none md:border-t-0 md:border-l"
            initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
            transition={{ duration: 0.45, ease: DOLLY }}
          >
            <div className="flex items-center justify-between px-6 pt-6 md:px-8">
              <p className="eyebrow">{e.kind}</p>
              <button ref={closeRef} onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full border border-line hover:border-gold">
                <Icon name="close" />
              </button>
            </div>
            <div className="px-6 pb-10 md:px-8">
              <h2 id="drawer-title" className="mt-4 text-4xl leading-tight">
                {e.title}
              </h2>
              <a href={href(`clubs/${e.hostId}`)} onClick={onClose} className="mt-2 inline-block text-gold hover:underline">
                {e.hostName}
              </a>
              <dl className="mt-8 grid gap-4 border-y border-line py-6 text-sm">
                <div className="flex gap-3">
                  <Icon name="calendar" className="h-5 w-5 text-gold" />
                  <div>
                    <dt className="sr-only">Date</dt>
                    <dd>
                      <Num>{longDate(e.start)}</Num>
                      <span className="text-mute"> · {relativeDay(e.start)}</span>
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Icon name="clock" className="h-5 w-5 text-gold" />
                  <dd>
                    <Num>
                      {time(e.start)} to {time(e.end)}
                    </Num>
                    {!past && <span className="text-mute"> · starts {countdown(e.start)}</span>}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <Icon name="pin" className="h-5 w-5 text-gold" />
                  <dd>
                    {e.venue}, {e.campus}
                  </dd>
                </div>
              </dl>
              <p className="mt-6 leading-relaxed text-paper/90">{e.summary}</p>
              {!past && (
                <>
                  <div className="mt-6">
                    <SeatMeter e={e} />
                  </div>
                  <p className="mt-3 text-sm text-mute">{e.free ? 'Free entry.' : 'A small materials fee applies, payable at the venue.'}</p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    {e.registrationOpen && e.registered < e.seats ? (
                      <button className="btn btn-gold" onClick={register} disabled={registered}>
                        {registered ? (
                          <>
                            <Icon name="check" className="h-4 w-4" /> You’re registered
                          </>
                        ) : (
                          'Register'
                        )}
                      </button>
                    ) : (
                      <span className="text-sm text-mute">Registration is closed for this event.</span>
                    )}
                    <a className="btn btn-ghost" href={icsFor(e)} download={`${e.id}.ics`}>
                      <Icon name="calendar" className="h-4 w-4" /> Add to calendar
                    </a>
                    <SaveButton id={e.id} />
                  </div>
                  {registered && (
                    <p role="status" className="mt-4 text-sm text-gold">
                      Saved to your week. You’ll see it on the Gold Line on Home.
                    </p>
                  )}
                </>
              )}
              {past && <p className="mt-6 text-sm text-mute">This event has ended. It stays on the club page so you can see what they do.</p>}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
