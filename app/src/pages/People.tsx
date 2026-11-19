import { useMemo, useState } from 'react'
import { EmptyState, ErrorState, Icon, ListSkeleton, Monogram, Num, PageHeader, Reveal, SectionTitle } from '../components/ui'
import { CATEGORIES, SCHOOLS, type Category, type School, type Student } from '../data/types'
import { meAsStudent, skillMatch, useCatalog } from '../lib/catalog'
import { href } from '../lib/router'
import { useQuery, useStore } from '../lib/store'

export default function People({ id }: { id?: string }) {
  const { students, studentById } = useCatalog()
  const { profile } = useStore()
  if (id) {
    const s = id === 'me' && profile ? meAsStudent(profile) : studentById(id)
    if (!s)
      return (
        <div className="py-16">
          <EmptyState title="We can’t find that student" body="They may have hidden their profile." action={<a className="btn" href={href('people')}>Everyone</a>} />
        </div>
      )
    return <Person s={s} />
  }
  return <Directory students={students} />
}

/** Student directory: find people by skill, school or interest. */
function Directory({ students }: { students: Student[] }) {
  const q = useQuery(students)
  const { profile } = useStore()
  const [text, setText] = useState('')
  const [school, setSchool] = useState<School | ''>('')
  const [cat, setCat] = useState<Category | null>(null)
  const [open, setOpen] = useState(false)

  const list = useMemo(() => {
    const t = text.trim().toLowerCase()
    return (q.data ?? []).filter((s) => {
      if (school && s.school !== school) return false
      if (cat && !s.interests.includes(cat)) return false
      if (open && !s.openToCollaborate) return false
      if (t && !`${s.name} ${s.skills.join(' ')} ${s.bio}`.toLowerCase().includes(t)) return false
      return true
    })
  }, [q.data, text, school, cat, open])

  return (
    <div className="pb-16">
      <PageHeader scene="06" eyebrow="People" title={<>Find someone to <em className="text-gold">build with</em>.</>}>
        Search RVU students by skill, school or interest. <Num>{(q.data ?? []).filter((s) => s.openToCollaborate).length}</Num> are open to new projects.
        {profile && !profile.skills.length && (
          <> Add your own skills under <a className="hover-gold underline" href={href('profile')}>You</a> so others can find you.</>
        )}
      </PageHeader>

      <div className="mt-8 grid gap-3 md:grid-cols-[1fr_16rem_auto] md:items-end">
        <label className="relative block">
          <span className="sr-only">Search people</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute" />
          <input className="field pl-10" type="search" placeholder="Try “React”, “Figma” or a name" value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <label className="block">
          <span className="sr-only">School</span>
          <select className="field" value={school} onChange={(e) => setSchool(e.target.value as School | '')}>
            <option value="">Every school</option>
            {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <button type="button" className="chip h-11" aria-pressed={open} onClick={() => setOpen(!open)}>
          Open to collaborate
        </button>
      </div>
      <div role="group" aria-label="Interest" className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        <button type="button" className="chip shrink-0" aria-pressed={!cat} onClick={() => setCat(null)}>Any interest</button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className="chip shrink-0" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>{c}</button>
        ))}
      </div>

      <div className="mt-8">
        {q.status === 'loading' ? (
          <ListSkeleton rows={5} />
        ) : q.status === 'error' ? (
          <ErrorState onRetry={q.retry} />
        ) : list.length ? (
          <ul className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
            {list.map((s, i) => {
              const hit = text ? skillMatch([text.trim()], s.skills) : []
              return (
                <Reveal as="li" key={s.id} delay={Math.min(i, 8) * 0.03} className="min-w-0 bg-ink">
                  <a href={href(`people/${s.id}`)} className="row-hover flex h-full flex-col gap-4 p-5">
                    <div className="flex items-center gap-4">
                      <Monogram text={s.name} />
                      <div className="min-w-0">
                        <p className="truncate font-display text-xl">{s.name}</p>
                        <p className="truncate text-sm text-mute">Year {s.year} · {s.school.replace('School of ', '')}</p>
                      </div>
                    </div>
                    <p className="line-clamp-2 text-sm text-mute">{s.bio}</p>
                    <p className="mt-auto flex flex-wrap gap-1.5">
                      {s.skills.slice(0, 4).map((k) => (
                        <span key={k} className={hit.includes(k) ? 'tag tag-gold' : 'tag'}>{k}</span>
                      ))}
                      {s.openToCollaborate && <span className="tag tag-teal">Open</span>}
                    </p>
                  </a>
                </Reveal>
              )
            })}
          </ul>
        ) : (
          <EmptyState
            title="No one matches"
            body="Try a broader skill, or clear the filters."
            action={<button type="button" className="btn" onClick={() => { setText(''); setSchool(''); setCat(null); setOpen(false) }}>Clear filters</button>}
          />
        )}
      </div>
    </div>
  )
}

