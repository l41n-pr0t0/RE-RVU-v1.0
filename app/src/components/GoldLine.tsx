import { motion, useReducedMotion } from 'framer-motion'
import type { CampusEvent } from '../data/types'
import { daysFrom, time, weekday } from '../lib/format'
import { DOLLY, Num } from './ui'

/**
 * Signature element: the base line of the RV University wordmark, extended
 * into a seven-day timeline. Each event is a marker; "now" glows.
 */
export function GoldLine({
  events,
  selectedDay,
  onSelectDay,
  onOpen,
}: {
  events: CampusEvent[]
  selectedDay: number | null
  onSelectDay: (d: number | null) => void
  onOpen: (id: string) => void
}) {
  const reduce = useReducedMotion()
  const now = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    return d
  })
  // Position on the line: 0..1 across seven days
  const pos = (d: Date) => {
    const dayIdx = daysFrom(d, now)
    const frac = (d.getHours() + d.getMinutes() / 60 - 7) / 16 // 7 am to 11 pm band
    return (dayIdx + Math.min(Math.max(frac, 0.05), 0.95)) / 7
  }
  const nowPos = pos(now)
  const week = events.filter((e) => {
    const n = daysFrom(e.start, now)
    return n >= 0 && n < 7
  })

  return (
    <div className="relative select-none">
      {/* Day labels */}
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const active = selectedDay === i
          const count = week.filter((e) => daysFrom(e.start, now) === i).length
          return (
            <button
              key={i}
              onClick={() => onSelectDay(active ? null : i)}
              aria-pressed={active}
              className={`group flex flex-col items-start gap-0.5 rounded-lg px-1.5 py-2 text-left transition-colors md:px-2 ${
                active ? 'text-gold' : 'text-mute hover:text-paper'
              }`}
            >
              <span className="text-[0.7rem] uppercase tracking-[0.16em]">{i === 0 ? 'Today' : weekday(d)}</span>
              <Num className={`text-xl md:text-2xl ${active ? 'text-gold' : 'text-paper'}`}>{d.getDate()}</Num>
              <span className="text-[0.7rem]">
                {count ? (
                  <>
                    <Num>{count}</Num> event{count > 1 ? 's' : ''}
                  </>
                ) : (
                  'Free'
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* The line */}
      <div className="relative mt-3 h-14">
        <motion.div
          className="absolute top-1/2 left-0 h-px w-full origin-center bg-gold"
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.4, ease: DOLLY }}
        />
        {days.map((_, i) => (
          <span key={i} className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-gold/50" style={{ left: `${(i / 7) * 100}%` }} aria-hidden />
        ))}
        {selectedDay !== null && (
          <motion.span
            layoutId="dayband"
            className="absolute top-0 h-full rounded-md bg-gold/10"
            style={{ left: `${(selectedDay / 7) * 100}%`, width: `${100 / 7}%` }}
            aria-hidden
          />
        )}
        {/* now */}
        <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${nowPos * 100}%` }} aria-label="Now">
          <span className="block h-3 w-3 rounded-full bg-paper shadow-[0_0_18px_4px_rgb(215_172_84/0.55)]" />
        </span>
        {week.map((e, i) => (
          <motion.button
            key={e.id}
            onClick={() => onOpen(e.id)}
            className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 p-2"
            style={{ left: `${pos(e.start) * 100}%` }}
            initial={reduce ? false : { opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: DOLLY, delay: 0.6 + i * 0.06 }}
            aria-label={`${e.title}, ${weekday(e.start, 'long')} ${time(e.start)}`}
          >
            <span className="block h-2.5 w-2.5 rotate-45 border border-gold bg-ink transition-transform group-hover:scale-150 group-hover:bg-gold" />
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate px-2.5 py-1 text-xs text-paper group-hover:block group-focus-visible:block">
              {e.title} · <Num>{time(e.start)}</Num>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
