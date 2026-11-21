import { createContext, useContext, useEffect, useId, useState, type ReactNode } from 'react'
import type { CampusEvent } from '../data/types'
import { rsvpState, useCatalog, type RsvpState } from '../lib/catalog'
import { countdown, dayMonth, daysFrom, googleCalendarUrl, icsFor, longDate, REMINDER_OPTIONS, relativeDay, shareUrl, ticketCode, time } from '../lib/format'
import { href } from '../lib/router'
import { myAttendeeId, useStore } from '../lib/store'
import { ContactSheet } from './Frames'
import { Qr } from './Qr'
import { Dialog, Icon, Num } from './ui'

/* Open an event from anywhere without losing your place in the list. */
const Ctx = createContext<(id: string) => void>(() => {})
export const useOpenEvent = () => useContext(Ctx)

export function EventDrawerProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null)
  // Leaving the page closes the sheet; an events/:id route reopens it after this runs.
  useEffect(() => {
    const close = () => setId(null)
    window.addEventListener('hashchange', close)
    return () => window.removeEventListener('hashchange', close)
  }, [])
  return (
    <Ctx.Provider value={setId}>
      {children}
      <EventSheet id={id} onClose={() => setId(null)} />
    </Ctx.Provider>
  )
}

export const seatsLeft = (e: CampusEvent) => Math.max(e.seats - e.registered, 0)
export const isOpen = (e: CampusEvent) => e.registrationOpen && seatsLeft(e) > 0

export function useRsvp(e: CampusEvent): RsvpState {
  const { registered, waitlisted } = useStore()
  return rsvpState(e, { registered, waitlisted })
}

export function SeatMeter({ e }: { e: CampusEvent }) {
  const pct = Math.min(e.registered / e.seats, 1)
  const left = seatsLeft(e)
  return (
    <div>
      <div className="h-[3px] w-full bg-line">
        <div className="h-full origin-left bg-gold" style={{ transform: `scaleX(${pct})` }} />
      </div>
      <p className="mt-1.5 text-xs text-mute">
        {left === 0 ? (
          <>Full · <Num>{e.waitlist}</Num> on the waitlist</>
        ) : (
          <><Num>{left}</Num> of <Num>{e.seats}</Num> seats left</>
        )}
      </p>
    </div>
  )
}

const STATUS: Record<RsvpState, { label: string; tone: string }> = {
  past: { label: 'Ended', tone: '' },
  going: { label: 'Going', tone: 'tag-gold' },
  waitlisted: { label: 'Waitlisted', tone: 'tag-gold' },
  open: { label: 'Open', tone: 'tag-teal' },
  full: { label: 'Full', tone: '' },
  'waitlist-open': { label: 'Waitlist', tone: '' },
  closed: { label: 'Closed', tone: '' },
}

export function StatusTag({ e }: { e: CampusEvent }) {
  const s = useRsvp(e)
  if (s === 'open' && seatsLeft(e) / e.seats < 0.15) return <span className="tag tag-gold">Filling fast</span>
  return <span className={`tag ${STATUS[s].tone}`}>{STATUS[s].label}</span>
}

export function SaveButton({ id }: { id: string }) {
  const { savedEvents, toggleSaved } = useStore()
  const saved = savedEvents.includes(id)
  return (
    <button
      onClick={(ev) => {
        ev.stopPropagation()
        toggleSaved(id)
      }}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved' : 'Save'}
      className="icon-btn"
    >
      <Icon name={saved ? 'bookmark-fill' : 'bookmark'} className="h-[18px] w-[18px]" />
    </button>
  )
}

/** Copy (or natively share) a deep link. Shows its own confirmation. */
export function ShareButton({ path, title, className = 'btn', label = 'Share' }: { path: string; title: string; className?: string; label?: string }) {
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 2200)
    return () => clearTimeout(t)
  }, [done])
  const url = shareUrl(path)
  return (
    <button
      className={className}
      onClick={async () => {
        try {
          if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ title, url })
          else await navigator.clipboard.writeText(url)
          setDone(true)
        } catch {
          // Share sheet dismissed; nothing to do.
        }
      }}
    >
      <Icon name={done ? 'check' : 'share'} className="h-4 w-4" />
      <span aria-live="polite">{done ? 'Link copied' : label}</span>
    </button>
  )
}

