import { useMemo, useState } from 'react'
import { EmptyState, ErrorState, Icon, ListSkeleton, Num, PageHeader } from '../components/ui'
import { notices } from '../data/mock'
import { daysFrom, longDate, relativeDay } from '../lib/format'
import { useQuery, useStore } from '../lib/store'

type Tab = 'unread' | 'all'

/** Sc. 06: notices. Action-needed first, then by date. Reading one marks it read. */
export default function Notices() {
  const q = useQuery(notices)
  const { readNotices, markRead } = useStore()
  const [tab, setTab] = useState<Tab>('unread')
  const [open, setOpen] = useState<string | null>(null)
  const now = useMemo(() => new Date(), [])

  const sorted = useMemo(
    () =>
      [...notices].sort((a, b) => {
        const pa = a.priority === 'High' ? 0 : 1
        const pb = b.priority === 'High' ? 0 : 1
        return pa - pb || +b.posted - +a.posted
      }),
    [],
  )
  const unread = sorted.filter((n) => !readNotices.includes(n.id))
  const list = tab === 'unread' ? unread : sorted

  const toggle = (id: string) => {
    setOpen((o) => (o === id ? null : id))
    markRead(id)
  }

  return (
    <>
      <PageHeader scene="06" eyebrow="Notices" title="From the university" aside={<p className="text-sm text-mute"><Num>{unread.length}</Num> unread</p>}>
        <p>Official notices from offices and schools. Anything with a deadline sits at the top until you’ve read it.</p>
      </PageHeader>

      <div role="group" aria-label="Show" className="mt-6 inline-flex border border-line">
        {(['unread', 'all'] as Tab[]).map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)} className={`h-10 border-l border-line px-4 text-[0.7rem] font-bold tracking-[0.12em] uppercase first:border-l-0 ${tab === t ? 'bg-paper text-ink' : 'hover-gold text-mute'}`}>
            {t === 'unread' ? <>Unread <Num>{unread.length}</Num></> : 'All'}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {q.status === 'loading' && <ListSkeleton rows={4} />}
        {q.status === 'error' && <ErrorState onRetry={q.retry} />}
        {q.status === 'ready' &&
          (list.length === 0 ? (
            <EmptyState title="You’re all caught up" body="New notices from the university appear here and on your Today page." action={<button className="btn" onClick={() => setTab('all')}>See all notices</button>} />
          ) : (
            <ul className="border-t border-line">
              {list.map((n) => {
                const isOpen = open === n.id
                const read = readNotices.includes(n.id)
                const left = n.due ? daysFrom(n.due, now) : null
                return (
                  <li key={n.id} className="border-b border-line">
                    <h2 className="font-sans text-base">
                      <button aria-expanded={isOpen} aria-controls={`n-${n.id}`} onClick={() => toggle(n.id)} className="row-hover grid w-full grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-4 py-5 text-left">
                        <span aria-hidden className={`mt-2 h-2 w-2 ${read ? 'border border-line-strong' : 'bg-gold'}`} />
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            {n.priority === 'High' && <span className="tag tag-gold">Action needed</span>}
                            {left !== null && left >= 0 && <span className="num text-xs text-gold">Due {daysFrom(n.due!, now) < 2 ? relativeDay(n.due!, now).toLowerCase() : relativeDay(n.due!, now)}</span>}
                          </span>
                          <span className={`mt-1.5 block text-lg ${read ? 'text-mute' : 'font-bold'}`}>{n.title}</span>
                          <span className="mt-0.5 block text-sm text-mute">{n.from}</span>
                        </span>
                        <span className="flex items-center gap-3 text-sm text-mute">
                          <Num className="hidden sm:inline">{longDate(n.posted)}</Num>
                          <Icon name="arrow" className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                        </span>
                      </button>
                    </h2>
                    <div id={`n-${n.id}`} hidden={!isOpen} className="pb-6 pl-9">
                      <p className="max-w-[65ch] leading-relaxed">{n.body}</p>
                      <p className="mt-3 text-sm text-mute sm:hidden">Posted <Num>{longDate(n.posted)}</Num></p>
                      {n.due && <p className="mt-3 text-sm">Deadline: <Num className="text-gold">{longDate(n.due)}</Num></p>}
                      {n.actionLabel && <button className="btn btn-sm btn-gold mt-4">{n.actionLabel}</button>}
                    </div>
                  </li>
                )
              })}
            </ul>
          ))}
      </div>
    </>
  )
}
