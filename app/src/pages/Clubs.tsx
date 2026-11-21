import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { EventRow, ShareButton, useOpenEvent } from '../components/EventBits'
import { ContactSheet } from '../components/Frames'
import { LinksFields, linksValid, normaliseLink } from '../components/LinksFields'
import { Dialog, EmptyState, ErrorState, Icon, Monogram, Num, PageHeader, Reveal } from '../components/ui'
import { CATEGORIES, CLUB_SECTIONS, type Ask, type Category, type Club, type ClubPage, type ClubSection, type Links } from '../data/types'
import { useCatalog } from '../lib/catalog'
import { dayMonth, longDate } from '../lib/format'
import { go, href } from '../lib/router'
import { useQuery, useStore } from '../lib/store'

export default function Clubs({ id }: { id?: string }) {
  const { clubById } = useCatalog()
  const club = id ? clubById(id) : undefined
  if (id && !club)
    return (
      <div className="py-16">
        <EmptyState title="We couldn’t find that club" body="It may have been renamed. The directory lists every approved club." action={<a className="btn" href={href('clubs')}>All clubs</a>} />
      </div>
    )
  return club ? <ClubDetail c={club} /> : <ClubIndex />
}

/** Sc. 04: a register of dossiers, alphabetical, each one drawn rather than photographed. */
function ClubIndex() {
  const { clubs, events, clubPage } = useCatalog()
  const { followedClubs, joinRequests } = useStore()
  const q = useQuery(clubs)
  const [cat, setCat] = useState<Category | null>(null)
  const [recruiting, setRecruiting] = useState(false)
  const [mine, setMine] = useState(false)
  const [text, setText] = useState('')

  const order = useMemo(() => {
    const sorted = [...clubs].sort((a, b) => a.name.localeCompare(b.name))
    return new Map(sorted.map((c, i) => [c.id, i + 1]))
  }, [clubs])

  const upcomingByClub = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of events) counts.set(e.hostId, (counts.get(e.hostId) ?? 0) + 1)
    return counts
  }, [events])

  const list = useMemo(() => {
    const s = text.trim().toLowerCase()
    return [...clubs]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((c) => (!cat || c.category === cat) && (!recruiting || c.recruiting) && (!mine || followedClubs.includes(c.id)) && (!s || `${c.name} ${c.tagline} ${c.category}`.toLowerCase().includes(s)))
  }, [clubs, cat, recruiting, mine, text, followedClubs])

  const active = !!cat || recruiting || mine || text.trim().length > 0
  const clear = () => {
    setCat(null)
    setRecruiting(false)
    setMine(false)
    setText('')
  }

  return (
    <>
      <PageHeader
        scene="04"
        eyebrow="Clubs"
        title={<>Every club,<br /><span className="italic text-gold">on the record.</span></>}
        aside={
          <div className="grid grid-cols-2 gap-5 border-line-strong sm:border-l sm:pl-6">
            <div>
              <p className="eyebrow">Approved</p>
              <Num className="mt-1 block text-3xl">{clubs.length}</Num>
            </div>
            <div>
              <p className="eyebrow">Recruiting</p>
              <Num className="mt-1 block text-3xl text-gold">{clubs.filter((c) => c.recruiting).length}</Num>
            </div>
          </div>
        }
      >
        <p>Every approved club keeps a dossier here: what it does, who runs it, what’s on, and how to ask to join. No Instagram or WhatsApp hunting.</p>
      </PageHeader>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative w-full lg:w-72">
          <span className="sr-only">Search clubs</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute" />
          <input className="field !h-10 !pl-9" type="search" placeholder="Search clubs" value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <div role="group" aria-label="Filter clubs" className="flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          <button className="chip shrink-0" aria-pressed={recruiting} onClick={() => setRecruiting((x) => !x)}>Recruiting</button>
          <button className="chip shrink-0" aria-pressed={mine} onClick={() => setMine((x) => !x)}>Following</button>
          <span className="w-px shrink-0 bg-line" aria-hidden />
          {CATEGORIES.map((c) => (
            <button key={c} className="chip shrink-0" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-3">
        <p className="eyebrow">The register</p>
        <p className="text-sm text-mute">
          <Num>{list.length}</Num> of <Num>{clubs.length}</Num> clubs
          {active && (
            <button type="button" onClick={clear} className="ml-3 text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold">
              Clear
            </button>
          )}
        </p>
      </div>

      <div className="mt-4">
        {q.status === 'loading' && <ClubIndexSkeleton />}
        {q.status === 'error' && <ErrorState onRetry={q.retry} />}
        {q.status === 'ready' &&
          (list.length === 0 ? (
            <EmptyState
              title="No clubs match"
              body={mine ? 'You aren’t following any clubs yet.' : 'Try another category or clear the search.'}
              action={active ? <button className="btn" onClick={clear}>Clear filters</button> : undefined}
            />
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {list.map((c) => (
                <ClubCard
                  key={c.id}
                  c={c}
                  page={clubPage(c.id)}
                  index={order.get(c.id) ?? 1}
                  upcoming={upcomingByClub.get(c.id) ?? 0}
                  followed={followedClubs.includes(c.id)}
                  requested={!!joinRequests[c.id]}
                />
              ))}
            </ul>
          ))}
      </div>
    </>
  )
}

function ClubCard({ c, page, index, upcoming, followed, requested }: { c: Club; page: ClubPage; index: number; upcoming: number; followed: boolean; requested: boolean }) {
  const status = requested ? 'Requested' : c.recruiting ? 'Recruiting' : followed ? 'Following' : null
  const statusClass = requested ? 'tag-gold' : c.recruiting ? 'tag-teal' : ''

  return (
    <li className="group relative">
      <a
        href={href(`clubs/${c.id}`)}
        className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold"
        aria-label={`Open the ${c.name} dossier`}
      />
      <div className="grid h-full overflow-hidden border border-line bg-slate-2/30 transition-colors group-hover:border-line-strong group-hover:bg-slate-2/60 sm:grid-cols-[8rem_minmax(0,1fr)] lg:grid-cols-[9rem_minmax(0,1fr)]">
        <ClubPlate c={c} page={page} className="aspect-[16/6] sm:aspect-auto sm:h-full" />
        <div className="flex min-w-0 flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="slate-no">Dossier <Num>{String(index).padStart(2, '0')}</Num></p>
              <h2 className="mt-1.5 font-display text-[clamp(1.35rem,1.15rem+0.7vw,1.85rem)] leading-[1.05] group-hover:text-gold">{c.name}</h2>
            </div>
            {status && <span className={`tag shrink-0 ${statusClass}`}>{status}</span>}
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-mute">{c.tagline}</p>
          <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
            <p className="text-xs text-mute">
              <Num>{c.members}</Num> members<span aria-hidden className="mx-1.5 text-line-strong">·</span>
              {upcoming > 0 ? <><Num>{upcoming}</Num> upcoming</> : 'Nothing scheduled'}
            </p>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[0.64rem] font-bold tracking-[0.16em] uppercase text-gold">
              Dossier <Icon name="arrow" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    </li>
  )
}

function ClubIndexSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-busy="true" aria-label="Loading clubs">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="grid border border-line sm:grid-cols-[8rem_minmax(0,1fr)] lg:grid-cols-[9rem_minmax(0,1fr)]">
          <div className="skeleton aspect-[16/6] sm:aspect-auto sm:min-h-44" />
          <div className="grid content-start gap-3 p-5">
            <div className="skeleton h-2.5 w-20" />
            <div className="skeleton h-6 w-40" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-2/3" />
            <div className="skeleton mt-4 h-2.5 w-28" />
          </div>
        </div>
      ))}
    </div>
  )
}

