import { useId, useMemo, useState, type ReactNode } from 'react'
import { EventRow, ShareButton } from '../components/EventBits'
import { ContactSheet } from '../components/Frames'
import { LinksFields, linksValid, normaliseLink } from '../components/LinksFields'
import { Dialog, EmptyState, ErrorState, Icon, ListSkeleton, Monogram, Num, PageHeader, Reveal } from '../components/ui'
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

/** Sc. 04: an index, alphabetical, like the back of a programme. */
function ClubIndex() {
  const { clubs } = useCatalog()
  const { followedClubs, joinRequests } = useStore()
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
  }, [clubs, cat, recruiting, mine, text, followedClubs])

  return (
    <>
      <PageHeader scene="04" eyebrow="Clubs" title="Every club, one index" aside={<p className="text-sm text-mute"><Num>{clubs.length}</Num> approved · <Num>{clubs.filter((c) => c.recruiting).length}</Num> recruiting</p>}>
        <p>Each club has its own page: what it does, who runs it, what’s on, and a form to join. No Instagram or WhatsApp hunting.</p>
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
                      {joinRequests[c.id] ? <span className="tag tag-gold">Requested</span> : c.recruiting ? <span className="tag tag-teal">Recruiting</span> : <span className="tag">{c.category}</span>}
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

const TONE: Record<ClubPage['tone'], string> = {
  gold: 'from-gold/25 via-gold/5',
  teal: 'from-teal/70 via-teal/15',
  slate: 'from-slate via-slate/30',
}

/** A club’s own page. The core team decides which sections show and in what order. */
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

  const join = guest ? (
    <a className="btn btn-gold" href="#/">Sign in to join</a>
  ) : request ? (
    <button className="btn" onClick={() => withdrawJoin(c.id)}>Withdraw request</button>
  ) : page.recruitment.open ? (
    <button className="btn btn-gold" onClick={() => setJoining(true)}>Apply to join</button>
  ) : null

  const sections: Record<ClubSection, ReactNode> = {
    about: (
      <Section id="about" title="About and objectives">
        <p className="max-w-[62ch] text-lg leading-relaxed">{page.about}</p>
        {page.objectives.length > 0 && (
          <ol className="mt-6 border-t border-line">
            {page.objectives.map((o, i) => (
              <li key={i} className="grid grid-cols-[2.5rem_1fr] border-b border-line py-3">
                <Num className="text-gold">{String(i + 1).padStart(2, '0')}</Num>
                <span>{o}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>
    ),
    recruitment: (
      <Section id="recruitment" title="Recruitment">
        {page.recruitment.open ? (
          <div className="grid gap-6 border border-line-strong p-5 md:grid-cols-[1fr_auto] md:p-7">
            <div>
              <p className="eyebrow">{request ? 'Your request is with the core team' : 'Open now'}{closes && <> · closes <Num>{longDate(closes)}</Num></>}</p>
              <p className="mt-3 max-w-[56ch] leading-relaxed">{request ? `Sent ${dayMonth(new Date(request.at))} for ${request.role || 'Member'}. They reply on your RVU email within a week.` : page.recruitment.message}</p>
              {page.recruitment.roles.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {page.recruitment.roles.map((r) => <li key={r} className="tag">{r}</li>)}
                </ul>
              )}
            </div>
            <div className="self-end">{join}</div>
          </div>
        ) : (
          <p className="text-mute">Not recruiting right now. Follow the club and you’ll hear when it opens.</p>
        )}
      </Section>
    ),
    upcoming: (
      <Section id="upcoming" title="Upcoming events" count={upcoming.length}>
        {upcoming.length ? <div className="border-t border-line">{upcoming.map((e) => <EventRow key={e.id} e={e} />)}</div> : <p className="text-mute">Nothing scheduled yet.</p>}
      </Section>
    ),
    leadership: (
      <Section id="leadership" title="Current leadership">
        <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {page.leadership.map((m) => (
            <li key={m.name + m.role} className="flex items-center gap-4 bg-ink p-4">
              <Monogram text={m.name.split(' ').map((w) => w[0]).join('').slice(0, 2)} size="sm" />
              <span>
                {m.studentId ? <a className="hover-gold block" href={href(`people/${m.studentId}`)}>{m.name}</a> : <span className="block">{m.name}</span>}
                <span className="text-sm text-mute">{m.role}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>
    ),
    archive: (
      <Section id="archive" title="Previous activities" count={past.length}>
        {past.length === 0 ? (
          <p className="text-mute">The archive starts with the club’s first event on RVU Connect.</p>
        ) : (
          <ul className="grid gap-10">
            {past.map((e) => (
              <li key={e.id} className="grid gap-4 md:grid-cols-[16rem_1fr]">
                <div>
                  <Num className="text-sm text-gold">{longDate(e.start)}</Num>
                  <h3 className="mt-1 text-2xl">{e.title}</h3>
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
      <Section id="contact" title="Contact">
        <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
          <ContactItem icon="mail" label="Email" value={page.contact.email} link={page.contact.email && `mailto:${page.contact.email}`} />
          <ContactItem icon="globe" label="Website" value={page.contact.website.replace(/^https?:\/\//, '')} link={page.contact.website} />
          <ContactItem icon="image" label="Instagram" value={page.contact.instagram} link={page.contact.instagram && `https://instagram.com/${page.contact.instagram.replace('@', '')}`} />
          <ContactItem icon="chat" label="WhatsApp" value={page.contact.whatsapp ? 'Community group' : ''} link={page.contact.whatsapp} />
        </ul>
      </Section>
    ),
  }

  return (
    <>
      <header className="relative -mx-4 overflow-hidden border-b border-line-strong px-4 pt-8 pb-8 md:-mx-8 md:px-8 md:pt-14 md:pb-12">
        <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${TONE[page.tone]} to-transparent`} />
        <div className="relative">
          <a href={href('clubs')} className="hover-gold inline-flex items-center gap-2 text-sm text-mute"><Icon name="arrow-left" className="h-4 w-4" /> All clubs</a>
          <div className="mt-6 grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-end">
            <Monogram text={c.mono} size="lg" gold />
            <Reveal>
              <p className="slate-no">{c.category} · founded <Num>{page.founded}</Num></p>
              <h1 className="mt-2 text-[clamp(2.4rem,1.6rem+3.4vw,4.6rem)] leading-[0.98]">{c.name}</h1>
              <p className="mt-3 max-w-[52ch] text-lg text-mute">{page.tagline}</p>
            </Reveal>
            <dl className="flex gap-6 text-sm md:flex-col md:gap-2 md:text-right">
              <div><dt className="text-mute">Members</dt><dd><Num className="text-2xl">{c.members + (following ? 1 : 0)}</Num></dd></div>
              <div><dt className="text-mute">Upcoming</dt><dd><Num className="text-2xl">{upcoming.length}</Num></dd></div>
            </dl>
          </div>
          <div className="mt-7 flex flex-wrap gap-2 sm:gap-3">
            {join}
            <button className="btn" aria-pressed={following} onClick={() => toggleFollow(c.id)}>
              <Icon name={following ? 'check' : 'plus'} className="h-4 w-4" /> {following ? 'Following' : 'Follow'}
            </button>
            {page.contact.website && (
              <a className="btn" href={page.contact.website} target="_blank" rel="noreferrer"><Icon name="globe" className="h-4 w-4" /> Website</a>
            )}
            <ShareButton path={`clubs/${c.id}`} title={c.name} />
            {!guest && (
              <button className="btn btn-sm ml-auto" onClick={() => { setManaging(c.id); go(`host/${c.id}`) }}>
                <Icon name="settings" className="h-4 w-4" /> Manage page
              </button>
            )}
          </div>
        </div>
      </header>

      <nav aria-label="On this page" className="sticky top-16 z-20 -mx-4 overflow-x-auto border-b border-line bg-ink/90 px-4 backdrop-blur no-scrollbar md:-mx-8 md:px-8">
        <ul className="flex gap-6 whitespace-nowrap py-3 text-sm">
          {order.map((s) => (
            <li key={s}><a className="hover-gold text-mute" href={`#/clubs/${c.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`sec-${s}`)?.scrollIntoView({ behavior: 'smooth' }) }}>{CLUB_SECTIONS.find((x) => x.id === s)!.label}</a></li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-14 py-10 md:gap-20 md:py-14">{order.map((s) => <div key={s}>{sections[s]}</div>)}</div>

      {!guest && <JoinDialog c={c} page={page} open={joining} onClose={() => setJoining(false)} />}
    </>
  )
}

function Section({ id, title, count, children }: { id: ClubSection; title: string; count?: number; children: ReactNode }) {
  return (
    <section id={`sec-${id}`} aria-labelledby={`h-${id}`} className="scroll-mt-32">
      <div className="mb-5 flex items-baseline gap-3">
        <h2 id={`h-${id}`} className="text-[clamp(1.6rem,1.3rem+1vw,2.2rem)]">{title}</h2>
        {count !== undefined && <Num className="text-mute">{count}</Num>}
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