/** A row on a call sheet: time in Montserrat, title in Playfair, no card. */
export function EventRow({ e, showDay = true, compact = false }: { e: CampusEvent; showDay?: boolean; compact?: boolean }) {
  const open = useOpenEvent()
  const past = e.end < new Date()
  return (
    <article className={`row-hover group relative grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-start gap-3 border-b border-line py-4 ${compact ? '' : 'sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] md:grid-cols-[6.5rem_minmax(0,1fr)_12rem_auto] md:gap-6 md:py-5'}`}>
      <div className="pt-0.5">
        {showDay && <p className="eyebrow !text-[0.6rem] !tracking-[0.14em]">{Math.abs(daysFrom(e.start)) < 7 ? relativeDay(e.start) : dayMonth(e.start)}</p>}
        <Num className="mt-0.5 block text-base text-paper md:text-lg">{time(e.start)}</Num>
      </div>
      <div className="min-w-0">
        <h3 className="text-lg leading-snug md:text-2xl">
          {/* The whole row is the link target; the button keeps it keyboard-reachable */}
          <button className="hover-gold text-left after:absolute after:inset-0 after:content-['']" onClick={() => open(e.id)}>
            {e.title}
          </button>
        </h3>
        <p className="mt-1 truncate text-sm text-mute">
          {e.hostName} · {e.venue}
        </p>
        <div className={`mt-2 flex flex-wrap gap-2 ${compact ? '' : 'md:hidden'}`}>
          <StatusTag e={e} />
        </div>
      </div>
      <div className={compact ? 'hidden' : 'hidden pt-1 md:block'}>
        <div className="mb-2">
          <StatusTag e={e} />
        </div>
        {!past && <SeatMeter e={e} />}
        {past && e.photos?.length ? <p className="text-xs text-mute"><Num>{e.photos.length}</Num> photographs</p> : null}
      </div>
      <div className="relative z-10">
        <SaveButton id={e.id} />
      </div>
    </article>
  )
}

function EventSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { eventById } = useCatalog()
  const e = id ? eventById(id) : undefined
  const titleId = useId()
  return (
    <Dialog open={!!e} onClose={onClose} variant="sheet" labelledBy={titleId}>
      {e && <EventDetail e={e} titleId={titleId} onClose={onClose} />}
    </Dialog>
  )
}

