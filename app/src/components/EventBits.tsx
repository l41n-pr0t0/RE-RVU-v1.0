import { createContext, useContext, useId, useState, type ReactNode } from 'react'
import { eventById } from '../data/mock'
import type { CampusEvent } from '../data/types'
import { countdown, dayMonth, daysFrom, icsFor, longDate, relativeDay, time } from '../lib/format'
import { href } from '../lib/router'
import { useStore } from '../lib/store'
import { Dialog, Icon, Num } from './ui'

/* Open an event from anywhere without losing your place in the list. */
const Ctx = createContext<(id: string) => void>(() => {})
export const useOpenEvent = () => useContext(Ctx)

export function EventDrawerProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null)
  return (
    <Ctx.Provider value={setId}>
      {children}
      <EventSheet id={id} onClose={() => setId(null)} />
    </Ctx.Provider>
  )
}

export const seatsLeft = (e: CampusEvent) => Math.max(e.seats - e.registered, 0)
export const isOpen = (e: CampusEvent) => e.registrationOpen && seatsLeft(e) > 0

export function SeatMeter({ e }: { e: CampusEvent }) {
  const pct = Math.min(e.registered / e.seats, 1)
  const left = seatsLeft(e)
  return (
    <div>
      <div className="h-[3px] w-full bg-line">
        <div className="h-full origin-left bg-gold" style={{ transform: `scaleX(${pct})` }} />
      </div>
      <p className="mt-1.5 text-xs text-mute">
        {left === 0 ? 'Full: waitlist at the door' : <><Num>{left}</Num> of <Num>{e.seats}</Num> seats left</>}
      </p>
    </div>
  )
}

export function StatusTag({ e }: { e: CampusEvent }) {
  if (!isOpen(e)) return <span className="tag">Closed</span>
  if (seatsLeft(e) / e.seats < 0.15) return <span className="tag tag-gold">Filling fast</span>
  return <span className="tag tag-teal">Open</span>
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
      aria-label={saved ? 'Remove from your week' : 'Save to your week'}
      className="icon-btn"
    >
      <Icon name={saved ? 'bookmark-fill' : 'bookmark'} className="h-[18px] w-[18px]" />
    </button>
  )
}

/** A row on a call sheet: time in Montserrat, title in Playfair, no card. */
export function EventRow({ e, showDay = true }: { e: CampusEvent; showDay?: boolean }) {
  const open = useOpenEvent()
  const { registered } = useStore()
  const going = registered.includes(e.id)
  return (
    <article className="row-hover group relative grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-start gap-3 border-b border-line py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] md:grid-cols-[6.5rem_minmax(0,1fr)_12rem_auto] md:gap-6 md:py-5">
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
        <div className="mt-2 flex flex-wrap gap-2 md:hidden">
          {going ? <span className="tag tag-gold">Going</span> : <StatusTag e={e} />}
        </div>
      </div>
      <div className="hidden pt-1 md:block">
        <div className="mb-2">{going ? <span className="tag tag-gold">Going</span> : <StatusTag e={e} />}</div>
        <SeatMeter e={e} />
      </div>
      <div className="relative z-10">
        <SaveButton id={e.id} />
      </div>
    </article>
  )
}

function EventSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const e = id ? eventById(id) : undefined
  const titleId = useId()
  return (
    <Dialog open={!!e} onClose={onClose} variant="sheet" labelledBy={titleId}>
      {e && <EventDetail e={e} titleId={titleId} onClose={onClose} />}
    </Dialog>
  )
}

function EventDetail({ e, titleId, onClose }: { e: CampusEvent; titleId: string; onClose: () => void }) {
  const { registered, register, profile } = useStore()
  const going = registered.includes(e.id)
  const past = e.end < new Date()
  const guest = !profile?.email
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
          <dd><Num>{time(e.start)} to {time(e.end)}</Num>{!past && e.start > new Date() && <span className="text-mute"> · starts {countdown(e.start)}</span>}</dd>
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
        {past && <p className="mt-6 border border-line p-4 text-sm text-mute">This event has ended. It stays on the club page so you can see what they run.</p>}
      </div>

      {!past && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8">
          {going ? (
            <span role="status" className="btn btn-gold pointer-events-none">
              <Icon name="check" className="h-4 w-4" /> You’re going
            </span>
          ) : isOpen(e) ? (
            guest ? (
              <a className="btn btn-gold" href="#/" onClick={onClose}>Sign in to register</a>
            ) : (
              <button className="btn btn-gold" onClick={() => register(e.id)}>
                <Icon name="ticket" className="h-4 w-4" /> Register
              </button>
            )
          ) : (
            <span className="text-sm text-mute">Registration is closed.</span>
          )}
          <a className="btn" href={icsFor(e)} download={`${e.id}.ics`}>
            <Icon name="calendar" className="h-4 w-4" /> Calendar
          </a>
          <SaveButton id={e.id} />
        </div>
      )}
    </div>
  )
}
