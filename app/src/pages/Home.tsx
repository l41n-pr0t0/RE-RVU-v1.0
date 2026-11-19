import { useState } from 'react'
import { EventRow, SeatMeter, StatusTag, useOpenEvent } from '../components/EventBits'
import { GoldLine } from '../components/GoldLine'
import { EmptyState, ErrorState, ListSkeleton, Monogram, Num, Reveal } from '../components/ui'
import { clubs, events, notices, projects } from '../data/mock'
import { countdown, daysFrom, longDate, relativeDay, time } from '../lib/format'
import { href } from '../lib/router'
import { useQuery, useStore } from '../lib/store'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export function Home() {
  const { profile, savedEvents, followedClubs, readNotices, markRead } = useStore()
  const q = useQuery(events)
  const openEvent = useOpenEvent()
  const [day, setDay] = useState<number | null>(null)
  const now = new Date()

  const upcoming = events.filter((e) => e.end > now).sort((a, b) => +a.start - +b.start)
  const thisWeek = upcoming.filter((e) => daysFrom(e.start) < 7)
  const next = upcoming.find((e) => savedEvents.includes(e.id)) ?? upcoming[0]
  const dueNotices = notices.filter((n) => n.priority === 'High' && !readNotices.includes(n.id))
  const forYou = upcoming.filter((e) => profile?.interests.includes(e.category) || followedClubs.includes(e.hostId)).slice(0, 4)
  const dayList = day === null ? thisWeek : upcoming.filter((e) => daysFrom(e.start) === day)
  const matchedRoles = projects.filter((p) => profile?.interests.includes(p.category)).slice(0, 2)
  const roles = matchedRoles.length ? matchedRoles : projects.slice(0, 2)
  const recruiting = clubs.filter((c) => c.recruiting && (!profile?.interests.length || profile.interests.includes(c.category))).slice(0, 3)

  return (
    <div>
      {/* Opening: the greeting, then the one thing that matters next */}
      <section className="grid gap-10 pt-10 pb-12 md:grid-cols-12 md:pt-16">
        <Reveal className="md:col-span-7">
          <p className="eyebrow">
            {relativeDay(now)} · <Num>{longDate(now)}</Num>
          </p>
          <h1 className="mt-3 text-5xl leading-[1.02] md:text-7xl">
            {greeting()},<br />
            <span className="italic text-gold">{profile?.name.split(' ')[0] || 'there'}.</span>
          </h1>
          <p className="mt-5 max-w-[48ch] text-mute">
            {dueNotices.length > 0 ? (
              <>
                You have <Num className="text-paper">{dueNotices.length}</Num> deadline{dueNotices.length > 1 ? 's' : ''} coming up and{' '}
                <Num className="text-paper">{thisWeek.length}</Num> events on campus this week.
              </>
            ) : (
              <>Nothing urgent. Here’s what’s on this week.</>
            )}
          </p>
        </Reveal>

        <Reveal delay={0.15} className="md:col-span-5">
          {q.status === 'loading' && <div className="skeleton h-56" />}
          {q.status === 'error' && <ErrorState onRetry={q.retry} />}
          {q.status === 'ready' && next && (
            <button
              onClick={() => openEvent(next.id)}
              className="panel group block w-full p-6 text-left transition-colors hover:border-gold/50 md:p-7"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow">{savedEvents.includes(next.id) ? 'Your next event' : 'Up next on campus'}</p>
                <StatusTag e={next} />
              </div>
              <p className="mt-4 font-display text-3xl leading-tight transition-colors group-hover:text-gold">{next.title}</p>
              <p className="mt-2 text-sm text-mute">
                {relativeDay(next.start)} · <Num>{time(next.start)}</Num> · {next.venue}
              </p>
              <p className="mt-5 font-num text-4xl text-gold">{countdown(next.start)}</p>
              <div className="mt-5">
                <SeatMeter e={next} />
              </div>
            </button>
          )}
        </Reveal>
      </section>

      {/* Deadlines appear only when there are some: no empty boxes on the first screen (F5) */}
      {dueNotices.length > 0 && (
        <Reveal>
          <section aria-labelledby="due" className="mb-14 rounded-2xl border border-gold/30 bg-gold/[0.04] p-5 md:p-6">
            <h2 id="due" className="sr-only">
              Deadlines
            </h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {dueNotices.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-4 border-l-2 border-gold pl-4">
                  <div>
                    <p className="text-[0.7rem] tracking-[0.16em] text-gold uppercase">Due {countdown(n.due!)}</p>
                    <p className="mt-1 font-bold">{n.title}</p>
                    <p className="text-sm text-mute">{n.from}</p>
                  </div>
                  <button
                    onClick={() => markRead(n.id)}
                    className="shrink-0 text-sm text-mute underline-offset-4 hover:text-gold hover:underline"
                  >
                    Got it
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      {/* The Gold Line: this week */}
      <section aria-labelledby="week" className="mb-20">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="week" className="text-3xl md:text-4xl">
            Your week
          </h2>
          <a href={href('events')} className="text-sm text-gold hover:underline">
            All events
          </a>
        </div>
        {q.status === 'loading' && <ListSkeleton rows={3} />}
        {q.status === 'error' && <ErrorState onRetry={q.retry} />}
        {q.status === 'ready' && (
          <>
            <GoldLine events={upcoming} selectedDay={day} onSelectDay={setDay} onOpen={openEvent} />
            <div className="mt-6">
              {dayList.length === 0 ? (
                <EmptyState
                  title="A free day"
                  body="Nothing is scheduled on campus for this day. Pick another day on the line, or see what’s coming later."
                  action={
                    <button className="btn btn-ghost" onClick={() => setDay(null)}>
                      Show the whole week
                    </button>
                  }
                />
              ) : (
                dayList.map((e) => <EventRow key={e.id} e={e} />)
              )}
            </div>
          </>
        )}
      </section>

      {/* Picked for you, and people looking for you: an asymmetric split */}
      <section className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-7">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-3xl">Picked for you</h2>
            <a href={href('profile')} className="text-sm text-gold hover:underline">
              Edit interests
            </a>
          </div>
          {profile?.interests.length ? <p className="mb-4 text-sm text-mute">Because you chose {profile.interests.join(', ')}.</p> : null}
          {forYou.length === 0 ? (
            <EmptyState
              title="Tell us what you like"
              body="Choose a few interests or follow a club, and matching events will appear here."
              action={
                <a className="btn btn-gold" href={href('profile')}>
                  Choose interests
                </a>
              }
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {forYou.map((e) => (
                <li key={e.id}>
                  <button onClick={() => openEvent(e.id)} className="panel group block h-full w-full p-5 text-left hover:border-gold/50">
                    <p className="text-[0.7rem] tracking-[0.16em] text-mute uppercase">
                      {e.category} · {relativeDay(e.start)}
                    </p>
                    <p className="mt-2 font-display text-xl leading-snug group-hover:text-gold">{e.title}</p>
                    <p className="mt-1 text-sm text-mute">{e.hostName}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="md:col-span-5">
          <h2 className="mb-5 text-3xl">Teams looking for you</h2>
          {roles.map((p) => (
            <a key={p.id} href={href(`projects/${p.id}`)} className="group block border-t border-line py-5">
              <p className="font-display text-xl group-hover:text-gold">{p.title}</p>
              <p className="mt-1 text-sm text-mute">
                Needs {p.roles.join(' and ').toLowerCase()} · closes {relativeDay(p.deadline).toLowerCase()}
              </p>
            </a>
          ))}

          <h2 className="mt-12 mb-5 text-3xl">Clubs recruiting now</h2>
          {recruiting.length === 0 ? (
            <p className="text-sm text-mute">
              No clubs in your interests are recruiting right now.{' '}
              <a href={href('clubs')} className="text-gold hover:underline">
                Browse all clubs
              </a>
            </p>
          ) : (
            <div className="flex flex-col">
              {recruiting.map((c) => (
                <a key={c.id} href={href(`clubs/${c.id}`)} className="group flex items-center gap-4 border-t border-line py-4">
                  <Monogram text={c.mono} />
                  <span className="min-w-0">
                    <span className="block font-bold group-hover:text-gold">{c.name}</span>
                    <span className="block truncate text-sm text-mute">{c.tagline}</span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>
  )
}