function EventDetail({ e, titleId, onClose }: { e: CampusEvent; titleId: string; onClose: () => void }) {
  const store = useStore()
  const { profile, waitlisted, reminders, setReminders, attended } = store
  const state = useRsvp(e)
  const past = state === 'past'
  const guest = !profile?.email
  const mine = reminders[e.id] ?? []
  const me = myAttendeeId(profile)
  const checkedIn = (store.checkins[e.id] ?? []).includes(me)

  return (
    <div className="flex h-full max-h-[inherit] flex-col border-t border-line-strong bg-slate-2 md:border-t-0 md:border-l">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3 md:px-8 md:py-4">
        <p className="eyebrow">{e.kind} · {e.category}</p>
        <button onClick={onClose} aria-label="Close" className="icon-btn">
          <Icon name="close" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-6 pb-8 md:px-8">
        <h2 id={titleId} className="text-[clamp(1.9rem,1.5rem+1.6vw,2.7rem)] leading-[1.05]">{e.title}</h2>
        <a href={href(`clubs/${e.hostId}`)} onClick={onClose} className="hover-gold mt-2 inline-flex items-center gap-1.5 text-gold">
          {e.hostName} <Icon name="arrow" className="h-4 w-4" />
        </a>

        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 border-y border-line py-5 text-sm">
          <dt><Icon name="calendar" className="h-5 w-5 text-gold" /><span className="sr-only">Date</span></dt>
          <dd><Num>{longDate(e.start)}</Num><span className="text-mute"> · {relativeDay(e.start)}</span></dd>
          <dt><Icon name="clock" className="h-5 w-5 text-gold" /><span className="sr-only">Time</span></dt>
          <dd>
            <Num>{time(e.start)} to {time(e.end)}</Num>
            {!past && <span className="text-mute"> · {e.start > new Date() ? `starts ${countdown(e.start)}` : 'on now'}</span>}
          </dd>
          <dt><Icon name="pin" className="h-5 w-5 text-gold" /><span className="sr-only">Venue</span></dt>
          <dd>{e.venue}, {e.campus}</dd>
        </dl>

        <p className="mt-6 leading-relaxed">{e.summary}</p>
        <p className="mt-3 text-sm text-mute">{e.free ? 'Free entry.' : 'A small materials fee applies, payable at the venue.'}</p>

        {!past && (
          <div className="mt-6">
            <SeatMeter e={e} />
          </div>
        )}

        {state === 'waitlisted' && (
          <div role="status" className="mt-6 border border-gold/50 p-4">
            <p className="eyebrow">You’re on the waitlist</p>
            <p className="mt-2 text-sm">
              Place <Num className="text-gold">{waitlisted[e.id]}</Num>. If someone cancels, the seat is yours and we’ll tell you straight away.
            </p>
          </div>
        )}

        {state === 'going' && (
          <section aria-labelledby={`${titleId}-ticket`} className="mt-8 grid gap-5 border border-line-strong p-5 sm:grid-cols-[auto_1fr]">
            <div className="justify-self-start bg-white p-2">
              <Qr value={`RVUC:${e.id}:${me}`} label={`Entry code for ${e.title}`} size={150} />
            </div>
            <div>
              <h3 id={`${titleId}-ticket`} className="eyebrow">Your entry pass</h3>
              <p className="mt-3 font-num text-2xl tracking-[0.12em] text-paper">{ticketCode(e.id, me)}</p>
              <p className="mt-2 text-sm text-mute">Show this at the door. The host scans it to mark your attendance; the code works if the camera doesn’t.</p>
              {checkedIn && <p className="tag tag-gold mt-3">Checked in</p>}
            </div>
          </section>
        )}

        {(state === 'going' || state === 'waitlisted') && (
          <fieldset className="mt-8">
            <legend className="eyebrow">Remind me</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((o) => {
                const on = mine.includes(o.mins)
                const tooLate = e.start.getTime() - o.mins * 60_000 < Date.now()
                return (
                  <button
                    key={o.mins}
                    className="chip"
                    aria-pressed={on}
                    disabled={tooLate && !on}
                    onClick={() => setReminders(e.id, on ? mine.filter((m) => m !== o.mins) : [...mine, o.mins])}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-mute">Reminders arrive in your notifications here. In production they also go to your RVU email.</p>
          </fieldset>
        )}

        {past && (
          <section className="mt-8" aria-label="Event archive">
            {attended.includes(e.id) && <p className="tag tag-gold mb-4">You attended</p>}
            {e.recap && (
              <>
                <h3 className="eyebrow">What happened</h3>
                <p className="mt-2 leading-relaxed">{e.recap}</p>
              </>
            )}
            <h3 className="eyebrow mt-6 mb-3">Photographs</h3>
            <ContactSheet photos={e.photos ?? []} />
          </section>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:gap-3 md:px-8">
        <RsvpButton e={e} state={state} guest={guest} onClose={onClose} />
        {!past && (
          <>
            <a className="btn" href={googleCalendarUrl(e)} target="_blank" rel="noreferrer">
              <Icon name="calendar" className="h-4 w-4" /> <span className="hidden sm:inline">Google</span> Calendar
            </a>
            <a className="btn btn-sm hidden sm:inline-flex" href={icsFor(e)} download={`${e.id}.ics`}>.ics</a>
          </>
        )}
        <ShareButton path={`events/${e.id}`} title={e.title} />
        <SaveButton id={e.id} />
      </div>
    </div>
  )
}

export function RsvpButton({ e, state, guest, onClose }: { e: CampusEvent; state: RsvpState; guest: boolean; onClose?: () => void }) {
  const { register, cancelRegistration, joinWaitlist, leaveWaitlist } = useStore()
  const [confirmCancel, setConfirmCancel] = useState(false)
  if (state === 'past') return null
  if (guest && state !== 'closed') return <a className="btn btn-gold" href="#/" onClick={onClose}>Sign in to RSVP</a>
  switch (state) {
    case 'open':
      return (
        <button className="btn btn-gold" onClick={() => register(e.id)}>
          <Icon name="ticket" className="h-4 w-4" /> RSVP
        </button>
      )
    case 'waitlist-open':
    case 'full':
      return <button className="btn btn-gold" onClick={() => joinWaitlist(e.id, e.waitlist + 1)}>Join waitlist</button>
    case 'waitlisted':
      return <button className="btn" onClick={() => leaveWaitlist(e.id)}>Leave waitlist</button>
    case 'going':
      return confirmCancel ? (
        <span className="flex items-center gap-2">
          <button className="btn" onClick={() => { cancelRegistration(e.id); setConfirmCancel(false) }}>Give up my seat</button>
          <button className="btn btn-sm" onClick={() => setConfirmCancel(false)}>Keep it</button>
        </span>
      ) : (
        <button className="btn btn-gold" onClick={() => setConfirmCancel(true)} aria-label="You’re going. Cancel your seat?">
          <Icon name="check" className="h-4 w-4" /> Going
        </button>
      )
    case 'closed':
      return <span className="text-sm text-mute">Registration is closed.</span>
  }
}
