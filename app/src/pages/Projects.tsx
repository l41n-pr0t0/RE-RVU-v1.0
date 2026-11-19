import { useId, useMemo, useState, type FormEvent } from 'react'
import { ShareButton } from '../components/EventBits'
import { LinksFields, linksValid, normaliseLink } from '../components/LinksFields'
import { Dialog, EmptyState, ErrorState, Icon, ListSkeleton, Monogram, Num, PageHeader, Reveal, SectionTitle } from '../components/ui'
import { CATEGORIES, SCHOOLS, type Category, type Links, type Opening, type Project, type School } from '../data/types'
import { skillMatch, useCatalog } from '../lib/catalog'
import { daysFrom, longDate, relativeDay } from '../lib/format'
import { go, href } from '../lib/router'
import { useQuery, useStore } from '../lib/store'

export default function Projects({ id }: { id?: string }) {
  const { projectById } = useCatalog()
  if (id === 'new') return <PublishProject />
  const p = id ? projectById(id) : undefined
  if (id && !p)
    return (
      <div className="py-16">
        <EmptyState
          title="We can’t find that project"
          body="It may have been taken down by its team. Other projects are still listed."
          action={<a className="btn" href={href('projects')}>All projects</a>}
        />
      </div>
    )
  return p ? <ProjectDetail p={p} /> : <ProjectIndex />
}

type View = 'all' | 'looking' | 'saved' | 'mine'

