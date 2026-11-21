import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { ClubCover } from '../components/ClubCover'
import { EventRow, ShareButton, useOpenEvent } from '../components/EventBits'
import { ContactSheet } from '../components/Frames'
import { LinksFields, linksValid, normaliseLink } from '../components/LinksFields'
import { Dialog, EmptyState, ErrorState, Icon, Monogram, Num, PageHeader, Reveal } from '../components/ui'
import { CATEGORIES, CLUB_SECTIONS, type Ask, type Category, type Club, type ClubPage, type ClubSection, type Links } from '../data/types'
import { useCatalog } from '../lib/catalog'
import { themeStyle } from '../lib/clubThemes'
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

/* ------------------------------------------------------------------ */
/* Browse: a wall of covers, each club in its own look                 */
/* ------------------------------------------------------------------ */

function ClubIndex() {
  const { clubs, events, clubPage } = useCatalog()
  const { followedClubs, joinRequests } = useStore()
  const q = useQuery(clubs)
  const [cat, setCat] = useState<Category | null>(null)
  const [recruiting, setRecruiting] = useState(false)
  const [text, setText] = useState('')

  const upcomingByClub = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of events) counts.set(e.hostId, (counts.get(e.hostId) ?? 0) + 1)
    return counts
  }, [events])

  const list = useMemo(() => {
    const s = text.trim().toLowerCase()
    return [...clubs]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((c) => (!cat || c.category === cat) && (!recruiting || c.recruiting) && (!s || `${c.name} ${c.tagline} ${c.category}`.toLowerCase().includes(s)))
  }, [clubs, cat, recruiting, text])

  const mine = clubs.filter((c) => followedClubs.includes(c.id) || joinRequests[c.id])
  const count = (k: Category) => clubs.filter((c) => c.category === k).length
  const active = !!cat || recruiting || text.trim().length > 0
  const clear = () => {
    setCat(null)
    setRecruiting(false)
    setText('')
  }

  return (
    <div className="pb-16">
      <PageHeader
        scene="04"
        eyebrow="Clubs"
        title={<>Find your <span className="italic text-gold">people.</span></>}
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
        <p>Every approved club, each on a page its own core team designs. Pick an area, open a cover, follow or apply.</p>
      </PageHeader>

      {mine.length > 0 && (
        <section aria-labelledby="your-clubs" className="mt-8">
          <h2 id="your-clubs" className="eyebrow">Your clubs</h2>
          <ul className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
            {mine.map((c) => (
              <li key={c.id} className="shrink-0">
                <a href={href(`clubs/${c.id}`)} className="group flex w-64 items-center gap-3 border border-line p-2 transition-colors hover:border-line-strong">
                  <ClubCover club={c} look={clubPage(c.id).look} size="mini" className="h-14 w-14 shrink-0">
                    <span className="club-display grid h-full place-items-center text-xl text-paper">{c.mono}</span>
                  </ClubCover>
                  <span className="min-w-0">
                    <span className="block truncate group-hover:text-gold">{c.name}</span>
                    <span className="block text-xs text-mute">{joinRequests[c.id] ? 'Request sent' : 'Following'} · <Num>{upcomingByClub.get(c.id) ?? 0}</Num> upcoming</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative w-full md:w-72">
          <span className="sr-only">Search clubs</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute" />
          <input className="field !h-11 !pl-9" type="search" placeholder="Search clubs" value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <button className="chip h-11 shrink-0 self-start md:self-auto" aria-pressed={recruiting} onClick={() => setRecruiting((x) => !x)}>
          <span aria-hidden className="h-2 w-2 bg-teal-bright" /> Recruiting now
        </button>
        {active && <button type="button" onClick={clear} className="hover-gold text-sm text-mute underline underline-offset-4 md:ml-auto">Clear</button>}
      </div>
      <div role="tablist" aria-label="Area" className="no-scrollbar mt-4 flex gap-1 overflow-x-auto border-b border-line">
        {([null, ...CATEGORIES] as (Category | null)[]).map((k) => (
          <button
            key={k ?? 'all'}
            role="tab"
            aria-selected={cat === k}
            onClick={() => setCat(k)}
            className={`relative shrink-0 px-3.5 pt-2 pb-3 text-sm transition-colors ${cat === k ? 'text-paper' : 'text-mute hover-gold'}`}
          >
            {k ?? 'All'} <Num className="ml-1 text-xs text-mute">{k ? count(k) : clubs.length}</Num>
            {cat === k && <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 bg-gold" />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {q.status === 'loading' && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading clubs">
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton aspect-[4/5]" />)}
          </div>
        )}
        {q.status === 'error' && <ErrorState onRetry={q.retry} />}
        {q.status === 'ready' &&
          (list.length === 0 ? (
            <EmptyState title="No clubs match" body="Try another area or clear the search." action={active ? <button className="btn" onClick={clear}>Clear filters</button> : undefined} />
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {list.map((c, i) => (
                <Reveal as="li" key={c.id} delay={Math.min(i, 8) * 0.035}>
                  <ClubTile c={c} page={clubPage(c.id)} upcoming={upcomingByClub.get(c.id) ?? 0} requested={!!joinRequests[c.id]} />
                </Reveal>
              ))}
            </ul>
          ))}
      </div>
    </div>
  )
}

function ClubTile({ c, page, upcoming, requested }: { c: Club; page: ClubPage; upcoming: number; requested: boolean }) {
  const { followedClubs, toggleFollow } = useStore()
  const following = followedClubs.includes(c.id)
  return (
    <div className="group relative">
      <a href={href(`clubs/${c.id}`)} className="block focus-visible:outline-offset-2">
        <ClubCover club={c} look={page.look} className="aspect-[4/5] transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.1,1)] group-hover:-translate-y-1">
          <div className="flex h-full flex-col p-3.5 sm:p-4">
            <div className="flex items-start justify-between gap-2 pr-10">
              <span className="eyebrow !text-[0.55rem] !text-gold">{c.category}</span>
            </div>
            <span aria-hidden className="club-display pointer-events-none absolute -right-2 bottom-[28%] text-[clamp(5rem,3rem+6vw,8rem)] leading-none text-paper/15">{c.mono}</span>
            <div className="mt-auto">
              {(requested || c.recruiting) && (
                <span className={`tag mb-2 ${requested ? 'tag-gold' : 'tag-teal'}`}>{requested ? 'Requested' : 'Recruiting'}</span>
              )}
              <h2 className="club-display text-[clamp(1.3rem,1rem+1vw,1.9rem)] leading-[1.02] text-paper">{c.name}</h2>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-mute sm:text-sm">{page.tagline}</p>
              <p className="mt-3 border-t border-line pt-2.5 text-[0.7rem] text-mute">
                <Num>{c.members + (following ? 1 : 0)}</Num> members · {upcoming ? <><Num>{upcoming}</Num> upcoming</> : 'quiet week'}
              </p>
            </div>
          </div>
        </ClubCover>
      </a>
      <button
        type="button"
        aria-pressed={following}
        aria-label={following ? `Unfollow ${c.name}` : `Follow ${c.name}`}
        onClick={() => toggleFollow(c.id)}
        className="club-theme absolute top-2.5 right-2.5 z-10 grid h-9 w-9 place-items-center border border-line-strong transition-colors hover:border-gold"
        style={themeStyle(page.look)}
      >
        <Icon name={following ? 'check' : 'plus'} className={`h-4 w-4 ${following ? 'text-gold' : ''}`} />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* A club's own page, in its own theme and layout                      */
/* ------------------------------------------------------------------ */

function ClubDetail({ c }: { c: Club }) {
  const cat = useCatalog()
  const page = cat.clubPage(c.id)
  const look = page.look
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
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) setCurrent(hit.target.id.replace('sec-', '') as ClubSection)
      },
      { rootMargin: '-24% 0px -62% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [orderKey, current])

  const step = (s: ClubSection) => Math.max(1, order.indexOf(s) + 1)
  const followBtn = (cls = 'btn') => (
    <button className={cls} aria-pressed={following} onClick={() => toggleFollow(c.id)}>
      <Icon name={following ? 'check' : 'plus'} className="h-4 w-4" /> {following ? 'Following' : 'Follow'}
    </button>
  )

  const join = guest ? (
    <a className="btn btn-gold" href="#/">Sign in to join</a>
  ) : request ? (
    <button className="btn" onClick={() => withdrawJoin(c.id)}>Withdraw request</button>
  ) : page.recruitment.open ? (
    <button className="btn btn-gold" onClick={() => setJoining(true)}>Apply to join</button>
  ) : null

  const actions = (
    <>
      {join}
      {followBtn()}
      {page.contact.website && <a className="btn" href={page.contact.website} target="_blank" rel="noreferrer"><Icon name="globe" className="h-4 w-4" /> Website</a>}
      <ShareButton path={`clubs/${c.id}`} title={c.name} />
      {!guest && (
        <button className="btn btn-sm" onClick={() => { setManaging(c.id); go(`host/${c.id}`) }}>
          <Icon name="settings" className="h-4 w-4" /> Design this page
        </button>
      )}
    </>
  )

  const status = request ? 'Requested' : page.recruitment.open ? 'Recruiting' : 'Not recruiting'
  const stats = (narrow = false) => (
    <dl className={`grid grid-cols-2 gap-px border border-line bg-line ${narrow ? '' : 'sm:grid-cols-4'}`}>
      <Stat label="Members" value={c.members + (following ? 1 : 0)} />
      <Stat label="Upcoming" value={upcoming.length} />
      <Stat label="Founded" value={page.founded} />
      <div className="bg-ink p-3">
        <dt className="eyebrow !text-[0.55rem]">Status</dt>
        <dd className="mt-1.5"><span className={`tag ${request ? 'tag-gold' : page.recruitment.open ? 'tag-teal' : ''}`}>{status}</span></dd>
      </div>
    </dl>
  )

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
          <div className="border border-line-strong bg-slate-2">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-5 py-3.5 md:px-7">
              <p className="eyebrow !text-gold">{request ? 'Request with the core team' : 'Open now'}</p>
              {closes && <p className="text-xs text-mute">Closes <Num>{longDate(closes)}</Num></p>}
            </div>
            <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-7">
              <div>
                <p className="max-w-[56ch] leading-relaxed">
                  {request ? `Sent ${dayMonth(new Date(request.at))} for ${request.role || 'Member'}. They reply on your RVU email within a week.` : page.recruitment.message}
                </p>
                {page.recruitment.roles.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">{page.recruitment.roles.map((r) => <li key={r} className="tag">{r}</li>)}</ul>
                )}
              </div>
              <div className="md:self-end">{join}</div>
            </div>
          </div>
        ) : (
          <div className="border border-line-strong p-5 md:p-7">
            <p className="max-w-[56ch] leading-relaxed text-mute">Not recruiting right now. Follow the club and you’ll hear when it opens.</p>
            <div className="mt-4">{followBtn('btn btn-sm')}</div>
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
            <div className="mt-4">{followBtn('btn btn-sm')}</div>
          </div>
        )}
      </Section>
    ),
    leadership: (
      <Section id="leadership" index={step('leadership')} title="Current leadership" count={page.leadership.length}>
        <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {page.leadership.map((m) => (
            <li key={m.name + m.role} className="flex items-center gap-4 bg-ink p-4">
              <Monogram text={m.name.split(' ').map((w) => w[0]).join('').slice(0, 2)} size="sm" />
              <span className="min-w-0">
                <span className="block truncate">{m.name}</span>
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
          {(
            [
              { icon: 'mail' as const, label: 'Email', value: page.contact.email, link: page.contact.email && `mailto:${page.contact.email}` },
              { icon: 'globe' as const, label: 'Website', value: page.contact.website.replace(/^https?:\/\//, ''), link: page.contact.website },
              { icon: 'image' as const, label: 'Instagram', value: page.contact.instagram, link: page.contact.instagram && `https://instagram.com/${page.contact.instagram.replace('@', '')}` },
              { icon: 'chat' as const, label: 'WhatsApp', value: page.contact.whatsapp ? 'Community group' : '', link: page.contact.whatsapp },
            ] as const
          )
            .filter((item) => item.value)
            .map((item) => <ContactItem key={item.label} {...item} />)}
          {[page.contact.email, page.contact.website, page.contact.instagram, page.contact.whatsapp].filter(Boolean).length % 2 === 1 && <li aria-hidden className="bg-ink" />}
        </ul>
      </Section>
    ),
  }

  const back = (
    <a href={href('clubs')} className="hover-gold inline-flex items-center gap-2 text-sm text-mute">
      <Icon name="arrow-left" className="h-4 w-4" /> All clubs
    </a>
  )
  const slate = <p className="slate-no !text-gold">Sc. 04 · {c.category} · founded <Num>{page.founded}</Num></p>

  const sectionNav = (
    <nav aria-label="On this page" className="sticky top-[var(--head)] z-20 overflow-x-auto border-b border-line bg-ink/95 backdrop-blur no-scrollbar">
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
  )

  const nextUp = (
    <div className="border border-line-strong bg-slate-2 p-5">
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
  )

  let body: ReactNode
  if (look.layout === 'split') {
    body = (
      <div className="grid gap-10 pt-6 pb-14 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-16">
        <aside className="lg:sticky lg:top-[calc(var(--head)+1.5rem)] lg:self-start">
          {back}
          <ClubCover club={c} look={look} className="mt-5 aspect-square" />
          <div className="mt-6">{slate}</div>
          <Reveal>
            <h1 className="club-display mt-3 text-[clamp(2.4rem,1.8rem+2.4vw,3.6rem)] leading-[0.95]">{c.name}</h1>
            <p className="mt-3 leading-relaxed text-mute">{page.tagline}</p>
          </Reveal>
          <div className="mt-6">{stats(true)}</div>
          <div className="mt-5 flex flex-wrap gap-2">{actions}</div>
          <div className="mt-5"><ContactRail contact={page.contact} name={c.name} /></div>
          <div className="mt-5">{nextUp}</div>
        </aside>
        <div className="grid gap-14 md:gap-20 lg:pt-12">{order.map((s) => <div key={s}>{sections[s]}</div>)}</div>
      </div>
    )
  } else if (look.layout === 'poster') {
    body = (
      <>
        <header className="pt-6 pb-8 md:pb-12">
          {back}
          <div className="mt-8">{slate}</div>
          <Reveal>
            <h1 className="club-display mt-3 text-[clamp(3.4rem,1.5rem+9vw,10.5rem)] leading-[0.86] break-words">{c.name}</h1>
          </Reveal>
          <ClubCover club={c} look={look} className="mt-8 min-h-48 md:min-h-60">
            <div className="grid h-full gap-6 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-8">
              <p className="max-w-[44ch] text-lg leading-relaxed md:text-xl">{page.tagline}</p>
              <div className="flex flex-wrap gap-2">{actions}</div>
            </div>
          </ClubCover>
          <div className="mt-px">{stats()}</div>
        </header>
        {sectionNav}
        <div className="grid gap-4 py-10 md:py-14 lg:grid-flow-row-dense lg:grid-cols-2">
          {order.map((s) => (
            <div key={s} className={`border border-line bg-slate-2 p-5 md:p-8 ${s === 'about' || s === 'archive' || s === 'upcoming' ? 'lg:col-span-2' : ''}`}>{sections[s]}</div>
          ))}
        </div>
      </>
    )
  } else {
    body = (
      <>
        <header className="pt-6 pb-8 md:pb-12">
          {back}
          <ClubCover club={c} look={look} size="hero" className="mt-5 min-h-[22rem] md:aspect-[21/8] md:min-h-0">
            <div className="flex h-full flex-col justify-end p-5 md:p-10">
              <span aria-hidden className="club-display pointer-events-none absolute top-4 right-6 text-[clamp(6rem,3rem+12vw,15rem)] leading-none text-paper/10">{c.mono}</span>
              {slate}
              <Reveal>
                <h1 className="club-display mt-3 text-[clamp(2.7rem,1.8rem+4.4vw,5.8rem)] leading-[0.92]">{c.name}</h1>
                <p className="mt-3 max-w-[48ch] text-lg leading-relaxed text-mute">{page.tagline}</p>
              </Reveal>
            </div>
          </ClubCover>
          <div className="mt-px">{stats()}</div>
          <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">{actions}</div>
        </header>
        {sectionNav}
        <div className="grid gap-12 py-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
          <div className="grid gap-14 md:gap-20">{order.map((s) => <div key={s}>{sections[s]}</div>)}</div>
          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--head)+4.5rem)] grid gap-4">
              {nextUp}
              <div className="border border-line-strong bg-slate-2 p-5">
                <p className="eyebrow">Ways in</p>
                <div className="mt-3"><ContactRail contact={page.contact} name={c.name} /></div>
              </div>
            </div>
          </aside>
        </div>
      </>
    )
  }

  return (
    <div className="club-theme club-bleed" data-type={look.type} data-layout={look.layout} style={themeStyle(look)}>
      {body}
      {!guest && <JoinDialog c={c} page={page} open={joining} onClose={() => setJoining(false)} />}
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
    <section id={`sec-${id}`} aria-labelledby={`h-${id}`} className="scroll-mt-[calc(var(--head)+4.5rem)]">
      <div className="mb-5 grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-line pb-3">
        <Num className="text-[0.68rem] font-bold tracking-[0.16em] text-gold">{String(index).padStart(2, '0')}</Num>
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
