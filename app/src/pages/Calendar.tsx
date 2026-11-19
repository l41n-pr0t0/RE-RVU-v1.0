import { useMemo, useState } from 'react'
import { EventRow, useOpenEvent } from '../components/EventBits'
import { EmptyState, Icon, PageHeader, SectionTitle } from '../components/ui'
import { longDate, monthLabel, time } from '../lib/format'
import { useCatalog } from '../lib/catalog'
import { href } from '../lib/router'
import { useStore } from '../lib/store'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

/** Month view of the events you saved or signed up for, with everything else as a faint option. */
export default function Calendar() {
  const { allEvents } = useCatalog()
  const { savedEvents, registered } = useStore()
  const open = useOpenEvent()
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [picked, setPicked] = useState<Date>(today)
  const [all, setAll] = useState(false)

  const mine = (id: string) => savedEvents.includes(id) || registered.includes(id)
  const shown = allEvents.filter((e) => all || mine(e.id))

  // Grid of 6 weeks starting on Monday.
  const cells = useMemo(() => {
    const first = new Date(cursor)
    const lead = (first.getDay() + 6) % 7
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - lead)
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }, [cursor])

  const onDay = (d: Date) => shown.filter((e) => sameDay(e.start, d)).sort((a, b) => +a.start - +b.start)
  const dayList = onDay(picked)
  const shift = (n: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1))

  return (
    <div className="pb-16">
      <PageHeader
        scene="10"
        eyebrow="Calendar"
        title="Your month."
        aside={
          <button type="button" className="chip" aria-pressed={all} onClick={() => setAll(!all)}>
            Show all campus events
          </button>
        }
      >
        Events you saved or signed up for. Add any of them to Google Calendar from the event.
      </PageHeader>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label={monthLabel(cursor)} className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl">{monthLabel(cursor)}</h2>
            <div className="flex gap-2">
              <button type="button" className="icon-btn" aria-label="Previous month" onClick={() => shift(-1)}><Icon name="arrow-left" /></button>
              <button type="button" className="btn btn-sm" onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setPicked(today) }}>Today</button>
              <button type="button" className="icon-btn" aria-label="Next month" onClick={() => shift(1)}><Icon name="arrow" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-t border-l border-line" role="grid">
            {DAYS.map((d) => (
              <div key={d} role="columnheader" className="eyebrow border-r border-b border-line px-2 py-2 text-center">{d}</div>
            ))}
            {cells.map((d) => {
              const list = onDay(d)
              const inMonth = d.getMonth() === cursor.getMonth()
              const isToday = sameDay(d, today)
              const sel = sameDay(d, picked)
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  role="gridcell"
                  aria-selected={sel}
                  aria-label={`${longDate(d)}, ${list.length} ${list.length === 1 ? 'event' : 'events'}`}
                  onClick={() => setPicked(d)}
                  className={`relative flex min-h-14 flex-col items-start gap-1 border-r border-b border-line p-1.5 text-left transition-colors sm:min-h-24 sm:p-2 ${
                    sel ? 'bg-gold text-[#000]' : 'row-hover'
                  } ${inMonth ? '' : 'opacity-40'}`}
                >
                  <span className={`num text-sm ${isToday && !sel ? 'text-gold' : ''}`}>{d.getDate()}</span>
                  <span className="hidden w-full flex-col gap-0.5 sm:flex">
                    {list.slice(0, 2).map((e) => (
                      <span key={e.id} className={`block truncate text-[0.7rem] leading-tight ${sel ? '' : mine(e.id) ? 'text-paper' : 'text-mute'}`}>
                        {time(e.start)} {e.title}
                      </span>
                    ))}
                    {list.length > 2 && <span className="text-[0.7rem] text-mute">+{list.length - 2} more</span>}
                  </span>
                  {list.length > 0 && (
                    <span className="flex gap-0.5 sm:hidden" aria-hidden>
                      {list.slice(0, 3).map((e) => <span key={e.id} className={`h-1.5 w-1.5 ${sel ? 'bg-[#000]' : 'bg-gold'}`} />)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="day-list">
          <SectionTitle id="day-list" title={sameDay(picked, today) ? 'Today' : longDate(picked)} count={dayList.length} />
          {dayList.length ? (
            <ul className="border-t border-line">{dayList.map((e) => <EventRow key={e.id} e={e} showDay={false} compact />)}</ul>
          ) : (
            <EmptyState
              title="Nothing this day"
              body={all ? 'No campus events are listed for this day.' : 'Nothing you saved falls on this day.'}
              action={<a className="btn" href={href('events')}>Browse events</a>}
            />
          )}
          {dayList.length > 0 && (
            <button type="button" className="btn mt-4 w-full" onClick={() => open(dayList[0].id)}>Open the first event</button>
          )}
        </section>
      </div>
    </div>
  )
}
