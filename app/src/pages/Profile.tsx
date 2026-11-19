import { useState } from 'react'
import { LinksFields, linksValid, normaliseLink } from '../components/LinksFields'
import { EmptyState, Icon, Monogram, Num, PageHeader } from '../components/ui'
import { useCatalog } from '../lib/catalog'
import { CATEGORIES, SCHOOLS, type Category, type Links } from '../data/types'
import { initials } from '../lib/identity'
import { go, href } from '../lib/router'
import { useStore } from '../lib/store'

/** You. Everything the app knows about you, editable in one place. */
export default function Profile() {
  const store = useStore()
  const { allEvents: events, projects, clubById } = useCatalog()
  const { profile, savedEvents, registered, followedClubs, applications, joinRequests } = store
  const [links, setL] = useState<Links>(profile?.links ?? { github: '', linkedin: '', portfolio: '' })
  const [saved, setSaved] = useState(false)
  const [skill, setSkill] = useState('')
  const [bio, setBio] = useState(profile?.bio ?? '')

  if (!profile || !profile.email)
    return (
      <div className="py-16">
        <EmptyState title="You’re browsing as a guest" body="Sign in with your RV University email to keep a profile, follow clubs and apply to teams." action={<a className="btn btn-gold" href="#/">Sign in</a>} />
      </div>
    )

  const toggleInterest = (c: Category) => store.setInterests(profile.interests.includes(c) ? profile.interests.filter((x) => x !== c) : [...profile.interests, c])

  const saveLinks = (e: React.FormEvent) => {
    e.preventDefault()
    if (!linksValid(links)) return
    store.setLinks({ github: normaliseLink(links.github), linkedin: normaliseLink(links.linkedin), portfolio: normaliseLink(links.portfolio) })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2400)
  }

  const skills = profile.skills ?? []
  const addSkill = (e: React.FormEvent) => {
    e.preventDefault()
    const k = skill.trim().replace(/\s+/g, ' ')
    if (k && !skills.some((x) => x.toLowerCase() === k.toLowerCase())) store.setProfile({ ...profile, skills: [...skills, k].slice(0, 15) })
    setSkill('')
  }

  const myEvents = events.filter((e) => registered.includes(e.id) || savedEvents.includes(e.id))
  const myApps = Object.entries(applications).map(([id, a]) => ({ p: projects.find((x) => x.id === id)!, ...a })).filter((x) => x.p)

  return (
    <>
      <PageHeader scene="07" eyebrow="You" title={profile.name} aside={<Monogram text={initials(profile.name)} size="lg" gold />}>
        <p>{profile.email}</p>
      </PageHeader>

      <dl className="grid grid-cols-2 border-b border-line md:grid-cols-4">
        {[
          ['Events', myEvents.length],
          ['Clubs', followedClubs.length],
          ['Applications', myApps.length],
          ['Join requests', Object.keys(joinRequests).length],
        ].map(([k, v], i) => (
          <div key={k} className={`py-4 ${i % 2 ? 'border-l border-line pl-4' : ''} ${i === 2 ? 'md:border-l md:border-line md:pl-4' : ''} ${i > 1 ? 'border-t border-line md:border-t-0' : ''}`}>
            <dt className="eyebrow !text-[0.6rem]">{k}</dt>
            <dd className="num mt-1 text-2xl">{String(v).padStart(2, '0')}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="space-y-12">
          <section aria-labelledby="about">
            <h2 id="about" className="text-2xl">About you</h2>
            <div className="mt-5 grid gap-5">
              <div>
                <p className="eyebrow">Year</p>
                <div role="group" aria-label="Year" className="mt-2 grid grid-cols-4 border border-line">
                  {([1, 2, 3, 4] as const).map((y) => (
                    <button key={y} aria-pressed={profile.year === y} onClick={() => store.setProfile({ ...profile, year: y })} className={`h-11 border-l border-line first:border-l-0 ${profile.year === y ? 'bg-paper text-ink' : 'hover-gold'}`}>
                      <Num>{y}</Num>
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="eyebrow">School</span>
                <select className="field mt-2" value={profile.school} onChange={(e) => store.setProfile({ ...profile, school: e.target.value as typeof profile.school })}>
                  {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section aria-labelledby="interests">
            <h2 id="interests" className="text-2xl">Interests</h2>
            <p className="mt-1 text-sm text-mute">These decide what Today picks for you.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c} className="chip" aria-pressed={profile.interests.includes(c)} onClick={() => toggleInterest(c)}>{c}</button>
              ))}
            </div>
          </section>

          <section aria-labelledby="skills">
            <h2 id="skills" className="text-2xl">Skills and bio</h2>
            <p className="mt-1 text-sm text-mute">Project leads see these, and we use your skills to suggest openings.</p>
            <form className="mt-4 flex gap-2" onSubmit={addSkill}>
              <label className="sr-only" htmlFor="skill-input">Add a skill</label>
              <input id="skill-input" className="field" value={skill} maxLength={30} onChange={(e) => setSkill(e.target.value)} placeholder="e.g. React, Figma, Public speaking" />
              <button className="btn shrink-0" type="submit" disabled={!skill.trim()}><Icon name="plus" /> Add</button>
            </form>
            {skills.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Your skills">
                {skills.map((k) => (
                  <li key={k}>
                    <button type="button" className="chip" aria-label={`Remove ${k}`} onClick={() => store.setProfile({ ...profile, skills: skills.filter((x) => x !== k) })}>
                      {k} <Icon name="close" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="mt-5 block">
              <span className="eyebrow">Bio</span>
              <textarea className="field mt-2 min-h-24" maxLength={240} value={bio} onChange={(e) => setBio(e.target.value)} onBlur={() => bio !== profile.bio && store.setProfile({ ...profile, bio: bio.trim() })} placeholder="One or two lines on what you like building." />
            </label>
            <label className="mt-4 flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="h-5 w-5 accent-[var(--color-gold)]" checked={!!profile.openToCollaborate} onChange={(e) => store.setProfile({ ...profile, openToCollaborate: e.target.checked })} />
              <span>Open to collaborate <span className="text-sm text-mute">(shows you in People searches)</span></span>
            </label>
            <a className="hover-gold mt-4 inline-flex items-center gap-2 text-sm" href={href('people/me')}>See how others see you <Icon name="arrow" /></a>
          </section>

          <section aria-labelledby="links">
            <h2 id="links" className="text-2xl">Links</h2>
            <p className="mt-1 text-sm text-mute">Clubs and project leads ask for these. They’re attached when you apply.</p>
            <form className="mt-5" onSubmit={saveLinks} noValidate={false}>
              <LinksFields value={links} onChange={setL} />
              <div className="mt-5 flex items-center gap-4">
                <button className="btn btn-gold" type="submit">Save links</button>
                <span role="status" className="text-sm text-gold">{saved ? 'Saved.' : ''}</span>
              </div>
            </form>
          </section>
        </div>

        <div className="space-y-12">
          <nav aria-label="Your pages" className="grid grid-cols-2 gap-px border border-line bg-line">
            {[
              ['saved', 'Saved', 'bookmark'],
              ['calendar', 'Calendar', 'calendar'],
              ['host', 'Run a club', 'users'],
              ['notices', 'Notices', 'bell'],
            ].map(([to, label, icon]) => (
              <a key={to} href={href(to)} className="row-hover flex items-center justify-between gap-3 bg-ink p-4">
                <span className="flex items-center gap-3"><Icon name={icon as 'bookmark'} /> {label}</span>
                <Icon name="arrow" />
              </a>
            ))}
          </nav>

          <section aria-labelledby="my-events">
            <h2 id="my-events" className="text-2xl">Your events</h2>
            {myEvents.length ? (
              <ul className="mt-4 border-t border-line">
                {myEvents.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-4 border-b border-line py-3">
                    <a href={href(`events/${e.id}`)} className="hover-gold min-w-0 truncate">{e.title}</a>
                    <span className={`tag shrink-0 ${registered.includes(e.id) ? 'tag-gold' : ''}`}>{registered.includes(e.id) ? 'Going' : 'Saved'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-mute">Save or register for an event and it shows here.</p>
            )}
          </section>

          <section aria-labelledby="my-apps">
            <h2 id="my-apps" className="text-2xl">Applications</h2>
            {myApps.length ? (
              <ul className="mt-4 border-t border-line">
                {myApps.map(({ p, role }) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 border-b border-line py-3">
                    <a href={href(`projects/${p.id}`)} className="hover-gold min-w-0 truncate">{p.name}</a>
                    <span className="tag tag-gold shrink-0">{role}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-mute">No applications yet. <a className="text-gold underline underline-offset-4" href={href('projects')}>See teams hiring</a>.</p>
            )}
          </section>

          <section aria-labelledby="my-clubs">
            <h2 id="my-clubs" className="text-2xl">Following</h2>
            {followedClubs.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {followedClubs.map((id) => clubById(id)).filter(Boolean).map((c) => (
                  <li key={c!.id}><a className="chip" href={href(`clubs/${c!.id}`)}>{c!.name}{joinRequests[c!.id] && <Icon name="check" className="h-3.5 w-3.5 text-gold" />}</a></li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-mute">Follow clubs to see their events first.</p>
            )}
          </section>

          <section aria-labelledby="account" className="border-t border-line pt-8">
            <h2 id="account" className="text-2xl">Account</h2>
            <p className="mt-1 text-sm text-mute">This prototype keeps everything in your browser. Signing out clears it.</p>
            <button className="btn mt-4" onClick={() => { store.reset(); go('') }}>Sign out</button>
          </section>
        </div>
      </div>
    </>
  )
}