function Person({ s }: { s: Student }) {
  const { projects, clubById } = useCatalog()
  const work = projects.filter((p) => p.team.some((m) => m.studentId === s.id))
  const links = [
    s.links.github && { icon: 'github' as const, label: 'GitHub', url: s.links.github },
    s.links.linkedin && { icon: 'linkedin' as const, label: 'LinkedIn', url: s.links.linkedin },
    s.links.portfolio && { icon: 'link' as const, label: 'Portfolio', url: s.links.portfolio },
  ].filter(Boolean) as { icon: 'github' | 'linkedin' | 'link'; label: string; url: string }[]

  return (
    <article className="pb-16">
      <div className="pt-6">
        <a href={href('people')} className="hover-gold inline-flex items-center gap-2 text-sm text-mute">
          <Icon name="arrow-left" /> Everyone
        </a>
      </div>
      <PageHeader
        scene="06"
        eyebrow={`Year ${s.year} · ${s.school}`}
        title={s.name}
        aside={<Monogram text={s.name} size="lg" gold />}
      >
        {s.bio || 'No bio yet.'}
      </PageHeader>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="skills">
            <SectionTitle id="skills" title="Skills" count={s.skills.length} />
            {s.skills.length ? (
              <p className="flex flex-wrap gap-2">{s.skills.map((k) => <span key={k} className="tag">{k}</span>)}</p>
            ) : (
              <p className="text-mute">No skills listed yet.</p>
            )}
          </section>
          <section aria-labelledby="work">
            <SectionTitle id="work" title="Projects" count={work.length} />
            {work.length ? (
              <ul className="border-t border-line">
                {work.map((p) => (
                  <li key={p.id} className="border-b border-line">
                    <a href={href(`projects/${p.id}`)} className="row-hover flex items-center justify-between gap-4 py-4">
                      <span className="min-w-0">
                        <span className="block truncate font-display text-xl">{p.name}</span>
                        <span className="block text-sm text-mute">{p.team.find((m) => m.studentId === s.id)?.role}</span>
                      </span>
                      <Icon name="arrow" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-mute">Not on a listed project yet.</p>
            )}
          </section>
        </div>
        <aside className="space-y-8">
          {s.openToCollaborate && (
            <p className="border border-line p-4 text-sm">
              <span className="tag tag-teal">Open to collaborate</span>
              <span className="mt-2 block text-mute">Happy to hear about new projects.</span>
            </p>
          )}
          {links.length > 0 && (
            <div className="flex flex-col gap-2">
              {links.map((l) => (
                <a key={l.label} className="btn" href={l.url} target="_blank" rel="noreferrer">
                  <Icon name={l.icon} /> {l.label} <Icon name="external" />
                </a>
              ))}
            </div>
          )}
          {s.clubs.length > 0 && (
            <div>
              <p className="eyebrow">Clubs</p>
              <ul className="mt-3 space-y-2">
                {s.clubs.map((c) => {
                  const club = clubById(c)
                  return club ? (
                    <li key={c}><a className="hover-gold" href={href(`clubs/${c}`)}>{club.name}</a></li>
                  ) : null
                })}
              </ul>
            </div>
          )}
          <div>
            <p className="eyebrow">Interests</p>
            <p className="mt-3 flex flex-wrap gap-1.5">{s.interests.map((c) => <span key={c} className="tag">{c}</span>)}</p>
          </div>
        </aside>
      </div>
    </article>
  )
}
