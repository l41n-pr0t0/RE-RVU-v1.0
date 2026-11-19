import { useId, useMemo, useState } from 'react'
import { LinksFields, linksValid, normaliseLink } from '../components/LinksFields'
import { Dialog, EmptyState, ErrorState, Icon, ListSkeleton, Num, PageHeader, Reveal } from '../components/ui'
import { projects } from '../data/mock'
import { CATEGORIES, type Category, type Links, type Project } from '../data/types'
import { daysFrom, longDate, relativeDay } from '../lib/format'
import { href } from '../lib/router'
import { useQuery, useStore } from '../lib/store'

export default function Projects({ id }: { id?: string }) {
  const p = id ? projects.find((x) => x.id === id) : undefined
  if (id && !p)
    return (
      <div className="py-16">
        <EmptyState title="That team has closed" body="The project may have filled its roles. Others are still looking." action={<a className="btn" href={href('projects')}>All projects</a>} />
      </div>
    )
  return p ? <ProjectDetail p={p} /> : <ProjectIndex />
}

/** Sc. 05: teams looking for people. Sorted by deadline, roles up front. */
function ProjectIndex() {
  const q = useQuery(projects)
  const { applications, profile } = useStore()
  const [cat, setCat] = useState<Category | null>(null)
  const [mine, setMine] = useState(false)
  const now = useMemo(() => new Date(), [])
  const interests = profile?.interests ?? []

  const list = useMemo(
    () =>
      [...projects]
        .sort((a, b) => +a.deadline - +b.deadline)
        .filter((p) => (!cat || p.category === cat) && (!mine || applications[p.id])),
    [cat, mine, applications],
  )

  return (
    <>
      <PageHeader scene="05" eyebrow="Projects" title="Teams looking for people" aside={<p className="text-sm text-mute"><Num>{projects.length}</Num> open · closest deadline first</p>}>
        <p>Student-led projects across schools. Apply to one role; your profile and links go with it.</p>
      </PageHeader>

      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar">
        <button className="chip shrink-0" aria-pressed={mine} onClick={() => setMine((x) => !x)}>My applications</button>
        <span className="w-px shrink-0 bg-line" aria-hidden />
        {CATEGORIES.map((c) => (
          <button key={c} className="chip shrink-0" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>
            {c}
            {interests.includes(c) && <span className="sr-only"> (your interest)</span>}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {q.status === 'loading' && <ListSkeleton rows={4} tall />}
        {q.status === 'error' && <ErrorState onRetry={q.retry} />}
        {q.status === 'ready' &&
          (list.length === 0 ? (
            <EmptyState title={mine ? 'No applications yet' : 'No teams in this category'} body={mine ? 'When you apply to a role, it’s tracked here.' : 'Try another category.'} />
          ) : (
            <ol className="border-t border-line">
              {list.map((p, i) => {
                const left = daysFrom(p.deadline, now)
                const app = applications[p.id]
                return (
                  <Reveal as="li" key={p.id} delay={Math.min(i, 5) * 0.04} className="border-b border-line">
                    <a href={href(`projects/${p.id}`)} className="row-hover group grid gap-4 py-6 md:grid-cols-[3rem_minmax(0,1fr)_14rem] md:gap-8">
                      <Num className="hidden pt-1 text-sm text-mute md:block">{String(i + 1).padStart(2, '0')}</Num>
                      <div className="min-w-0">
                        <p className="eyebrow !text-[0.62rem]">{p.category} · {p.school.replace('School of ', '')}</p>
                        <h2 className="mt-2 text-[clamp(1.4rem,1.15rem+1vw,2rem)] leading-tight group-hover:text-gold">{p.title}</h2>
                        <p className="mt-2 max-w-[62ch] text-mute">{p.pitch}</p>
                        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Open roles">
                          {p.roles.map((r) => (
                            <li key={r} className={`tag ${app?.role === r ? 'tag-gold' : ''}`}>{r}</li>
                          ))}
                        </ul>
                      </div>
                      <dl className="grid grid-cols-3 gap-3 text-sm md:grid-cols-1 md:content-start md:border-l md:border-line md:pl-6">
                        <div><dt className="text-xs text-mute">Closes</dt><dd className={left <= 3 ? 'text-gold' : ''}>{relativeDay(p.deadline, now)}</dd></div>
                        <div><dt className="text-xs text-mute">Time</dt><dd>{p.commitment}</dd></div>
                        <div><dt className="text-xs text-mute">Team</dt><dd><Num>{p.team}</Num> people</dd></div>
                        {app && <div className="col-span-3 md:col-span-1"><span className="tag tag-gold">Applied · {app.role}</span></div>}
                      </dl>
                    </a>
                  </Reveal>
                )
              })}
            </ol>
          ))}
      </div>
    </>
  )
}

function ProjectDetail({ p }: { p: Project }) {
  const { applications, profile, withdraw } = useStore()
  const [role, setRole] = useState<string | null>(null)
  const app = applications[p.id]
  const guest = !profile?.email
  const now = new Date()

  return (
    <>
      <a href={href('projects')} className="hover-gold mt-6 inline-flex items-center gap-2 text-sm text-mute">
        <Icon name="arrow-left" className="h-4 w-4" /> All projects
      </a>
      <header className="border-b border-line pt-6 pb-8">
        <p className="flex items-center gap-3">
          <span className="slate-no">Sc. 05</span>
          <span className="h-px w-8 bg-line-strong" aria-hidden />
          <span className="eyebrow">{p.category} · {p.school}</span>
        </p>
        <h1 className="mt-3 max-w-[18ch] text-[clamp(2.2rem,1.6rem+2.8vw,4.4rem)] leading-[1.02]">{p.title}</h1>
        <p className="mt-4 max-w-[60ch] text-lg text-mute">{p.pitch}</p>
      </header>

      <dl className="grid grid-cols-2 border-b border-line md:grid-cols-4">
        {[
          ['Lead', p.owner],
          ['Closes', longDate(p.deadline)],
          ['Commitment', p.commitment],
          ['Team now', `${p.team} people`],
        ].map(([k, v], i) => (
          <div key={k} className={`py-4 ${i % 2 ? 'border-l border-line pl-4' : ''} ${i === 2 ? 'md:border-l md:border-line md:pl-4' : ''} ${i > 1 ? 'border-t border-line md:border-t-0' : ''}`}>
            <dt className="eyebrow !text-[0.6rem]">{k}</dt>
            <dd className="mt-1">{/\d/.test(v) ? <Num>{v}</Num> : v}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10" aria-labelledby="roles">
        <h2 id="roles" className="text-2xl">Open roles</h2>
        {app && (
          <p role="status" className="mt-3 text-sm text-gold">
            You applied as {app.role} on <Num>{longDate(new Date(app.at))}</Num>.{' '}
            <button className="underline underline-offset-4" onClick={() => withdraw(p.id)}>Withdraw</button>
          </p>
        )}
        <ul className="mt-5 border-t border-line">
          {p.roles.map((r) => (
            <li key={r} className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5">
              <div>
                <p className="font-display text-xl">{r}</p>
                <p className="mt-1 text-sm text-mute">{p.commitment} · reports to {p.owner}</p>
              </div>
              {app?.role === r ? (
                <span className="tag tag-gold">Your application</span>
              ) : guest ? (
                <a className="btn btn-sm" href="#/">Sign in to apply</a>
              ) : (
                <button className="btn btn-sm" disabled={!!app || daysFrom(p.deadline, now) < 0} onClick={() => setRole(r)}>
                  Apply
                </button>
              )}
            </li>
          ))}
        </ul>
        {app && <p className="mt-3 text-xs text-mute">One application per project. Withdraw to apply for a different role.</p>}
      </section>

      {role && <ApplyDialog p={p} role={role} onClose={() => setRole(null)} />}
    </>
  )
}

function ApplyDialog({ p, role, onClose }: { p: Project; role: string; onClose: () => void }) {
  const titleId = useId()
  const { profile, setLinks, apply } = useStore()
  const [links, setL] = useState<Links>(profile?.links ?? { github: '', linkedin: '', portfolio: '' })
  const [why, setWhy] = useState('')
  const [sent, setSent] = useState(false)
  if (!profile) return null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!linksValid(links)) return
    setLinks({ github: normaliseLink(links.github), linkedin: normaliseLink(links.linkedin), portfolio: normaliseLink(links.portfolio) })
    apply(p.id, role)
    setSent(true)
  }

  return (
    <Dialog open onClose={onClose} labelledBy={titleId}>
      {sent ? (
        <div className="border border-line-strong bg-slate-2 px-6 py-8 md:px-8">
          <p className="slate-no">Sent</p>
          <h2 id={titleId} className="mt-2 text-3xl">You applied as <span className="italic text-gold">{role}</span>.</h2>
          <p className="mt-3 text-mute">{p.owner} gets your profile and links. You can withdraw from this page until the deadline.</p>
          <button className="btn btn-gold mt-6" onClick={onClose} autoFocus>Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="border border-line-strong bg-slate-2">
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 md:px-7">
            <div>
              <p className="slate-no">Apply · {p.title}</p>
              <h2 id={titleId} className="mt-1 text-2xl">{role}</h2>
            </div>
            <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
          </div>
          <div className="max-h-[60dvh] overflow-y-auto overscroll-contain px-5 py-5 md:px-7">
            <p className="text-sm text-mute">
              Sending as <span className="text-paper">{profile.name}</span>, <Num>Year {profile.year}</Num>, {profile.school.replace('School of ', '')}.
            </p>
            <div className="mt-5">
              <LinksFields value={links} onChange={setL} />
            </div>
            <div className="mt-6 border-t border-line pt-5">
              <label htmlFor={`${titleId}-why`} className="eyebrow">Why this role</label>
              <textarea id={`${titleId}-why`} required minLength={20} maxLength={400} className="field mt-2 min-h-28" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Two or three lines on what you’d bring." aria-describedby={`${titleId}-why-err`} />
              <div className="mt-1 flex justify-between text-xs text-mute">
                <span id={`${titleId}-why-err`} className="field-note">At least 20 characters.</span>
                <span><Num>{why.length}</Num>/<Num>400</Num></span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-line px-5 py-4 md:px-7">
            <button type="submit" className="btn btn-gold">Send application</button>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      )}
    </Dialog>
  )
}