/** Showcase of student work, with teams that are looking for collaborators pulled forward. */
function ProjectIndex() {
  const { projects } = useCatalog()
  const q = useQuery(projects)
  const { profile, applications, savedProjects } = useStore()
  const [cat, setCat] = useState<Category | null>(null)
  const [view, setView] = useState<View>('all')
  const [text, setText] = useState('')
  const mySkills = profile?.skills ?? []

  const list = useMemo(() => {
    const t = text.trim().toLowerCase()
    return (q.data ?? []).filter((p) => {
      if (cat && p.category !== cat) return false
      if (view === 'looking' && !p.openings.length) return false
      if (view === 'saved' && !savedProjects.includes(p.id)) return false
      if (view === 'mine' && !p.mine && !applications[p.id]) return false
      if (t && !`${p.name} ${p.description} ${p.stack.join(' ')} ${p.openings.map((o) => o.role + ' ' + o.skills.join(' ')).join(' ')}`.toLowerCase().includes(t)) return false
      return true
    })
  }, [q.data, cat, view, text, savedProjects, applications])

  // Openings that match the skills on your profile, best match first.
  const matches = useMemo(() => {
    if (!mySkills.length) return []
    return (q.data ?? [])
      .flatMap((p) => p.openings.map((o) => ({ p, o, hit: skillMatch(mySkills, o.skills) })))
      .filter((x) => x.hit.length && !x.p.mine)
      .sort((a, b) => b.hit.length - a.hit.length)
      .slice(0, 3)
  }, [q.data, mySkills])

  const looking = (q.data ?? []).filter((p) => p.openings.length).length

  return (
    <div className="pb-16">
      <PageHeader
        scene="05"
        eyebrow="Student projects"
        title={<>What students are <em className="text-gold">building</em>.</>}
        aside={
          <a className="btn btn-gold" href={href('projects/new')}>
            <Icon name="plus" /> Publish a project
          </a>
        }
      >
        Real work from RVU students. <Num>{looking}</Num> teams are looking for people right now.
      </PageHeader>

      {matches.length > 0 && (
        <section aria-labelledby="for-you" className="mt-10">
          <SectionTitle id="for-you" title="Openings that fit your skills" count={matches.length} />
          <ul className="grid gap-px border border-line bg-line md:grid-cols-3">
            {matches.map(({ p, o, hit }) => (
              <li key={p.id + o.role} className="bg-ink">
                <a href={href(`projects/${p.id}`)} className="row-hover block h-full p-5">
                  <p className="eyebrow">{p.name}</p>
                  <p className="mt-2 font-display text-xl">{o.role}</p>
                  <p className="mt-3 text-sm text-mute">You have {hit.join(', ')}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="sticky top-16 z-10 mt-10 border-b border-line bg-ink/95 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-0 flex-1 basis-56">
            <span className="sr-only">Search projects</span>
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute" />
            <input className="field pl-10" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search by name, skill or stack" />
          </label>
          <div role="group" aria-label="Show" className="no-scrollbar flex gap-2 overflow-x-auto">
            {(
              [
                ['all', 'All'],
                ['looking', 'Looking for people'],
                ['saved', 'Saved'],
                ['mine', 'Mine'],
              ] as [View, string][]
            ).map(([k, l]) => (
              <button key={k} type="button" className="chip shrink-0" aria-pressed={view === k} onClick={() => setView(k)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div role="group" aria-label="Category" className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          <button type="button" className="chip shrink-0" aria-pressed={!cat} onClick={() => setCat(null)}>
            Every category
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} type="button" className="chip shrink-0" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {q.status === 'loading' ? (
          <ListSkeleton rows={4} tall />
        ) : q.status === 'error' ? (
          <ErrorState onRetry={q.retry} />
        ) : list.length ? (
          <ul className="grid gap-px border border-line bg-line md:grid-cols-2">
            {list.map((p, i) => (
              <Reveal as="li" key={p.id} delay={Math.min(i, 6) * 0.04} className="bg-ink">
                <ProjectCard p={p} />
              </Reveal>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={view === 'saved' ? 'Nothing saved yet' : view === 'mine' ? 'No projects of yours yet' : 'No projects match'}
            body={view === 'mine' ? 'Publish a project, or apply to join a team, and it shows up here.' : 'Try another category or clear the search.'}
            action={
              <button type="button" className="btn" onClick={() => { setCat(null); setView('all'); setText('') }}>
                Show everything
              </button>
            }
          />
        )}
      </div>
    </div>
  )
}

function ProjectCard({ p }: { p: Project }) {
  const { applications } = useStore()
  const applied = applications[p.id]
  return (
    <a href={href(`projects/${p.id}`)} className="row-hover flex h-full flex-col p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{p.category} · {p.status}</p>
        {applied ? <span className="tag tag-gold">Applied</span> : p.mine ? <span className="tag">Yours</span> : p.openings.length ? <span className="tag tag-teal">Looking</span> : null}
      </div>
      <h2 className="mt-3 text-2xl leading-tight md:text-3xl">{p.name}</h2>
      <p className="mt-2 line-clamp-3 text-mute">{p.description}</p>
      <p className="mt-4 flex flex-wrap gap-1.5">
        {p.stack.slice(0, 5).map((s) => (
          <span key={s} className="tag">{s}</span>
        ))}
      </p>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5 text-sm text-mute">
        <span>{p.team.length} on the team · updated {relativeDay(p.updated).toLowerCase()}</span>
        {p.openings.length > 0 && <span className="text-paper">{p.openings.length} open {p.openings.length === 1 ? 'role' : 'roles'}</span>}
      </div>
    </a>
  )
}

function ProjectDetail({ p }: { p: Project }) {
  const { profile, applications, savedProjects, toggleSavedProject, withdraw, deleteProject } = useStore()
  const { studentById } = useCatalog()
  const [applying, setApplying] = useState<Opening | null>(null)
  const applied = applications[p.id]
  const saved = savedProjects.includes(p.id)
  const days = p.closes ? daysFrom(p.closes) : null
  const closed = days !== null && days < 0
  const mySkills = profile?.skills ?? []

  return (
    <article className="pb-16">
      <div className="pt-6">
        <a href={href('projects')} className="hover-gold inline-flex items-center gap-2 text-sm text-mute">
          <Icon name="arrow-left" /> All projects
        </a>
      </div>
      <PageHeader
        scene="05"
        eyebrow={`${p.category} · ${p.school}`}
        title={p.name}
        aside={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" aria-pressed={saved} onClick={() => toggleSavedProject(p.id)}>
              <Icon name={saved ? 'bookmark-fill' : 'bookmark'} /> {saved ? 'Saved' : 'Save'}
            </button>
            <ShareButton path={`projects/${p.id}`} title={p.name} />
          </div>
        }
      >
        {p.description}
      </PageHeader>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="openings">
            <SectionTitle id="openings" title="Looking for" count={p.openings.length} />
            {p.openings.length === 0 ? (
              <p className="text-mute">This team isn’t looking for anyone at the moment.</p>
            ) : (
              <>
                {p.closes && (
                  <p className="mb-4 text-sm text-mute">
                    {closed ? 'Applications closed on ' : 'Applications close '}
                    <span className="text-paper">{longDate(p.closes)}</span>
                    {!closed && days !== null && <> · {days === 0 ? 'today' : `in ${days} ${days === 1 ? 'day' : 'days'}`}</>}
                  </p>
                )}
                <ul className="border-t border-line">
                  {p.openings.map((o) => {
                    const hit = skillMatch(mySkills, o.skills)
                    const mine = applied?.role === o.role
                    return (
                      <li key={o.role} className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5">
                        <div className="min-w-0">
                          <h3 className="font-display text-xl">{o.role}</h3>
                          <p className="mt-1 text-sm text-mute">{o.commitment}</p>
                          <p className="mt-3 flex flex-wrap gap-1.5">
                            {o.skills.map((s) => (
                              <span key={s} className={hit.includes(s) ? 'tag tag-gold' : 'tag'}>{s}</span>
                            ))}
                          </p>
                        </div>
                        {p.mine ? null : mine ? (
                          <div className="flex items-center gap-3">
                            <span className="tag tag-gold">Applied {relativeDay(new Date(applied.at)).toLowerCase()}</span>
                            <button type="button" className="btn btn-sm" onClick={() => withdraw(p.id)}>Withdraw</button>
                          </div>
                        ) : (
                          <button type="button" className="btn btn-gold" disabled={closed || !!applied || !profile} onClick={() => setApplying(o)}>
                            {!profile ? 'Sign in to apply' : applied ? 'Applied for another role' : 'Apply'}
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
                {hasAnyHit(p, mySkills) && <p className="mt-3 text-sm text-mute">Skills in gold are ones on your profile.</p>}
              </>
            )}
          </section>

          <section aria-labelledby="team">
            <SectionTitle id="team" title="The team" count={p.team.length} />
            <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
              {p.team.map((m) => {
                const s = m.studentId ? studentById(m.studentId) : undefined
                const inner = (
                  <>
                    <Monogram text={m.name} />
                    <span className="min-w-0">
                      <span className="block truncate">{m.name}</span>
                      <span className="block truncate text-sm text-mute">{m.role}</span>
                    </span>
                  </>
                )
                return (
                  <li key={m.name} className="bg-ink">
                    {s ? (
                      <a href={href(`people/${s.id}`)} className="row-hover flex items-center gap-4 p-4">{inner}</a>
                    ) : (
                      <div className="flex items-center gap-4 p-4">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <dl className="border border-line">
            <Fact k="Status" v={p.status} />
            <Fact k="School" v={p.school} />
            <Fact k="Last updated" v={longDate(p.updated)} />
          </dl>
          <div>
            <p className="eyebrow">Built with</p>
            <p className="mt-3 flex flex-wrap gap-1.5">
              {p.stack.map((s) => (
                <span key={s} className="tag">{s}</span>
              ))}
            </p>
          </div>
          {(p.github || p.demo) && (
            <div className="flex flex-col gap-2">
              {p.github && (
                <a className="btn" href={p.github} target="_blank" rel="noreferrer">
                  <Icon name="github" /> Source on GitHub <Icon name="external" />
                </a>
              )}
              {p.demo && (
                <a className="btn" href={p.demo} target="_blank" rel="noreferrer">
                  <Icon name="link" /> Live demo <Icon name="external" />
                </a>
              )}
            </div>
          )}
          {p.mine && (
            <button
              type="button"
              className="btn w-full"
              onClick={() => {
                deleteProject(p.id)
                go('projects')
              }}
            >
              Take this project down
            </button>
          )}
        </aside>
      </div>

      {applying && <ApplyDialog p={p} o={applying} onClose={() => setApplying(null)} />}
    </article>
  )
}

const hasAnyHit = (p: Project, mine: string[]) => p.openings.some((o) => skillMatch(mine, o.skills).length)

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line px-4 py-3 last:border-b-0">
      <dt className="text-sm text-mute">{k}</dt>
      <dd className="text-right text-sm">{v}</dd>
    </div>
  )
}

function ApplyDialog({ p, o, onClose }: { p: Project; o: Opening; onClose: () => void }) {
  const { profile, apply, setLinks } = useStore()
  const titleId = useId()
  const [note, setNote] = useState('')
  const [links, setL] = useState<Links>(profile?.links ?? { github: '', linkedin: '', portfolio: '' })
  const [done, setDone] = useState(false)
  const needs: (keyof Links)[] = p.category === 'Design' || p.category === 'Media' ? ['portfolio', 'linkedin'] : ['github', 'linkedin']

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity() || !linksValid(links)) return
    const clean = { github: normaliseLink(links.github), linkedin: normaliseLink(links.linkedin), portfolio: normaliseLink(links.portfolio) }
    setLinks(clean)
    apply(p.id, o.role, note.trim())
    setDone(true)
  }

  return (
    <Dialog open onClose={onClose} variant="sheet" labelledBy={titleId}>
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div>
            <p className="eyebrow">{p.name}</p>
            <h2 id={titleId} className="mt-2 text-2xl">{done ? 'Application sent' : `Apply as ${o.role}`}</h2>
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        {done ? (
          <div className="p-5">
            <p className="text-mute">
              The team lead gets your note and links. You’ll see their reply under Notifications. You can withdraw any time from this page.
            </p>
            <button type="button" className="btn btn-gold mt-6" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="flex-1 space-y-6 overflow-y-auto p-5" onSubmit={submit} noValidate={false}>
            <div className="field-wrap">
              <label htmlFor={`${titleId}-note`} className="eyebrow">Why you, in a few lines</label>
              <p className="mt-1 text-sm text-mute">At least 20 characters. What you’d bring and what you’ve built before.</p>
              <textarea
                id={`${titleId}-note`}
                required
                minLength={20}
                maxLength={500}
                className="field mt-2 min-h-32"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <p className="field-error">Error: write at least 20 characters.</p>
            </div>
            <div>
              <p className="eyebrow">Links sent with your application</p>
              <p className="mt-1 text-sm text-mute">Saved to your profile so you don’t type them again.</p>
              <div className="mt-3">
                <LinksFields value={links} onChange={setL} only={needs} />
              </div>
            </div>
            <button type="submit" className="btn btn-gold w-full">Send application</button>
          </form>
        )}
      </div>
    </Dialog>
  )
}

/** Publish your own project. Kept in this browser for the prototype. */
function PublishProject() {
  const { profile, publishProject } = useStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('Technology')
  const [school, setSchool] = useState<School>(profile?.school || SCHOOLS[0])
  const [stack, setStack] = useState('')
  const [github, setGithub] = useState('')
  const [demo, setDemo] = useState('')
  const [openings, setOpenings] = useState<Opening[]>([])
  const [closes, setCloses] = useState('')

  if (!profile)
    return (
      <div className="py-16">
        <EmptyState title="Sign in to publish" body="Projects are listed under your name, so we need to know who you are." action={<a className="btn" href={href('')}>Sign in</a>} />
      </div>
    )

  const setOpening = (i: number, patch: Partial<Opening>) => setOpenings((o) => o.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) return
    const id = `p-mine-${Date.now().toString(36)}`
    publishProject({
      id,
      name: name.trim(),
      description: description.trim(),
      category,
      school,
      status: 'Building',
      stack: stack.split(',').map((s) => s.trim()).filter(Boolean),
      github: normaliseLink(github),
      demo: normaliseLink(demo),
      team: [{ name: profile.name, role: 'Lead', studentId: 'me' }],
      openings: openings.filter((o) => o.role.trim()).map((o) => ({ ...o, role: o.role.trim() })),
      closes: closes ? new Date(`${closes}T23:59`) : undefined,
      updated: new Date(),
      mine: true,
    })
    go(`projects/${id}`)
  }

  return (
    <div className="pb-16">
      <div className="pt-6">
        <a href={href('projects')} className="hover-gold inline-flex items-center gap-2 text-sm text-mute">
          <Icon name="arrow-left" /> All projects
        </a>
      </div>
      <PageHeader scene="05" eyebrow="Publish" title="Put your project on the board.">
        Other students can find it, follow it and apply for the roles you list.
      </PageHeader>
      <form className="mt-10 grid max-w-3xl gap-8" onSubmit={submit}>
        <div className="field-wrap">
          <label className="eyebrow" htmlFor="pn">Project name</label>
          <input id="pn" className="field mt-2" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
          <p className="field-error">Error: give the project a name.</p>
        </div>
        <div className="field-wrap">
          <label className="eyebrow" htmlFor="pd">What it does</label>
          <p className="mt-1 text-sm text-mute">Two or three sentences. Start with the problem.</p>
          <textarea id="pd" className="field mt-2 min-h-28" required minLength={30} maxLength={400} value={description} onChange={(e) => setDescription(e.target.value)} />
          <p className="field-error">Error: at least 30 characters.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="eyebrow" htmlFor="pc">Category</label>
            <select id="pc" className="field mt-2" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="eyebrow" htmlFor="ps">School</label>
            <select id="ps" className="field mt-2" value={school} onChange={(e) => setSchool(e.target.value as School)}>
              {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="eyebrow" htmlFor="pst">Built with</label>
          <p className="mt-1 text-sm text-mute">Separate with commas, for example: React, Python, Figma</p>
          <input id="pst" className="field mt-2" value={stack} onChange={(e) => setStack(e.target.value)} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="field-wrap">
            <label className="eyebrow" htmlFor="pg">GitHub repository (optional)</label>
            <input id="pg" type="url" className="field mt-2" placeholder="https://github.com/…" value={github} onChange={(e) => setGithub(e.target.value)} />
            <p className="field-error">Error: enter a full link starting with https://</p>
          </div>
          <div className="field-wrap">
            <label className="eyebrow" htmlFor="pdm">Live demo (optional)</label>
            <input id="pdm" type="url" className="field mt-2" placeholder="https://…" value={demo} onChange={(e) => setDemo(e.target.value)} />
            <p className="field-error">Error: enter a full link starting with https://</p>
          </div>
        </div>

        <fieldset className="border-t border-line pt-6">
          <legend className="eyebrow">Looking for collaborators?</legend>
          <p className="mt-1 text-sm text-mute">Add the roles you need. Students whose skills match will see your project first.</p>
          <ul className="mt-4 space-y-4">
            {openings.map((o, i) => (
              <li key={i} className="grid gap-3 border border-line p-4 sm:grid-cols-[1fr_1fr_auto]">
                <input aria-label="Role" className="field" placeholder="Role, e.g. Frontend developer" value={o.role} onChange={(e) => setOpening(i, { role: e.target.value })} />
                <input
                  aria-label="Skills, comma separated"
                  className="field"
                  placeholder="Skills, comma separated"
                  value={o.skills.join(', ')}
                  onChange={(e) => setOpening(i, { skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                />
                <button type="button" className="icon-btn" aria-label="Remove role" onClick={() => setOpenings((x) => x.filter((_, j) => j !== i))}>
                  <Icon name="close" />
                </button>
                <input aria-label="Time needed" className="field sm:col-span-2" placeholder="Time needed, e.g. 3 hours a week" value={o.commitment} onChange={(e) => setOpening(i, { commitment: e.target.value })} />
              </li>
            ))}
          </ul>
          <button type="button" className="btn mt-4" onClick={() => setOpenings((o) => [...o, { role: '', skills: [], commitment: '' }])}>
            <Icon name="plus" /> Add a role
          </button>
          {openings.length > 0 && (
            <div className="mt-6 max-w-xs">
              <label className="eyebrow" htmlFor="pcl">Applications close (optional)</label>
              <input id="pcl" type="date" className="field mt-2" value={closes} onChange={(e) => setCloses(e.target.value)} />
            </div>
          )}
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn btn-gold">Publish project</button>
          <a className="btn" href={href('projects')}>Cancel</a>
        </div>
      </form>
    </div>
  )
}
