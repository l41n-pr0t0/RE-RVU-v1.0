import { useId, useMemo, useState } from 'react'
import { EventRow } from '../components/EventBits'
import { LinksFields, linksValid, normaliseLink } from '../components/LinksFields'
import { Dialog, EmptyState, ErrorState, Icon, ListSkeleton, Monogram, Num, PageHeader, Reveal, SectionTitle } from '../components/ui'
import { asksFor, clubById, clubs, events, pastEvents } from '../data/mock'
import { CATEGORIES, type Ask, type Category, type Club, type Links } from '../data/types'
import { longDate } from '../lib/format'
import { href } from '../lib/router'
import { useQuery, useStore } from '../lib/store'

export default function Clubs({ id }: { id?: string }) {
  const club = id ? clubById(id) : undefined
  if (id && !club)
    return (
      <div className="py-16">
        <EmptyState title="We couldn’t find that club" body="It may have been renamed. The directory lists every approved club." action={<a className="btn" href={href('clubs')}>All clubs</a>} />
      </div>
    )
  return club ? <ClubDetail c={club} /> : <ClubIndex />
}

/** Sc. 04: an index, alphabetical, like the back of a programme. */
function ClubIndex() {
  const { followedClubs } = useStore()
  const q = useQuery(clubs)
  const [cat, setCat] = useState<Category | null>(null)
  const [recruiting, setRecruiting] = useState(false)
  const [mine, setMine] = useState(false)
  const [text, setText] = useState('')

  const list = useMemo(() => {
    const s = text.trim().toLowerCase()
    return [...clubs]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((c) => (!cat || c.category === cat) && (!recruiting || c.recruiting) && (!mine || followedClubs.includes(c.id)) && (!s || `${c.name} ${c.tagline}`.toLowerCase().includes(s)))
  }, [cat, recruiting, mine, text, followedClubs])

  return (
    <>
      <PageHeader scene="04" eyebrow="Clubs" title="Every club, one index" aside={<p className="text-sm text-mute"><Num>{clubs.length}</Num> approved · <Num>{clubs.filter((c) => c.recruiting).length}</Num> recruiting</p>}>
        <p>Follow a club to see its events first. Recruiting clubs take join requests here, with your links attached.</p>
      </PageHeader>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative md:w-72">
          <span className="sr-only">Search clubs</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute" />
          <input className="field !h-10 !pl-9" type="search" placeholder="Search clubs" value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button className="chip shrink-0" aria-pressed={recruiting} onClick={() => setRecruiting((x) => !x)}>Recruiting</button>
          <button className="chip shrink-0" aria-pressed={mine} onClick={() => setMine((x) => !x)}>Following</button>
          <span className="w-px shrink-0 bg-line" aria-hidden />
          {CATEGORIES.map((c) => (
            <button key={c} className="chip shrink-0" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {q.status === 'loading' && <ListSkeleton rows={6} />}
        {q.status === 'error' && <ErrorState onRetry={q.retry} />}
        {q.status === 'ready' &&
          (list.length === 0 ? (
            <EmptyState title="No clubs match" body={mine ? 'You aren’t following any clubs yet.' : 'Try another category or clear the search.'} />
          ) : (
            <ul className="grid border-t border-line md:grid-cols-2 md:gap-x-10">
              {list.map((c) => (
                <li key={c.id} className="border-b border-line">
                  <a href={href(`clubs/${c.id}`)} className="row-hover group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-4">
                    <Monogram text={c.mono} gold={followedClubs.includes(c.id)} />
                    <span className="min-w-0">
                      <span className="block font-display text-xl leading-tight group-hover:text-gold">{c.name}</span>
                      <span className="mt-0.5 block truncate text-sm text-mute">{c.tagline}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1.5 text-xs text-mute">
                      {c.recruiting ? <span className="tag tag-teal">Recruiting</span> : <span className="tag">{c.category}</span>}
                      <span><Num>{c.members}</Num> members</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </>
  )
}

function ClubDetail({ c }: { c: Club }) {
  const { followedClubs, toggleFollow, joinRequests, profile } = useStore()
  const [asking, setAsking] = useState(false)
  const following = followedClubs.includes(c.id)
  const requested = joinRequests[c.id]
  const guest = !profile?.email
  const now = new Date()
  const upcoming = events.filter((e) => e.hostId === c.id && e.end > now)
  const past = pastEvents.filter((e) => e.hostId === c.id)

  return (
    <>
      <a href={href('clubs')} className="hover-gold mt-6 inline-flex items-center gap-2 text-sm text-mute">
        <Icon name="arrow-left" className="h-4 w-4" /> All clubs
      </a>
      <header className="grid gap-6 border-b border-line pt-6 pb-8 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-end md:pb-10">
        <Reveal><Monogram text={c.mono} size="lg" gold /></Reveal>
        <Reveal delay={0.05} className="min-w-0">
          <p className="flex items-center gap-3">
            <span className="slate-no">Sc. 04</span>
            <span className="h-px w-8 bg-line-strong" aria-hidden />
            <span className="eyebrow">{c.category}</span>
          </p>
          <h1 className="mt-3 text-[clamp(2.3rem,1.7rem+2.8vw,4.6rem)] leading-[1]">{c.name}</h1>
          <p className="mt-3 max-w-[52ch] text-lg text-mute">{c.tagline}</p>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-wrap gap-3">
          {guest ? (
            <a className="btn btn-gold" href="#/">Sign in to follow</a>
          ) : (
            <>
              <button className={`btn ${following ? '' : 'btn-gold'}`} aria-pressed={following} onClick={() => toggleFollow(c.id)}>
                {following ? <><Icon name="check" className="h-4 w-4" /> Following</> : <><Icon name="plus" className="h-4 w-4" /> Follow</>}
              </button>
              {c.recruiting &&
                (requested ? (
                  <span className="btn pointer-events-none">Request sent</span>
                ) : (
                  <button className="btn" onClick={() => setAsking(true)}>Request to join</button>
                ))}
            </>
          )}
        </Reveal>
      </header>

      <dl className="grid grid-cols-3 border-b border-line">
        <div className="py-4"><dt className="eyebrow !text-[0.6rem]">Members</dt><dd className="num mt-1 text-2xl">{c.members}</dd></div>
        <div className="border-l border-line py-4 pl-4"><dt className="eyebrow !text-[0.6rem]">Upcoming</dt><dd className="num mt-1 text-2xl">{String(upcoming.length).padStart(2, '0')}</dd></div>
        <div className="border-l border-line py-4 pl-4"><dt className="eyebrow !text-[0.6rem]">Recruiting</dt><dd className="mt-1 text-lg">{c.recruiting ? 'Yes, now' : 'Not now'}</dd></div>
      </dl>
      {requested && <p role="status" className="mt-4 text-sm text-gold">Join request sent on <Num>{longDate(new Date(requested))}</Num>. The core team replies by email.</p>}

      <section className="mt-12" aria-labelledby="club-up">
        <SectionTitle id="club-up" title="Coming up" count={upcoming.length} />
        {upcoming.length ? upcoming.map((e) => <EventRow key={e.id} e={e} />) : <p className="text-mute">Nothing scheduled yet. Follow {c.name} and new events appear on your Today page.</p>}
      </section>

      <section className="mt-12" aria-labelledby="club-past">
        <SectionTitle id="club-past" title="What they’ve run" count={past.length} />
        {past.length ? past.map((e) => <EventRow key={e.id} e={e} />) : <p className="text-mute">Past events will be kept here, so you can see what the club actually does.</p>}
      </section>

      <JoinDialog c={c} open={asking} onClose={() => setAsking(false)} />
    </>
  )
}

const KEY: Record<Ask, keyof Links> = { GitHub: 'github', LinkedIn: 'linkedin', Portfolio: 'portfolio' }

function JoinDialog({ c, open, onClose }: { c: Club; open: boolean; onClose: () => void }) {
  const titleId = useId()
  const { profile, setLinks, requestJoin } = useStore()
  const asks = asksFor(c)
  const [links, setL] = useState<Links>(profile?.links ?? { github: '', linkedin: '', portfolio: '' })
  const [note, setNote] = useState('')
  if (!profile) return null

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    if (!linksValid(links)) return
    setLinks({ github: normaliseLink(links.github), linkedin: normaliseLink(links.linkedin), portfolio: normaliseLink(links.portfolio) })
    requestJoin(c.id)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId}>
      <form onSubmit={send} className="border border-line-strong bg-slate-2">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 md:px-7">
          <div>
            <p className="slate-no">Join request</p>
            <h2 id={titleId} className="mt-1 text-2xl">{c.name}</h2>
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="max-h-[60dvh] overflow-y-auto overscroll-contain px-5 py-5 md:px-7">
          <p className="eyebrow">Sent with your request</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-mute">Name</dt><dd>{profile.name}</dd>
            <dt className="text-mute">Email</dt><dd className="truncate">{profile.email}</dd>
            <dt className="text-mute">Year</dt><dd><Num>Year {profile.year}</Num>, {profile.school.replace('School of ', '')}</dd>
          </dl>
          {asks.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <p className="eyebrow">{c.name} asks for</p>
              <p className="mt-1 mb-4 text-sm text-mute">Filled from your profile. Changes here are saved there too.</p>
              <LinksFields value={links} onChange={setL} only={asks.map((a) => KEY[a])} />
            </div>
          )}
          <div className="mt-6 border-t border-line pt-5">
            <label htmlFor={`${titleId}-note`} className="eyebrow">A line about you (optional)</label>
            <textarea id={`${titleId}-note`} className="field mt-2 min-h-24" maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What would you like to do in the club?" />
            <p className="mt-1 text-right text-xs text-mute"><Num>{note.length}</Num>/<Num>280</Num></p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-line px-5 py-4 md:px-7">
          <button type="submit" className="btn btn-gold">Send request</button>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Dialog>
  )
}
