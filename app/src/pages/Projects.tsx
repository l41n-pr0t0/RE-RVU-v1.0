import { useId, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { ShareButton } from '../components/EventBits'
import { LinksFields, linksValid, normaliseLink } from '../components/LinksFields'
import { Dialog, EmptyState, ErrorState, Icon, ListSkeleton, Monogram, Num, PageHeader, Reveal } from '../components/ui'
import { CATEGORIES, SCHOOLS, type Category, type Links, type Opening, type Project, type ProjectStatus, type School } from '../data/types'
import { skillMatch, useCatalog } from '../lib/catalog'
import { daysFrom, longDate } from '../lib/format'
import { go, href } from '../lib/router'
import { useQuery, useStore } from '../lib/store'

/**
 * Sc. 05: the project showcase, shaped like a code host because students
 * already know how to read one: owner / name, stars, topics, contributors,
 * a README. "Language" becomes discipline, so a moot-court template or a
 * poetry zine sits next to firmware on equal terms.
 */

export default function Projects({ id }: { id?: string }) {
  const { projectById } = useCatalog()
  if (id === 'new') return <PublishProject />
  const p = id ? projectById(id) : undefined
  if (id && !p)
    return (
      <div className="py-16">
        <EmptyState title="We can’t find that project" body="It may have been taken down by its team. Other projects are still listed." action={<a className="btn" href={href('projects')}>All projects</a>} />
      </div>
    )
  return p ? <ProjectDetail p={p} /> : <ProjectIndex />
}

/* ---------- Shared ---------- */

/** Discipline dots: brand tones only, one per area. */
const DOT: Record<Category, string> = {
  Technology: '#3d8f9b',
  Design: '#d7ac54',
  Business: '#c29650',
  Culture: '#efe6d2',
  Media: '#9aa6ad',
  'Social impact': '#6fb3bd',
  Sport: '#85631f',
}

const slug = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const owner = (p: Project) => slug(p.team[0]?.name ?? p.school.replace('School of ', ''))
const shortSchool = (s: School) => s.replace('School of ', '')

function updatedAgo(d: Date) {
  const n = -daysFrom(d)
  if (n <= 0) return 'today'
  if (n === 1) return 'yesterday'
  if (n < 30) return `${n} days ago`
  return `on ${longDate(d)}`
}

function useStar(p: Project) {
  const { savedProjects, toggleSavedProject } = useStore()
  const on = savedProjects.includes(p.id)
  return { on, count: (p.stars ?? 0) + (on ? 1 : 0), toggle: () => toggleSavedProject(p.id) }
}

const StarIcon = ({ filled, className = 'h-4 w-4' }: { filled: boolean; className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} strokeLinejoin="miter">
    <path d="m12 3.6 2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 17l-5.3 2.9 1.1-5.9L3.4 9.9l6-.8z" />
  </svg>
)

/** Star button with its count, split like a code host's. */
function StarButton({ p, size = 'sm' }: { p: Project; size?: 'sm' | 'md' }) {
  const s = useStar(p)
  return (
    <span className="inline-flex border border-line-strong">
      <button type="button" aria-pressed={s.on} onClick={s.toggle} className={`star-btn inline-flex items-center gap-2 px-3 text-xs font-bold tracking-[0.12em] uppercase transition-colors ${size === 'md' ? 'h-11' : 'h-9'} ${s.on ? 'text-gold' : 'hover-gold'}`}>
        <StarIcon filled={s.on} className={`h-4 w-4 ${s.on ? 'star-pop' : ''}`} /> {s.on ? 'Starred' : 'Star'}
      </button>
      <span className={`num grid place-items-center border-l border-line-strong px-3 text-sm ${size === 'md' ? 'h-11' : 'h-9'}`}>{s.count}</span>
    </span>
  )
}

function Contributors({ p, max = 4 }: { p: Project; max?: number }) {
  const shown = p.team.slice(0, max)
  return (
    <span className="inline-flex items-center">
      {shown.map((m, i) => (
        <span key={m.name} title={m.name} className={`grid h-6 w-6 place-items-center border border-ink bg-slate-2 font-display text-[0.6rem] italic text-gold ${i ? '-ml-1.5' : ''}`}>
          {m.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2)}
        </span>
      ))}
      {p.team.length > max && <Num className="ml-1.5 text-xs text-mute">+{p.team.length - max}</Num>}
    </span>
  )
}

