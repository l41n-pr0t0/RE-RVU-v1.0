import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { LinksFields, linksValid, normaliseLink } from '../components/LinksFields'
import { DOLLY, Icon, Logo, Num } from '../components/ui'
import { CATEGORIES, SCHOOLS, type Category, type Links, type Profile, type School } from '../data/types'
import { go } from '../lib/router'
import { useStore } from '../lib/store'

/**
 * Sc. 01: the only setup screen, shown once after sign-in (fixes F4, F7).
 * The name is already known from the email, so this asks for what isn't.
 */
export default function Welcome() {
  const { profile, setProfile } = useStore()
  const reduce = useReducedMotion()
  const [year, setYear] = useState<Profile['year']>(profile?.year ?? 1)
  const [school, setSchool] = useState<School>(profile?.school ?? SCHOOLS[0])
  const [interests, setInterests] = useState<Category[]>(profile?.interests ?? [])
  const [links, setLinks] = useState<Links>(profile?.links ?? { github: '', linkedin: '', portfolio: '' })

  if (!profile) return null
  const first = profile.name.split(' ')[0]

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!linksValid(links)) return
    setProfile({
      ...profile,
      year,
      school,
      interests,
      links: { github: normaliseLink(links.github), linkedin: normaliseLink(links.linkedin), portfolio: normaliseLink(links.portfolio) },
    })
    go('home')
  }

  const toggle = (c: Category) => setInterests((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))
  const enter = (i: number) => (reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: DOLLY, delay: 0.1 + i * 0.08 } })

  return (
    <div className="min-h-[100dvh] md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="border-b border-line-strong md:sticky md:top-0 md:flex md:h-[100dvh] md:flex-col md:justify-between md:border-r md:border-b-0 md:bg-slate-2">
        <div className="wrap flex h-14 items-center md:h-auto md:px-10 md:pt-10">
          <Logo className="h-8 md:h-11" />
        </div>
        <div className="wrap pt-8 pb-8 md:px-10 md:pb-14">
          <p className="flex items-center gap-3">
            <span className="slate-no">Sc. 01</span>
            <span className="h-px w-8 bg-line-strong" aria-hidden />
            <span className="eyebrow">One step</span>
          </p>
          <h1 className="mt-4 text-[clamp(2.3rem,1.8rem+2.4vw,4rem)] leading-[1.02]">
            Welcome, <span className="italic text-gold">{first}.</span>
          </h1>
          <p className="mt-4 max-w-[40ch] text-mute">
            We read your name from your RVU email. Confirm the rest and choose what you care about. You can change any of it later under You.
          </p>
        </div>
      </aside>

      <form onSubmit={submit} className="wrap max-w-2xl py-8 md:px-12 md:py-16">
        <motion.fieldset {...enter(0)}>
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
        </motion.fieldset>

        <motion.div className="mt-8" {...enter(1)}>
          <label htmlFor="school" className="eyebrow">School</label>
          <select id="school" className="field mt-3" value={school} onChange={(e) => setSchool(e.target.value as School)}>
            {SCHOOLS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
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
            <span>Open today’s call sheet</span>
            <Icon name="arrow" className="h-4 w-4" />
          </button>
          <button type="button" className="btn" onClick={() => go('home')}>Skip for now</button>
        </motion.div>
      </form>
    </div>
  )
}