const TONE: Record<ClubPage['tone'], string> = {
  gold: 'from-gold/25 via-gold/5',
  teal: 'from-teal/70 via-teal/15',
  slate: 'from-slate via-slate/30',
}

/** A club’s own dossier. The core team decides which sections show and in what order. */
function ClubDetail({ c }: { c: Club }) {
  const cat = useCatalog()
  const page = cat.clubPage(c.id)
  const { profile, followedClubs, toggleFollow, joinRequests, withdrawJoin, setManaging } = useStore()
  const following = followedClubs.includes(c.id)
  const request = joinRequests[c.id]
  const [joining, setJoining] = useState(false)
  const guest = !profile?.email
  const upcoming = cat.events.filter((e) => e.hostId === c.id)
  const past = cat.pastEvents.filter((e) => e.hostId === c.id)
  const closes = page.recruitment.closes ? new Date(page.recruitment.closes) : undefined
  const order = page.sections.filter((s) => !page.hidden.includes(s))
  const orderKey = order.join('|')
  const [current, setCurrent] = useState<ClubSection>(order[0] ?? 'about')
  const openEvent = useOpenEvent()

  useEffect(() => {
    const ids = orderKey ? orderKey.split('|') : []
    if (!ids.includes(current)) setCurrent((ids[0] as ClubSection) ?? 'about')
    const els = ids.map((s) => document.getElementById(`sec-${s}`)).filter((el): el is HTMLElement => !!el)
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) setCurrent(hit.target.id.replace('sec-', '') as ClubSection)
      },
      { rootMargin: '-24% 0px -62% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [orderKey, current])

  const step = (s: ClubSection) => Math.max(1, order.indexOf(s) + 1)

  const join = guest ? (
    <a className="btn btn-gold" href="#/">Sign in to join</a>
  ) : request ? (
    <button className="btn" onClick={() => withdrawJoin(c.id)}>Withdraw request</button>
  ) : page.recruitment.open ? (
    <button className="btn btn-gold" onClick={() => setJoining(true)}>Apply to join</button>
  ) : null

  const sections: Record<ClubSection, ReactNode> = {
    about: (
      <Section id="about" index={step('about')} title="About and objectives">
        <p className="max-w-[62ch] text-lg leading-relaxed">{page.about}</p>
        {page.objectives.length > 0 && (
          <ol className="mt-7 border-t border-line">
            {page.objectives.map((o, i) => (
              <li key={i} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-3 border-b border-line py-3.5">
                <Num className="text-sm text-gold">{String(i + 1).padStart(2, '0')}</Num>
                <span className="max-w-[62ch]">{o}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>
    ),
    recruitment: (
      <Section id="recruitment" index={step('recruitment')} title="Recruitment">
        {page.recruitment.open ? (
          <div className="border border-line-strong bg-slate-2/40">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-5 py-3.5 md:px-7">
              <p className="eyebrow !text-gold">{request ? 'Request with the core team' : 'Open now'}</p>
              {closes && <p className="text-xs text-mute">Closes <Num>{longDate(closes)}</Num></p>}
            </div>
            <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-7">
              <div>
                <p className="max-w-[56ch] leading-relaxed">
                  {request
                    ? `Sent ${dayMonth(new Date(request.at))} for ${request.role || 'Member'}. They reply on your RVU email within a week.`
                    : page.recruitment.message}
                </p>
                {page.recruitment.roles.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {page.recruitment.roles.map((r) => <li key={r} className="tag">{r}</li>)}
                  </ul>
                )}
              </div>
              <div className="md:self-end">{join}</div>
            </div>
          </div>
        ) : (
          <div className="border border-line-strong p-5 md:p-7">
            <p className="max-w-[56ch] leading-relaxed text-mute">Not recruiting right now. Follow the club and you’ll hear when it opens.</p>
            <button className="btn btn-sm mt-4" aria-pressed={following} onClick={() => toggleFollow(c.id)}>
              <Icon name={following ? 'check' : 'plus'} className="h-4 w-4" /> {following ? 'Following' : 'Follow'}
            </button>
          </div>
        )}
      </Section>
    ),
    upcoming: (
      <Section id="upcoming" index={step('upcoming')} title="Upcoming events" count={upcoming.length}>
        {upcoming.length ? (
          <div className="border-t border-line">{upcoming.map((e) => <EventRow key={e.id} e={e} />)}</div>
        ) : (
          <div className="border border-dashed border-line-strong p-5 md:p-7">
            <p className="max-w-[48ch] text-mute">Nothing scheduled yet. Follow the club and its next event will reach you first.</p>
            <button className="btn btn-sm mt-4" aria-pressed={following} onClick={() => toggleFollow(c.id)}>
              <Icon name={following ? 'check' : 'plus'} className="h-4 w-4" /> {following ? 'Following' : 'Follow'}
            </button>
          </div>
        )}
      </Section>
    ),
    leadership: (
      <Section id="leadership" index={step('leadership')} title="Current leadership" count={page.leadership.length}>
        <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
          {page.leadership.map((m) => (
            <li key={m.name + m.role} className="flex items-center gap-4 bg-ink p-4 transition-colors hover:bg-slate-2/60">
              <Monogram text={m.name.split(' ').map((w) => w[0]).join('').slice(0, 2)} size="sm" />
              <span className="min-w-0">
                {m.studentId ? <a className="hover-gold block truncate" href={href(`people/${m.studentId}`)}>{m.name}</a> : <span className="block truncate">{m.name}</span>}
                <span className="block text-sm text-mute">{m.role}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>
    ),
    archive: (
      <Section id="archive" index={step('archive')} title="Previous activities" count={past.length}>
        {past.length === 0 ? (
          <p className="text-mute">The archive starts with the club’s first event on RVU Connect.</p>
        ) : (
          <ul className="grid gap-10">
            {past.map((e) => (
              <li key={e.id} className="grid gap-5 border-t border-line pt-6 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-8">
                <div>
                  <p className="eyebrow"><Num>{longDate(e.start)}</Num></p>
                  <h3 className="mt-2 text-2xl leading-tight">{e.title}</h3>
                  {e.recap && <p className="mt-2 text-sm leading-relaxed text-mute">{e.recap}</p>}
                </div>
                <ContactSheet photos={e.photos ?? []} compact />
              </li>
            ))}
          </ul>
        )}
      </Section>
    ),
    contact: (
      <Section id="contact" index={step('contact')} title="Contact">
        <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {([
            { icon: 'mail' as const, label: 'Email', value: page.contact.email, link: page.contact.email && `mailto:${page.contact.email}` },
            { icon: 'globe' as const, label: 'Website', value: page.contact.website.replace(/^https?:\/\//, ''), link: page.contact.website },
            { icon: 'image' as const, label: 'Instagram', value: page.contact.instagram, link: page.contact.instagram && `https://instagram.com/${page.contact.instagram.replace('@', '')}` },
            { icon: 'chat' as const, label: 'WhatsApp', value: page.contact.whatsapp ? 'Community group' : '', link: page.contact.whatsapp },
          ] as const)
            .filter((item) => item.value)
            .map((item) => <ContactItem key={item.label} {...item} />)}
          {[page.contact.email, page.contact.website.replace(/^https?:\/\//, ''), page.contact.instagram, page.contact.whatsapp].filter(Boolean).length % 2 === 1 && <li aria-hidden className="bg-ink" />}
        </ul>
      </Section>
    ),
  }

  return (
    <>
      <header className="relative -mx-4 overflow-hidden border-b border-line-strong px-4 pt-6 pb-8 md:-mx-8 md:px-8 md:pt-10 md:pb-12">
        <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${TONE[page.tone]} to-transparent opacity-70`} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-gold/70 via-gold/20 to-transparent" />
        <div className="relative">
          <a href={href('clubs')} className="hover-gold inline-flex items-center gap-2 text-sm text-mute">
            <Icon name="arrow-left" className="h-4 w-4" /> All clubs
          </a>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div>
              <p className="slate-no">Sc. 04 · {c.category} · founded <Num>{page.founded}</Num></p>
              <Reveal>
                <h1 className="mt-3 text-[clamp(2.7rem,2rem+4vw,5.2rem)] leading-[0.94]">{c.name}</h1>
                <p className="mt-4 max-w-[48ch] text-lg leading-relaxed text-mute">{page.tagline}</p>
              </Reveal>

              <dl className="mt-7 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
                <Stat label="Members" value={c.members + (following ? 1 : 0)} />
                <Stat label="Upcoming" value={upcoming.length} />
                <Stat label="Founded" value={page.founded} />
                <div className="bg-ink/80 p-3">
                  <dt className="eyebrow !text-[0.55rem]">Status</dt>
                  <dd className="mt-1.5">
                    <span className={`tag ${request ? 'tag-gold' : page.recruitment.open ? 'tag-teal' : ''}`}>
                      {request ? 'Requested' : page.recruitment.open ? 'Recruiting' : 'Not recruiting'}
                    </span>
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
                {join}
                <button className="btn" aria-pressed={following} onClick={() => toggleFollow(c.id)}>
                  <Icon name={following ? 'check' : 'plus'} className="h-4 w-4" /> {following ? 'Following' : 'Follow'}
                </button>
                {page.contact.website && (
                  <a className="btn" href={page.contact.website} target="_blank" rel="noreferrer"><Icon name="globe" className="h-4 w-4" /> Website</a>
                )}
                <ShareButton path={`clubs/${c.id}`} title={c.name} />
                {!guest && (
                  <button className="btn btn-sm sm:ml-auto" onClick={() => { setManaging(c.id); go(`host/${c.id}`) }}>
                    <Icon name="settings" className="h-4 w-4" /> Manage page
                  </button>
                )}
              </div>
            </div>

            <div className="lg:pt-1">
              <div className="group relative">
                <ClubPlate c={c} page={page} variant="cover" className="aspect-[16/7] sm:aspect-[16/6] lg:aspect-[4/5]" />
                <div aria-hidden className="pointer-events-none absolute inset-0 flex items-end bg-ink/85 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                  <p className="text-sm leading-relaxed text-paper">{page.about.split('. ')[0]}.</p>
                </div>
              </div>
              <ContactRail contact={page.contact} name={c.name} />
            </div>
          </div>
        </div>
      </header>

      <nav aria-label="On this page" className="sticky top-16 z-20 -mx-4 overflow-x-auto border-b border-line bg-ink/90 px-4 backdrop-blur no-scrollbar md:top-20 md:-mx-8 md:px-8">
        <ul className="flex gap-5 whitespace-nowrap py-3 text-sm md:gap-7">
          {order.map((s) => (
            <li key={s}>
              <a
                href={`#/clubs/${c.id}`}
                aria-current={current === s ? 'location' : undefined}
                className={`hover-gold inline-flex items-center gap-2 ${current === s ? 'text-gold' : 'text-mute'}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(`sec-${s}`)?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <Num className="text-[0.6rem] opacity-60">{String(step(s)).padStart(2, '0')}</Num>
                {CLUB_SECTIONS.find((x) => x.id === s)!.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-12 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
        <div className="grid gap-14 md:gap-20">{order.map((s) => <div key={s}>{sections[s]}</div>)}</div>

        <aside className="hidden lg:block">
          <div className="sticky top-32 grid gap-4">
            <div className="border border-line-strong bg-slate-2/40 p-5">
              <p className="eyebrow">Next up</p>
              {upcoming[0] ? (
                <button onClick={() => openEvent(upcoming[0].id)} className="mt-3 block w-full text-left">
                  <span className="block font-display text-xl leading-tight hover:text-gold">{upcoming[0].title}</span>
                  <span className="mt-1 block text-xs text-mute"><Num>{longDate(upcoming[0].start)}</Num> · {upcoming[0].venue}</span>
                </button>
              ) : (
                <p className="mt-2 text-sm text-mute">Nothing scheduled.</p>
              )}
            </div>

            <div className="border border-line-strong bg-slate-2/40 p-5">
              <p className="eyebrow">Ways in</p>
              <ContactRail contact={page.contact} name={c.name} />
              {page.contact.email && <p className="mt-3 truncate text-xs text-mute">{page.contact.email}</p>}
            </div>

            <div className="border border-line-strong bg-slate-2/40 p-5">
              <p className="eyebrow">Keep close</p>
              <p className="mt-2 text-sm leading-relaxed text-mute">Follow the club and its next event, recruitment window and archive land here first.</p>
              <button className="btn btn-sm mt-4 w-full" aria-pressed={following} onClick={() => toggleFollow(c.id)}>
                <Icon name={following ? 'check' : 'plus'} className="h-4 w-4" /> {following ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {!guest && <JoinDialog c={c} page={page} open={joining} onClose={() => setJoining(false)} />}
    </>
  )
}

/** The drawn portrait: a monogram on a stage, inside a hairline frame. */
function ClubPlate({ c, page, variant = 'card', className = '' }: { c: Club; page: ClubPage; variant?: 'card' | 'cover'; className?: string }) {
  const cover = variant === 'cover'
  return (
    <div aria-hidden data-tone={page.tone} className={`club-plate stage-dark ${className}`}>
      <span className="club-plate__rule" />
      <div className="flex h-full flex-col justify-between p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="eyebrow !text-[0.55rem] !tracking-[0.2em]">Sc. 04</span>
          <span className="num text-[0.6rem] text-gold">{page.founded}</span>
        </div>
        <span className={`club-plate__mono self-center text-center ${cover ? 'text-[clamp(4rem,9vw,8rem)]' : 'text-[clamp(2.4rem,5vw,4rem)]'}`}>{c.mono}</span>
        <div className="flex items-end justify-between gap-2">
          <span className="text-[0.52rem] font-bold tracking-[0.14em] whitespace-nowrap uppercase text-paper/70">{c.category}</span>
          <span className="num text-[0.6rem] text-paper/60">{c.members}</span>
        </div>
      </div>
    </div>
  )
}

/** The example’s icon rail, squared off and wired to the club’s real contact fields. */
function ContactRail({ contact, name }: { contact: ClubPage['contact']; name: string }) {
  const items = [
    contact.email ? { icon: 'mail' as const, label: `Email ${name}`, href: `mailto:${contact.email}` } : null,
    contact.website ? { icon: 'globe' as const, label: `${name} website`, href: contact.website } : null,
    contact.instagram ? { icon: 'image' as const, label: `${name} on Instagram`, href: `https://instagram.com/${contact.instagram.replace('@', '')}` } : null,
    contact.whatsapp ? { icon: 'chat' as const, label: `${name} WhatsApp group`, href: contact.whatsapp } : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null)

  if (!items.length) return null
  return (
    <ul className="contact-rail" aria-label={`Ways to reach ${name}`} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it) => (
        <li key={it.label}>
          <a
            href={it.href}
            target={it.href.startsWith('http') ? '_blank' : undefined}
            rel={it.href.startsWith('http') ? 'noreferrer' : undefined}
            aria-label={it.label}
            title={it.label}
          >
            <Icon name={it.icon} className="h-[18px] w-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-ink/80 p-3">
      <dt className="eyebrow !text-[0.55rem]">{label}</dt>
      <dd className="mt-1"><Num className="text-2xl">{value}</Num></dd>
    </div>
  )
}

function Section({ id, index, title, count, children }: { id: ClubSection; index: number; title: string; count?: number; children: ReactNode }) {
  return (
    <section id={`sec-${id}`} aria-labelledby={`h-${id}`} className="scroll-mt-32">
      <div className="mb-5 grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-line pb-3">
        <Num className="text-[0.68rem] font-semibold tracking-[0.16em] text-gold">{String(index).padStart(2, '0')}</Num>
        <h2 id={`h-${id}`} className="text-[clamp(1.6rem,1.3rem+1vw,2.2rem)] leading-tight">{title}</h2>
        {count !== undefined && <Num className="text-sm text-mute">{count}</Num>}
      </div>
      {children}
    </section>
  )
}

function ContactItem({ icon, label, value, link }: { icon: 'mail' | 'globe' | 'image' | 'chat'; label: string; value: string; link?: string }) {
  if (!value) return null
  return (
    <li className="bg-ink">
      <a href={link || undefined} target={link?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="row-hover flex items-center gap-4 p-4">
        <Icon name={icon} className="h-5 w-5 text-gold" />
        <span className="min-w-0">
          <span className="eyebrow block !text-[0.58rem]">{label}</span>
          <span className="block truncate">{value}</span>
        </span>
      </a>
    </li>
  )
}

const KEY: Record<Ask, keyof Links> = { GitHub: 'github', LinkedIn: 'linkedin', Portfolio: 'portfolio' }

/** The club’s own application form: role, the core team’s questions, and the links it asks for. */
function JoinDialog({ c, page, open, onClose }: { c: Club; page: ClubPage; open: boolean; onClose: () => void }) {
  const titleId = useId()
  const { profile, setLinks, requestJoin } = useStore()
  const [links, setL] = useState<Links>(profile?.links ?? { github: '', linkedin: '', portfolio: '' })
  const [role, setRole] = useState(page.recruitment.roles[0] ?? '')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  if (!profile) return null

  const send = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity() || !linksValid(links)) return
    setLinks({ github: normaliseLink(links.github), linkedin: normaliseLink(links.linkedin), portfolio: normaliseLink(links.portfolio) })
    requestJoin(c.id, role, answers)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId}>
      <form onSubmit={send} className="border border-line-strong bg-slate-2">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 md:px-7">
          <div>
            <p className="slate-no">Application</p>
            <h2 id={titleId} className="mt-1 text-2xl">Join {c.name}</h2>
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="max-h-[62dvh] overflow-y-auto overscroll-contain px-5 py-5 md:px-7">
          <p className="eyebrow">From your profile</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-mute">Name</dt><dd>{profile.name}</dd>
            <dt className="text-mute">Email</dt><dd className="truncate">{profile.email}</dd>
            <dt className="text-mute">Year</dt><dd><Num>Year {profile.year}</Num>, {profile.school.replace('School of ', '')}</dd>
          </dl>

          {page.recruitment.roles.length > 1 && (
            <fieldset className="mt-6 border-t border-line pt-5">
              <legend className="eyebrow pt-5">Role</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {page.recruitment.roles.map((r) => <button type="button" key={r} className="chip" aria-pressed={role === r} onClick={() => setRole(r)}>{r}</button>)}
              </div>
            </fieldset>
          )}

          {page.questions.map((q) => {
            const qid = `${titleId}-${q.id}`
            return (
              <div key={q.id} className="field-wrap mt-6 border-t border-line pt-5">
                <label htmlFor={qid} className="block">{q.label}{q.required ? '' : <span className="text-mute"> (optional)</span>}</label>
                {q.kind === 'choice' ? (
                  <select id={qid} className="field mt-2" required={q.required} value={answers[q.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}>
                    <option value="" disabled>Choose one</option>
                    {q.options?.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : q.kind === 'long' ? (
                  <textarea id={qid} className="field mt-2 min-h-24" required={q.required} minLength={q.required ? 10 : undefined} maxLength={500} value={answers[q.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                ) : (
                  <input id={qid} className="field mt-2" required={q.required} maxLength={120} value={answers[q.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                )}
                <p className="field-error mt-1 text-sm"><span className="font-bold">Error:</span> {q.kind === 'long' ? 'Write at least 10 characters.' : 'This needs an answer.'}</p>
              </div>
            )
          })}

          {page.asks.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <p className="eyebrow">{c.name} asks for</p>
              <p className="mt-1 mb-4 text-sm text-mute">Filled from your profile. Changes here are saved there too.</p>
              <LinksFields value={links} onChange={setL} only={page.asks.map((a) => KEY[a])} />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3 border-t border-line px-5 py-4 md:px-7">
          <button type="submit" className="btn btn-gold">Send application</button>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Dialog>
  )
}
