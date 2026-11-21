import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { LinksFields, linksValid, normaliseLink } from '../components/LinksFields'
import { blankLinks, clearPending, pendingIdentity } from '../components/SignIn'
import { DOLLY, Icon, Logo, Num } from '../components/ui'
import { CATEGORIES, SCHOOLS, type Category, type Links, type Profile, type School } from '../data/types'
import { go } from '../lib/router'
import { useStore } from '../lib/store'

/**
 * The only setup screen, shown once after Google sign-in (fixes F4, F7).
 * Google gives us the name and email; those are fixed here. Everything else starts
 * empty and is the student's to fill in. Nothing is inferred from the address.
 */
export default function Welcome() {
  const { profile, setProfile } = useStore()
  const reduce = useReducedMotion()
  const [who] = useState(() => pendingIdentity() ?? (profile ? { name: profile.name, email: profile.email } : null))
  const [year, setYear] = useState<Profile['year'] | null>(profile?.year ?? null)
  const [school, setSchool] = useState<School | ''>(profile?.school ?? '')
  const [interests, setInterests] = useState<Category[]>(profile?.interests ?? [])
  const [links, setLinks] = useState<Links>(profile?.links ?? blankLinks)
  const [tried, setTried] = useState(false)

  useEffect(() => {
    if (profile && profile.name !== 'Guest' && profile.year && profile.school && !pendingIdentity()) {
      go('home')
    } else if (!who) {
      go('')
    }
  }, [profile, who])

  if (!who) return null
  const first = who.name.split(' ')[0]

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (!year || !school || !linksValid(links)) return
    setProfile({
      skills: [],
      openToCollaborate: false,
      bio: '',
      role: 'Student',
      ...profile,
      name: who.name,
      email: who.email,
      year,
      school,
      interests,
      links: { github: normaliseLink(links.github), linkedin: normaliseLink(links.linkedin), portfolio: normaliseLink(links.portfolio) },
    })
    clearPending()
    go('home')
  }

  const toggle = (c: Category) => setInterests((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))
  const enter = (i: number) => (reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: DOLLY, delay: 0.1 + i * 0.08 } })

  return (
    <div className="min-h-[100dvh] md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="border-b border-line-strong md:sticky md:top-0 md:flex md:h-[100dvh] md:flex-col md:justify-between md:border-r md:border-b-0 md:bg-slate-2">
        <div className="wrap flex h-16 items-center md:h-auto md:px-10 md:pt-10">
          <Logo className="h-11 md:h-16" />
        </div>
        <div className="wrap pt-8 pb-8 md:px-10 md:pb-14">
          <p className="flex items-center gap-3">
            <span className="eyebrow">Signed in with Google</span>
          </p>
          <h1 className="mt-4 text-[clamp(2.3rem,1.8rem+2.4vw,4rem)] leading-[1.02]">
            Welcome, <span className="italic text-gold">{first}.</span>
          </h1>
          <p className="mt-4 max-w-[40ch] text-mute">
            Tell us your year and school, and what you’d like to see first. You can change all of it later under You.
          </p>
        </div>
      </aside>

      <form onSubmit={submit} noValidate className="wrap max-w-2xl py-8 md:px-12 md:py-16">
        <motion.dl className="grid gap-px border border-line bg-line sm:grid-cols-2" {...enter(0)}>
          <div className="bg-ink px-4 py-3">
            <dt className="eyebrow">Name</dt>
            <dd className="mt-1 flex items-center justify-between gap-2 font-semibold">
              {who.name}
              <span className="text-xs font-normal text-mute">From Google</span>
            </dd>
          </div>
          <div className="bg-ink px-4 py-3">
            <dt className="eyebrow">Email</dt>
            <dd className="mt-1 truncate">{who.email}</dd>
          </div>
        </motion.dl>

        <motion.fieldset className="mt-8" {...enter(0)} aria-describedby={tried && !year ? 'year-err' : undefined}>
          <legend className="eyebrow">Year of study</legend>
          <div className="mt-3 grid grid-cols-4 border border-line">
            {([1, 2, 3, 4] as const).map((y) => (
              <button
                key={y}
                type="button"
                aria-pressed={year === y}
                onClick={() => setYear(y)}
                className={`h-12 border-l border-line first:border-l-0 ${year === y ? 'bg-paper text-ink' : 'hover-gold'}`}
              >
                <Num className="text-lg font-semibold">{y}</Num>
              </button>
            ))}
          </div>
          {tried && !year && <p id="year-err" className="mt-2 text-sm text-[#e0795f]">Error: choose your year.</p>}
        </motion.fieldset>

        <motion.div className="mt-8" {...enter(1)}>
          <label htmlFor="school" className="eyebrow">School</label>
          <select
            id="school"
            className="field mt-3"
            value={school}
            aria-invalid={tried && !school}
            aria-describedby={tried && !school ? 'school-err' : undefined}
            onChange={(e) => setSchool(e.target.value as School)}
          >
            <option value="" disabled>Choose your school</option>
            {SCHOOLS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {tried && !school && <p id="school-err" className="mt-2 text-sm text-[#e0795f]">Error: choose your school.</p>}
        </motion.div>

        <motion.fieldset className="mt-8" {...enter(2)}>
          <legend className="eyebrow">What should we put first?</legend>
          <p className="mt-1 text-sm text-mute">Pick any. Events and teams in these appear at the top of Today.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={interests.includes(c)} onClick={() => toggle(c)}>
                {interests.includes(c) && <Icon name="check" className="h-3.5 w-3.5" />} {c}
              </button>
            ))}
          </div>
        </motion.fieldset>

        <motion.fieldset className="mt-10 border-t border-line pt-8" {...enter(3)}>
          <legend className="sr-only">Links</legend>
          <p className="eyebrow">Links clubs ask for</p>
          <p className="mt-1 mb-5 text-sm text-mute">Add them once. When a club or team asks, they are attached for you.</p>
          <LinksFields value={links} onChange={setLinks} />
        </motion.fieldset>

        <motion.div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-8" {...enter(4)}>
          <button type="submit" className="btn btn-gold">
            <span>Go to my week</span>
            <Icon name="arrow" className="h-4 w-4" />
          </button>
          <button type="button" className="btn" onClick={() => { clearPending(); go('') }}>Cancel</button>
        </motion.div>
      </form>
    </div>
  )
}
