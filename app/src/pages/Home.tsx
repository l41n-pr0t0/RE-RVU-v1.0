import { useMemo, useState } from 'react'
import { EventRow, SeatMeter, StatusTag, useOpenEvent } from '../components/EventBits'
import { GoldLine } from '../components/GoldLine'
import { EmptyState, ErrorState, Icon, ListSkeleton, Monogram, Num, PageHeader, Reveal, SectionTitle } from '../components/ui'
import { skillMatch, useCatalog } from '../lib/catalog'
import { countdown, daysFrom, longDate, relativeDay, time } from '../lib/format'
import { href } from '../lib/router'
import { useQuery, useStore } from '../lib/store'

const greeting = (h: number) => (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')

/** Sc. 02: Today. What starts next, what is due, and the week on one line. */
export default function Home() {
  const { profile, savedEvents, registered, followedClubs, readNotices, markRead } = useStore()
  const { clubs, events, notices, projects } = useCatalog()
  const q = useQuery(events)
  const openEvent = useOpenEvent()
  const [day, setDay] = useState<number | null>(null)
  const now = useMemo(() => new Date(), [])
  const guest = !profile?.email
  const first = guest ? null : profile?.name.split(' ')[0]

  const upcoming = events.filter((e) => e.end > now).sort((a, b) => +a.start - +b.start)
  const thisWeek = upcoming.filter((e) => daysFrom(e.start, now) < 7)
  const mine = upcoming.filter((e) => registered.includes(e.id) || savedEvents.includes(e.id))
  const next = mine[0] ?? upcoming[0]
  const due = notices.filter((n) => n.priority === 'High' && n.due && !readNotices.includes(n.id))
  const interests = profile?.interests ?? []
  const forYou = upcoming.filter((e) => e.id !== next?.id && (interests.includes(e.category) || followedClubs.includes(e.hostId))).slice(0, 3)
  const dayList = day === null ? thisWeek : upcoming.filter((e) => daysFrom(e.start, now) === day)
  const skills = profile?.skills ?? []
  const hiring = projects.filter((p) => !p.mine && p.openings.length && (!p.closes || p.closes > now))
  // Skill matches first, then interest matches, then whoever closes soonest
  const score = (p: (typeof hiring)[number]) =>
    Math.max(0, ...p.openings.map((o) => skillMatch(skills, o.skills).length)) * 10 + (interests.includes(p.category) ? 1 : 0)
  const teams = [...hiring].sort((a, b) => score(b) - score(a) || +(a.closes ?? 0) - +(b.closes ?? 0)).slice(0, 3)
  const recruiting = clubs.filter((c) => c.recruiting && (!interests.length || interests.includes(c.category))).slice(0, 8)

  return (
    <>
      {guest && (
        <div className="-mx-[clamp(1rem,0.6rem+2vw,2.5rem)] flex flex-wrap items-center justify-between gap-3 border-b border-line bg-slate-2 px-[clamp(1rem,0.6rem+2vw,2.5rem)] py-3 text-sm">
          <p className="text-mute">You’re looking around as a guest. Sign in to register, follow clubs and apply to teams.</p>
          <a href="#/" className="btn btn-sm btn-gold">Sign in</a>
        </div>
      )}

      <PageHeader
        scene="02"
        eyebrow={`${relativeDay(now)} · ${longDate(now)}`}
        title={
          <>
            {greeting(now.getHours())}
            {first ? (
              <>
                , <span className="italic text-gold">{first}.</span>
              </>
            ) : (
              '.'
            )}
          </>
        }
      >
        {due.length > 0 ? (
          <p>
            <Num>{due.length}</Num> thing{due.length > 1 ? 's' : ''} need{due.length > 1 ? '' : 's'} your attention this week, and <Num>{thisWeek.length}</Num> events are on.
          </p>
        ) : (
          <p>Nothing is due. <Num>{thisWeek.length}</Num> events are on this week.</p>
        )}
      </PageHeader>

      {/* Next up + due: the two things a student opens the app for */}
      <div className="grid gap-px border-b border-line bg-line md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {next && (
          <Reveal as="section" className="bg-ink py-7 md:py-10 md:pr-10">
            <p className="eyebrow">{mine[0] ? 'Your next event' : 'Next on campus'}</p>
            <div className="mt-4 flex items-start gap-5">
              <div className="shrink-0 border border-gold px-3 py-2 text-center">
                <Num className="block text-3xl font-semibold text-gold md:text-4xl">{next.start.getDate()}</Num>
                <span className="eyebrow !text-[0.6rem]">{next.start.toLocaleString('en-GB', { month: 'short' })}</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-[clamp(1.6rem,1.2rem+1.6vw,2.6rem)] leading-[1.05]">
                  <button className="hover-gold text-left" onClick={() => openEvent(next.id)}>{next.title}</button>
                </h2>
                <p className="mt-2 text-mute">
                  <Num>{time(next.start)}</Num> · {next.venue} · {next.hostName}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="num border border-line-strong px-2 py-1 text-xs">{next.start <= now ? 'On now' : `Starts ${countdown(next.start, now)}`}</span>
                  {registered.includes(next.id) ? <span className="tag tag-gold">Going</span> : <StatusTag e={next} />}
                </div>
                <div className="mt-5 max-w-xs">
                  <SeatMeter e={next} />
                </div>
              </div>
            </div>
          </Reveal>
        )}

        <Reveal as="section" delay={0.08} className="bg-ink py-7 md:py-10 md:pl-10">
          <p className="eyebrow">Due soon</p>
          {due.length === 0 ? (
            <p className="mt-4 text-mute">You’re clear. New deadlines from the university appear here first.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {due.map((n) => (
                <li key={n.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 py-4">
                  <div className="text-center">
                    <Num className="block text-2xl font-semibold text-gold">{daysFrom(n.due!, now)}</Num>
                    <span className="eyebrow !text-[0.56rem]">days</span>
                  </div>
                  <div className="min-w-0">
                    <a href={href('notices')} className="hover-gold font-bold">{n.title}</a>
                    <p className="mt-0.5 truncate text-sm text-mute">{n.from}</p>
                    <button className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.12em] text-mute uppercase hover-gold" onClick={() => markRead(n.id)}>
                      <Icon name="check" className="h-3.5 w-3.5" /> Mark as done
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </div>

      {/* The week on the Gold Line */}
      <section aria-labelledby="week" className="mt-14">
        <SectionTitle id="week" title="Your week" count={thisWeek.length} action={<a className="hover-gold text-sm text-mute" href={href('events')}>All events →</a>} />
        {q.status === 'loading' && <ListSkeleton rows={3} />}
        {q.status === 'error' && <ErrorState onRetry={q.retry} />}
        {q.status === 'ready' && (
          <>
            <div className="-mx-1 overflow-x-auto px-1 no-scrollbar">
              <div className="min-w-[34rem]">
                <GoldLine events={thisWeek} selectedDay={day} onSelectDay={setDay} onOpen={openEvent} />
              </div>
            </div>
            <div className="mt-4 border-t border-line">
              {dayList.length ? (
                dayList.map((e) => <EventRow key={e.id} e={e} showDay={day === null} />)
              ) : (
                <div className="pt-6">
                  <EmptyState title="A free day" body="Nothing is scheduled. Pick another day on the line, or browse what clubs have coming up." action={<a className="btn" href={href('events')}>Browse events</a>} />
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* For you */}
      <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <section aria-labelledby="for-you">
          <SectionTitle id="for-you" title="Picked for you" />
          {interests.length === 0 && followedClubs.length === 0 ? (
            <EmptyState title="Tell us what you’re into" body="Choose a few interests and this fills with events and teams that match." action={<a className="btn" href={href('profile')}>Choose interests</a>} />
          ) : forYou.length === 0 ? (
            <p className="text-mute">Nothing new in your interests this week. Following more clubs widens this.</p>
          ) : (
            <ol>
              {forYou.map((e, i) => (
                <Reveal as="li" key={e.id} delay={i * 0.06} className="border-b border-line">
                  <button onClick={() => openEvent(e.id)} className="row-hover grid w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-baseline gap-4 py-4 text-left">
                    <Num className="text-sm text-mute">{String(i + 1).padStart(2, '0')}</Num>
                    <span className="min-w-0">
                      <span className="block font-display text-xl leading-snug md:text-2xl">{e.title}</span>
                      <span className="mt-1 block truncate text-sm text-mute">{e.hostName} · {e.category}</span>
                    </span>
                    <span className="text-right text-sm">
                      <span className="block">{relativeDay(e.start, now)}</span>
                      <Num className="text-mute">{time(e.start)}</Num>
                    </span>
                  </button>
                </Reveal>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="teams">
          <SectionTitle id="teams" title="Teams looking for you" action={<a className="hover-gold text-sm text-mute" href={href('projects')}>All →</a>} />
          <ul className="divide-y divide-line">
            {teams.map((p) => (
              <li key={p.id} className="py-4">
                <a href={href(`projects/${p.id}`)} className="group block">
                  <span className="block font-bold group-hover:text-gold">{p.name}</span>
                  <span className="mt-1 block text-sm text-mute">Looking for {p.openings.map((o) => o.role).join(', ').toLowerCase()}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-3 text-xs text-mute">
                    {p.openings.some((o) => skillMatch(skills, o.skills).length > 0) && <span className="tag tag-gold">Matches your skills</span>}
                    <span className="tag">{p.openings[0].commitment}</span>
                    {p.closes && <span>Closes <Num>{relativeDay(p.closes, now)}</Num></span>}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="recruiting" className="mt-16">
        <SectionTitle id="recruiting" title="Clubs recruiting now" count={recruiting.length} action={<a className="hover-gold text-sm text-mute" href={href('clubs')}>All clubs →</a>} />
        <ul className="-mx-[clamp(1rem,0.6rem+2vw,2.5rem)] flex snap-x snap-mandatory gap-px overflow-x-auto px-[clamp(1rem,0.6rem+2vw,2.5rem)] no-scrollbar">
          {recruiting.map((c) => (
            <li key={c.id} className="w-[15rem] shrink-0 snap-start">
              <a href={href(`clubs/${c.id}`)} className="row-hover flex h-full flex-col gap-4 border border-line p-5">
                <Monogram text={c.mono} />
                <span>
                  <span className="block font-display text-xl">{c.name}</span>
                  <span className="mt-1 line-clamp-2 block text-sm text-mute">{c.tagline}</span>
                </span>
                <span className="mt-auto text-xs text-mute">
                  <Num>{c.members}</Num> members · {c.category}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