/* ---------- Index ---------- */

type View = 'explore' | 'trending' | 'looking' | 'starred' | 'mine'
type Sort = 'stars' | 'updated' | 'name'

function ProjectIndex() {
  const { projects } = useCatalog()
  const q = useQuery(projects)
  const { profile, applications, savedProjects } = useStore()
  const [view, setView] = useState<View>('explore')
  const [cat, setCat] = useState<Category | null>(null)
  const [school, setSchool] = useState<School | null>(null)
  const [status, setStatus] = useState<ProjectStatus | null>(null)
  const [sort, setSort] = useState<Sort>('stars')
  const [text, setText] = useState('')
  const mySkills = useMemo(() => profile?.skills ?? [], [profile?.skills])
  const all = useMemo(() => q.data ?? [], [q.data])
  const stars = (p: Project) => (p.stars ?? 0) + (savedProjects.includes(p.id) ? 1 : 0)

  const inView = (p: Project, v: View) =>
    v === 'looking' ? p.openings.length > 0 : v === 'starred' ? savedProjects.includes(p.id) : v === 'mine' ? !!p.mine || !!applications[p.id] : true

  const list = useMemo(() => {
    const t = text.trim().toLowerCase()
    const out = all.filter((p) => {
      if (!inView(p, view)) return false
      if (cat && p.category !== cat) return false
      if (school && p.school !== school) return false
      if (status && p.status !== status) return false
      if (t && !`${p.name} ${p.description} ${p.stack.join(' ')} ${(p.topics ?? []).join(' ')} ${p.team.map((m) => m.name).join(' ')}`.toLowerCase().includes(t)) return false
      return true
    })
    if (view === 'trending') return out.sort((a, b) => stars(b) / Math.sqrt(-daysFrom(b.updated) + 2) - stars(a) / Math.sqrt(-daysFrom(a.updated) + 2))
    if (sort === 'stars') out.sort((a, b) => stars(b) - stars(a))
    if (sort === 'updated') out.sort((a, b) => +b.updated - +a.updated)
    if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name))
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, view, cat, school, status, sort, text, savedProjects, applications])

  const matches = useMemo(() => {
    if (!mySkills.length) return []
    return all
      .flatMap((p) => p.openings.map((o) => ({ p, o, hit: skillMatch(mySkills, o.skills) })))
      .filter((x) => x.hit.length && !x.p.mine)
      .sort((a, b) => b.hit.length - a.hit.length)
      .slice(0, 4)
  }, [all, mySkills])

  const views: [View, string][] = [
    ['explore', 'Explore'],
    ['trending', 'Trending'],
    ['looking', 'Looking for people'],
    ['starred', 'Starred'],
    ['mine', 'Yours'],
  ]
  const filtered = !!(cat || school || status || text)
  const clear = () => {
    setCat(null)
    setSchool(null)
    setStatus(null)
    setText('')
  }
  const looking = all.filter((p) => p.openings.length).length

  const facet = <T extends string>(title: string, items: { k: T; label: ReactNode; n: number }[], value: T | null, set: (v: T | null) => void) => (
    <fieldset>
      <legend className="eyebrow mb-2">{title}</legend>
      <ul>
        {items.map((it) => (
          <li key={it.k}>
            <button type="button" aria-pressed={value === it.k} onClick={() => set(value === it.k ? null : it.k)} disabled={!it.n} className={`flex w-full items-center justify-between gap-3 px-2 py-1.5 text-left text-sm transition-colors disabled:opacity-40 ${value === it.k ? 'bg-slate-2 text-gold' : 'hover-gold'}`}>
              <span className="flex min-w-0 items-center gap-2 truncate">{it.label}</span>
              <Num className="text-xs text-mute">{it.n}</Num>
            </button>
          </li>
        ))}
      </ul>
    </fieldset>
  )

  const filters = (
    <div className="grid gap-7">
      {facet(
        'Discipline',
        CATEGORIES.map((c) => ({ k: c, n: all.filter((p) => p.category === c).length, label: <><span aria-hidden className="h-2.5 w-2.5 shrink-0" style={{ background: DOT[c] }} />{c}</> })),
        cat,
        setCat,
      )}
      {facet('School', SCHOOLS.map((s) => ({ k: s, n: all.filter((p) => p.school === s).length, label: shortSchool(s) })), school, setSchool)}
      {facet<ProjectStatus>('Status', (['Building', 'Completed'] as ProjectStatus[]).map((s) => ({ k: s, n: all.filter((p) => p.status === s).length, label: s })), status, setStatus)}
    </div>
  )

  return (
    <div className="pb-16">
      <PageHeader
        scene="05"
        eyebrow="Student projects"
        title={<>What students are <em className="text-gold">building</em>.</>}
        aside={<a className="btn btn-gold" href={href('projects/new')}><Icon name="plus" /> Publish a project</a>}
      >
        Code, films, zines, surveys, legal templates: work from every school. Star what you like; <Num>{looking}</Num> teams are looking for people.
      </PageHeader>

      <div role="tablist" aria-label="Show" className="no-scrollbar mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {views.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)} className={`relative shrink-0 px-3.5 pt-2 pb-3 text-sm transition-colors ${view === k ? 'text-paper' : 'text-mute hover-gold'}`}>
            {l} {k !== 'trending' && <Num className="ml-1 text-xs text-mute">{all.filter((p) => inView(p, k)).length}</Num>}
            {view === k && <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 bg-gold" />}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_18rem]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">{filters}</div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-56">
              <span className="sr-only">Search projects</span>
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute" />
              <input className="field !h-11 pl-10" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Find a project, topic, tool or person" />
            </label>
            {view !== 'trending' && (
              <label>
                <span className="sr-only">Sort</span>
                <select className="field !h-11 !w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                  <option value="stars">Most stars</option>
                  <option value="updated">Recently updated</option>
                  <option value="name">Name</option>
                </select>
              </label>
            )}
          </div>
          <details className="mt-3 border border-line lg:hidden">
            <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm"><Icon name="filter" className="h-4 w-4" /> Filters {filtered && <span className="tag tag-gold">On</span>}</summary>
            <div className="border-t border-line p-3">{filters}</div>
          </details>

          <p aria-live="polite" className="mt-5 flex items-center justify-between border-b border-line pb-3 text-sm text-mute">
            <span><Num className="text-paper">{list.length}</Num> {list.length === 1 ? 'project' : 'projects'}{view === 'trending' ? ', by stars this fortnight' : ''}</span>
            {filtered && <button className="hover-gold underline underline-offset-4" onClick={clear}>Clear filters</button>}
          </p>

          {q.status === 'loading' ? (
            <div className="mt-4"><ListSkeleton rows={5} /></div>
          ) : q.status === 'error' ? (
            <div className="mt-4"><ErrorState onRetry={q.retry} /></div>
          ) : list.length ? (
            <ul className="divide-y divide-line">
              {list.map((p, i) => (
                <Reveal as="li" key={p.id} delay={Math.min(i, 6) * 0.03}>
                  <RepoRow p={p} rank={view === 'trending' ? i + 1 : undefined} />
                </Reveal>
              ))}
            </ul>
          ) : (
            <div className="mt-6">
              <EmptyState
                title={view === 'starred' ? 'Nothing starred yet' : view === 'mine' ? 'No projects of yours yet' : 'No projects match'}
                body={view === 'starred' ? 'Star a project to keep it here and to tell its team you like it.' : view === 'mine' ? 'Publish a project, or apply to join a team, and it shows up here.' : 'Try another discipline or clear the search.'}
                action={view === 'mine' ? <a className="btn btn-gold" href={href('projects/new')}>Publish a project</a> : <button type="button" className="btn" onClick={() => { clear(); setView('explore') }}>Show everything</button>}
              />
            </div>
          )}
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-28 grid gap-6">
            <section className="border border-line">
              <h2 className="eyebrow border-b border-line px-4 py-3">{matches.length ? 'Openings that fit you' : 'Teams looking'}</h2>
              <ul className="divide-y divide-line">
                {(matches.length ? matches.map((m) => ({ p: m.p, role: m.o.role, note: `You have ${m.hit.join(', ')}` })) : all.filter((p) => p.openings.length).slice(0, 4).map((p) => ({ p, role: p.openings[0].role, note: `${p.openings[0].commitment}` }))).map(({ p, role, note }) => (
                  <li key={p.id + role}>
                    <a href={href(`projects/${p.id}`)} className="row-hover block px-4 py-3">
                      <span className="block truncate text-xs text-mute">{owner(p)} / {slug(p.name)}</span>
                      <span className="mt-0.5 block font-display text-lg leading-snug">{role}</span>
                      <span className="mt-0.5 block text-xs text-gold">{note}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
            {!mySkills.length && profile && (
              <p className="border-l-2 border-gold pl-3 text-sm text-mute">Add skills under <a href={href('profile')} className="hover-gold text-paper underline underline-offset-4">You</a> to see openings that fit you.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function RepoRow({ p, rank }: { p: Project; rank?: number }) {
  const { applications } = useStore()
  const s = useStar(p)
  const applied = applications[p.id]
  return (
    <article className="group grid gap-x-5 gap-y-3 py-6 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <h2 className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-sans tracking-normal">
          {rank && <Num className="mr-1 text-sm text-gold">{String(rank).padStart(2, '0')}</Num>}
          <a href={href(`projects/${p.id}`)} className="min-w-0 text-lg leading-snug md:text-xl">
            <span className="text-mute transition-colors group-hover:text-paper">{owner(p)} / </span>
            <span className="font-bold transition-colors hover:text-gold">{slug(p.name)}</span>
          </a>
          <span className="tag !h-5">{p.status}</span>
          {applied ? <span className="tag tag-gold !h-5">Applied</span> : p.mine ? <span className="tag tag-gold !h-5">Yours</span> : null}
        </h2>
        <p className="mt-1 text-sm text-mute">{p.name}</p>
        <p className="mt-2.5 line-clamp-2 max-w-[70ch] leading-relaxed">{p.description}</p>
        {(p.topics ?? []).length > 0 && (
          <p className="mt-3 flex flex-wrap gap-1.5">
            {(p.topics ?? []).map((t) => <span key={t} className="topic">{t}</span>)}
          </p>
        )}
        <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-mute">
          <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5" style={{ background: DOT[p.category] }} />{p.category}</span>
          <span className="inline-flex items-center gap-1.5"><StarIcon filled={s.on} className={`h-3.5 w-3.5 ${s.on ? 'text-gold' : ''}`} /><Num>{s.count}</Num></span>
          <span className="inline-flex items-center gap-2"><Contributors p={p} /> <span>{p.team.length} {p.team.length === 1 ? 'contributor' : 'contributors'}</span></span>
          <span>{shortSchool(p.school)}</span>
          <span>Updated {updatedAgo(p.updated)}</span>
          {p.openings.length > 0 && <span className="text-gold"><Num>{p.openings.length}</Num> open {p.openings.length === 1 ? 'role' : 'roles'}</span>}
        </p>
      </div>
      <div className="sm:pt-1">
        <StarButton p={p} />
      </div>
    </article>
  )
}

/* ---------- One project: a README with an About column ---------- */

type DetailTab = 'readme' | 'openings' | 'team'

function ProjectDetail({ p }: { p: Project }) {
  const { profile, applications, withdraw, deleteProject } = useStore()
  const { studentById } = useCatalog()
  const s = useStar(p)
  const [applying, setApplying] = useState<Opening | null>(null)
  const [tab, setTab] = useState<DetailTab>(p.openings.length && !p.mine ? 'openings' : 'readme')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const applied = applications[p.id]
  const days = p.closes ? daysFrom(p.closes) : null
  const closed = days !== null && days < 0
  const mySkills = profile?.skills ?? []
  const technical = !!p.github

  const tabs: [DetailTab, string, number?][] = [
    ['readme', 'Overview'],
    ['openings', 'Openings', p.openings.length],
    ['team', 'Team', p.team.length],
  ]

  return (
    <article className="pb-16">
      <div className="pt-6">
        <a href={href('projects')} className="hover-gold inline-flex items-center gap-2 text-sm text-mute"><Icon name="arrow-left" /> All projects</a>
      </div>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-5 border-b border-line pb-0">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm text-mute">
            <span aria-hidden className="h-2.5 w-2.5" style={{ background: DOT[p.category] }} /> {p.category} · {shortSchool(p.school)}
          </p>
          <h1 className="mt-2 font-sans text-[clamp(1.6rem,1.2rem+1.6vw,2.6rem)] leading-tight tracking-tight">
            <span className="text-mute">{owner(p)} / </span><span className="font-bold">{slug(p.name)}</span>
          </h1>
          <p className="mt-1 text-mute">{p.name} <span className="tag ml-2 align-middle">{p.status}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StarButton p={p} size="md" />
          <ShareButton path={`projects/${p.id}`} title={p.name} />
        </div>
        <div role="tablist" aria-label="Project" className="no-scrollbar -mb-px flex w-full gap-1 overflow-x-auto">
          {tabs.map(([k, l, n]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`relative shrink-0 px-3.5 pt-2 pb-3 text-sm ${tab === k ? 'text-paper' : 'text-mute hover-gold'}`}>
              {l} {n !== undefined && <Num className="ml-1 text-xs text-mute">{n}</Num>}
              {tab === k && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-gold" />}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          {tab === 'readme' && (
            <section aria-label="Overview" className="border border-line">
              <p className="flex items-center gap-2 border-b border-line px-5 py-3 text-xs font-bold tracking-[0.14em] uppercase text-mute"><Icon name="layers" className="h-4 w-4" /> Readme</p>
              <div className="px-5 py-7 md:px-8">
                <h2 className="text-3xl md:text-4xl">{p.name}</h2>
                <p className="mt-4 max-w-[65ch] text-lg leading-relaxed">{p.description}</p>
                <h3 className="mt-9 border-b border-line pb-2 font-sans text-base font-bold">{technical ? 'Built with' : 'Made with'}</h3>
                <p className="mt-3 flex flex-wrap gap-1.5">{p.stack.map((x) => <span key={x} className="tag">{x}</span>)}</p>
                <h3 className="mt-9 border-b border-line pb-2 font-sans text-base font-bold">Where it stands</h3>
                <p className="mt-3 max-w-[65ch] leading-relaxed text-mute">
                  {p.status === 'Completed' ? 'Finished and in use.' : 'Being built now.'} Last updated {updatedAgo(p.updated)} by a team of {p.team.length} from the {p.school}.
                  {p.openings.length > 0 && <> The team is looking for {p.openings.map((o) => o.role.toLowerCase()).join(' and ')}.</>}
                </p>
                {p.openings.length > 0 && (
                  <button type="button" className="btn btn-gold mt-6" onClick={() => setTab('openings')}>See {p.openings.length} open {p.openings.length === 1 ? 'role' : 'roles'} <Icon name="arrow" className="h-4 w-4" /></button>
                )}
              </div>
            </section>
          )}

          {tab === 'openings' && (
            <section aria-label="Openings">
              {p.openings.length === 0 ? (
                <EmptyState title="No open roles" body="This team isn’t looking for anyone right now. Star the project to keep it close." action={<StarButton p={p} />} />
              ) : (
                <>
                  {p.closes && (
                    <p className="mb-4 text-sm text-mute">
                      {closed ? 'Applications closed on ' : 'Applications close '}
                      <span className="text-paper"><Num>{longDate(p.closes)}</Num></span>
                      {!closed && days !== null && <> · {days === 0 ? 'today' : <>in <Num>{days}</Num> {days === 1 ? 'day' : 'days'}</>}</>}
                    </p>
                  )}
                  <ul className="divide-y divide-line border-y border-line">
                    {p.openings.map((o) => {
                      const hit = skillMatch(mySkills, o.skills)
                      const mine = applied?.role === o.role
                      return (
                        <li key={o.role} className="flex flex-wrap items-center justify-between gap-4 py-5">
                          <div className="min-w-0">
                            <h3 className="font-display text-2xl">{o.role}</h3>
                            <p className="mt-1 text-sm text-mute">{o.commitment}</p>
                            <p className="mt-3 flex flex-wrap gap-1.5">{o.skills.map((x) => <span key={x} className={hit.includes(x) ? 'tag tag-gold' : 'tag'}>{x}</span>)}</p>
                          </div>
                          {p.mine ? null : mine ? (
                            <div className="flex items-center gap-3">
                              <span className="tag tag-gold">Applied</span>
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
                  {p.openings.some((o) => skillMatch(mySkills, o.skills).length) && <p className="mt-3 text-sm text-mute">Skills in gold are on your profile.</p>}
                </>
              )}
            </section>
          )}

          {tab === 'team' && (
            <ul aria-label="Team" className="grid gap-px border border-line bg-line sm:grid-cols-2">
              {p.team.map((m) => {
                const st = m.studentId ? studentById(m.studentId) : undefined
                const inner = (
                  <>
                    <Monogram text={m.name} />
                    <span className="min-w-0">
                      <span className="block truncate">{m.name}</span>
                      <span className="block truncate text-sm text-mute">{m.role}</span>
                    </span>
                  </>
                )
                return <li key={m.name} className="bg-ink">{st ? <a href={href(`people/${st.id}`)} className="row-hover flex items-center gap-4 p-4">{inner}</a> : <div className="flex items-center gap-4 p-4">{inner}</div>}</li>
              })}
            </ul>
          )}
        </div>

        <aside className="space-y-7 lg:sticky lg:top-24 lg:self-start">
          <section>
            <h2 className="font-sans text-base font-bold">About</h2>
            <p className="mt-2 leading-relaxed text-mute">{p.description}</p>
            {(p.demo || p.github) && (
              <ul className="mt-4 space-y-2 text-sm">
                {p.demo && <li><a className="hover-gold inline-flex items-center gap-2 text-gold" href={p.demo} target="_blank" rel="noreferrer"><Icon name="link" className="h-4 w-4" /> {p.demo.replace(/^https?:\/\//, '')}</a></li>}
                {p.github && <li><a className="hover-gold inline-flex items-center gap-2" href={p.github} target="_blank" rel="noreferrer"><Icon name="github" className="h-4 w-4" /> Source on GitHub</a></li>}
              </ul>
            )}
            {(p.topics ?? []).length > 0 && <p className="mt-4 flex flex-wrap gap-1.5">{(p.topics ?? []).map((t) => <span key={t} className="topic">{t}</span>)}</p>}
            <ul className="mt-5 space-y-2 text-sm text-mute">
              <li className="flex items-center gap-2"><StarIcon filled={s.on} className={`h-4 w-4 ${s.on ? 'text-gold' : ''}`} /> <Num className="text-paper">{s.count}</Num> stars</li>
              <li className="flex items-center gap-2"><Icon name="users" className="h-4 w-4" /> <Num className="text-paper">{p.team.length}</Num> contributors</li>
              <li className="flex items-center gap-2"><Icon name="clock" className="h-4 w-4" /> Updated {updatedAgo(p.updated)}</li>
              <li className="flex items-center gap-2"><span aria-hidden className="mx-[3px] h-2.5 w-2.5" style={{ background: DOT[p.category] }} /> {p.category}</li>
            </ul>
          </section>
          <section className="border-t border-line pt-6">
            <h2 className="font-sans text-base font-bold">Contributors <Num className="ml-1 text-sm text-mute">{p.team.length}</Num></h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {p.team.map((m) => <li key={m.name} title={`${m.name}, ${m.role}`}><Monogram text={m.name} size="sm" /></li>)}
            </ul>
          </section>
          {p.mine && (
            <section className="border-t border-line pt-6">
              {confirmDelete ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="w-full text-sm">Take this project down? Applications go with it.</p>
                  <button type="button" className="btn btn-sm" onClick={() => setConfirmDelete(false)}>Keep it</button>
                  <button type="button" className="btn btn-sm border-[#e0795f] text-[#e0795f]" onClick={() => { deleteProject(p.id); go('projects') }}>Take down</button>
                </div>
              ) : (
                <button type="button" className="btn w-full" onClick={() => setConfirmDelete(true)}><Icon name="trash" className="h-4 w-4" /> Take this project down</button>
              )}
            </section>
          )}
        </aside>
      </div>

      {applying && <ApplyDialog p={p} o={applying} onClose={() => setApplying(null)} />}
    </article>
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
      stars: 0,
      topics: stack.split(',').map((s) => s.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean).slice(0, 4),
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
          <label className="eyebrow" htmlFor="pst">Made with</label>
          <p className="mt-1 text-sm text-mute">Tools, methods or materials, separated by commas. For example: React, Python or Figma; or interviews, risograph, DaVinci Resolve</p>
          <input id="pst" className="field mt-2" value={stack} onChange={(e) => setStack(e.target.value)} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="field-wrap">
            <label className="eyebrow" htmlFor="pg">Source code on GitHub (optional, for software)</label>
            <input id="pg" type="url" className="field mt-2" placeholder="https://github.com/…" value={github} onChange={(e) => setGithub(e.target.value)} />
            <p className="field-error">Error: enter a full link starting with https://</p>
          </div>
          <div className="field-wrap">
            <label className="eyebrow" htmlFor="pdm">Where to see it (optional): demo, video, PDF or portfolio</label>
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
