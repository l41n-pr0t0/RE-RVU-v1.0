import { useEffect, useMemo, useState } from 'react'
import { EventRow, isOpen, useOpenEvent } from '../components/EventBits'
import { EmptyState, ErrorState, Icon, ListSkeleton, Num, PageHeader } from '../components/ui'
import { events, pastEvents } from '../data/mock'
import { CATEGORIES, type Category } from '../data/types'
import { daysFrom, longDate, relativeDay } from '../lib/format'
import { useQuery, useStore } from '../lib/store'

type When = 'all' | 'today' | 'week' | 'later' | 'past'
const WHEN: { key: When; label: string }[] = [
  { key: 'all', label: 'Upcoming' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'later', label: 'Later' },
  { key: 'past', label: 'Past' },
]

/** Sc. 03: Events. One list grouped by day, filters as chips instead of three dropdowns (F8, F9). */
export default function Events({ id }: { id?: string }) {
  const openEvent = useOpenEvent()
  const { savedEvents, registered } = useStore()
  const [when, setWhen] = useState<When>('all')
  const [cats, setCats] = useState<Category[]>([])
  const [openOnly, setOpenOnly] = useState(false)
  const [mineOnly, setMineOnly] = useState(false)
  const [text, setText] = useState('')
  const q = useQuery(events)
  const now = useMemo(() => new Date(), [])

  // Deep link: #/events/ai-build-night opens the sheet over the list
  useEffect(() => {
    if (id) openEvent(id)
  }, [id, openEvent])

  const list = useMemo(() => {
    const src = when === 'past' ? [...pastEvents].sort((a, b) => +b.start - +a.start) : events.filter((e) => e.end > now).sort((a, b) => +a.start - +b.start)
    const s = text.trim().toLowerCase()
    return src.filter((e) => {
      const d = daysFrom(e.start, now)
      if (when === 'today' && d !== 0) return false
      if (when === 'week' && d > 6) return false
      if (when === 'later' && d < 7) return false
      if (cats.length && !cats.includes(e.category)) return false
      if (openOnly && !isOpen(e)) return false
      if (mineOnly && !savedEvents.includes(e.id) && !registered.includes(e.id)) return false
      if (s && !`${e.title} ${e.hostName} ${e.venue} ${e.summary}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [when, cats, openOnly, mineOnly, text, now, savedEvents, registered])

  const groups = useMemo(() => {
    const m = new Map<string, typeof list>()
    for (const e of list) {
      const k = e.start.toDateString()
      m.set(k, [...(m.get(k) ?? []), e])
    }
    return [...m.values()]
  }, [list])

  const filtered = cats.length > 0 || openOnly || mineOnly || text.trim() !== '' || when !== 'all'
  const clear = () => {
    setCats([])
    setOpenOnly(false)
    setMineOnly(false)
    setText('')
    setWhen('all')
  }

  return (
    <>
      <PageHeader scene="03" eyebrow="Events" title="What’s on" aside={<p className="text-sm text-mute"><Num>{events.length}</Num> upcoming · past events stay visible</p>}>
        <p>Every club and school event in one list, by day. Save one to put it on your week.</p>
      </PageHeader>

      {/* Filters */}
      <div className="sticky top-14 z-30 -mx-[clamp(1rem,0.6rem+2vw,2.5rem)] border-b border-line bg-ink px-[clamp(1rem,0.6rem+2vw,2.5rem)] py-3 md:top-16">
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="When" className="flex overflow-x-auto border border-line no-scrollbar">
            {WHEN.map((w) => (
              <button
                key={w.key}
                aria-pressed={when === w.key}
                onClick={() => setWhen(w.key)}
                className={`h-10 shrink-0 border-l border-line px-3 text-[0.7rem] font-bold tracking-[0.12em] uppercase first:border-l-0 ${when === w.key ? 'bg-paper text-ink' : 'hover-gold text-mute'}`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <label className="relative min-w-[12rem] flex-1">
            <span className="sr-only">Search events</span>
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute" />
            <input className="field !h-10 !pl-9" type="search" placeholder="Search by name, club or venue" value={text} onChange={(e) => setText(e.target.value)} />
          </label>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          <button className="chip shrink-0" aria-pressed={mineOnly} onClick={() => setMineOnly((x) => !x)}>
            <Icon name="bookmark" className="h-3.5 w-3.5" /> Mine
          </button>
          <button className="chip shrink-0" aria-pressed={openOnly} onClick={() => setOpenOnly((x) => !x)}>
            Open to register
          </button>
          <span className="w-px shrink-0 bg-line" aria-hidden />
          {CATEGORIES.map((c) => (
            <button key={c} className="chip shrink-0" aria-pressed={cats.includes(c)} onClick={() => setCats((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite" className="mt-4 flex items-center justify-between text-sm text-mute">
        <span>
          <Num>{list.length}</Num> event{list.length === 1 ? '' : 's'}
        </span>
        {filtered && (
          <button className="hover-gold underline underline-offset-4" onClick={clear}>
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-2">
        {q.status === 'loading' && <ListSkeleton rows={5} />}
        {q.status === 'error' && <ErrorState onRetry={q.retry} />}
        {q.status === 'ready' &&
          (groups.length === 0 ? (
            <EmptyState title="No events match" body="Try a wider time range or fewer categories." action={<button className="btn" onClick={clear}>Clear filters</button>} />
          ) : (
            groups.map((g) => (
              <section key={g[0].start.toDateString()} aria-label={longDate(g[0].start)} className="mt-6 first:mt-2">
                <h2 className="flex items-baseline gap-3 border-b border-line-strong pb-2 font-sans text-base font-bold">
                  {relativeDay(g[0].start, now)}
                  <Num className="text-sm font-normal text-mute">{longDate(g[0].start)}</Num>
                </h2>
                {g.map((e) => (
                  <EventRow key={e.id} e={e} showDay={false} />
                ))}
              </section>
            ))
          ))}
      </div>
    </>
  )
}
