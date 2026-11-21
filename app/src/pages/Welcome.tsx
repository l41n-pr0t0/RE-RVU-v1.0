import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { LinksFields, linksValid, normaliseLink } from '../components/LinksFields'
import { blankLinks, clearPending, pendingIdentity } from '../components/SignIn'
import { DOLLY, Icon, Logo, Num } from '../components/ui'
import { CATEGORIES, SCHOOLS, type Category, type Links, type Profile, type School } from '../data/types'
import { identityFromEmail } from '../lib/identity'
import { go } from '../lib/router'
import { useStore } from '../lib/store'

function defaultInterestsFor(school?: School): Category[] {
  if (!school) return ['Technology']
  if (school.includes('Computer Science')) return ['Technology']
  if (school.includes('Design')) return ['Design', 'Technology']
  if (school.includes('Business')) return ['Business']
  if (school.includes('Law')) return ['Social impact', 'Business']
  if (school.includes('Economics')) return ['Business', 'Social impact']
  if (school.includes('Film')) return ['Media', 'Culture']
  if (school.includes('Liberal Arts')) return ['Culture', 'Social impact']
  return ['Technology']
}

export default function Welcome() {
  const { profile, setProfile } = useStore()
  const reduce = useReducedMotion()

  const who = useMemo(
    () => pendingIdentity() ?? (profile ? { name: profile.name, email: profile.email } : null),
    [profile],
  )

  // Auto-extract details from RVU email via regex
  const extracted = useMemo(() => (who?.email ? identityFromEmail(who.email) : null), [who?.email])

  const initialYear = profile?.year ?? extracted?.year ?? 1
  const initialSchool = profile?.school ?? extracted?.school ?? SCHOOLS[0]
  const initialInterests =
    profile?.interests && profile.interests.length > 0
      ? profile.interests
      : defaultInterestsFor(initialSchool)

  const [year, setYear] = useState<Profile['year']>(initialYear)
  const [school, setSchool] = useState<School>(initialSchool)
  const [interests, setInterests] = useState<Category[]>(initialInterests)
  const [links, setLinks] = useState<Links>(profile?.links ?? blankLinks)
  const [showLinks, setShowLinks] = useState(() => Boolean(profile?.links?.github || profile?.links?.linkedin || profile?.links?.portfolio))
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
  const batchMatch = who.email.match(/(\d{2,4})@/)?.[1] || who.email.match(/(\d{2})$/)?.[1]

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
      name: who.name, // Name kept fixed from Google
      email: who.email,
      year,
      school,
      interests,
      links: {
        github: normaliseLink(links.github),
        linkedin: normaliseLink(links.linkedin),
        portfolio: normaliseLink(links.portfolio),
      },
    })
    clearPending()
    go('home')
  }

  const toggle = (c: Category) => setInterests((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))
  const enter = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: DOLLY, delay: 0.05 + i * 0.06 },
        }

  return (
    <div className="min-h-[100dvh] bg-ink text-paper flex flex-col lg:grid lg:grid-cols-[minmax(0,4.5fr)_minmax(0,7.5fr)]">
      {/* Left Identity Hero Sidebar */}
      <aside className="border-b border-line lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:flex-col lg:justify-between lg:border-r lg:border-b-0 bg-slate-2 p-6 md:p-10 lg:p-12">
        <div>
          <a href="#/" aria-label="RVU Connect home" className="inline-block">
            <Logo className="h-10 md:h-12" />
          </a>
        </div>

        <div className="py-8 lg:py-0">
          <div className="inline-flex items-center gap-2 border border-gold/40 bg-gold/10 px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.14em] text-gold font-bold">
            <Icon name="check" className="h-3 w-3" />
            <span>RVU Email Verified</span>
          </div>

          <h1 className="mt-4 text-[clamp(2rem,1.4rem+2.5vw,3.5rem)] leading-[1.05]">
            Welcome, <span className="italic text-gold">{first}.</span>
          </h1>

          <p className="mt-3 max-w-[38ch] text-sm md:text-base leading-relaxed text-paper/70">
            We extracted your program and batch directly from your student email. You can fine-tune any detail before continuing.
          </p>

          {/* Extracted preview card */}
          <div className="mt-6 border border-line-strong bg-ink/60 p-4 text-xs">
            <span className="eyebrow !text-[0.6rem] text-gold">Detected from {who.email}</span>
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <span className="font-bold text-sm text-paper">{extracted?.programme ? extracted.programme.toUpperCase() : 'Student'}</span>
              {batchMatch && <span className="font-mono text-paper/70">· Batch of '{batchMatch}</span>}
              <span className="text-gold font-mono">· Year {year}</span>
            </div>
            <p className="mt-1 truncate text-paper/60 text-[0.75rem]">{school}</p>
          </div>
        </div>

        <footer className="text-xs text-paper/40 hidden lg:block">
          RV University · Office of Student Affairs
        </footer>
      </aside>

      {/* Right Editable Profile Configuration Form */}
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 lg:px-16">
        <form onSubmit={submit} noValidate className="max-w-xl mx-auto space-y-7">
          {/* Read-only Identity strip */}
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-px border border-line bg-line text-sm" {...enter(0)}>
            <div className="bg-ink p-3.5">
              <span className="eyebrow !text-[0.6rem]">Name (from Google)</span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-semibold truncate">{who.name}</span>
                <span className="text-[0.65rem] border border-line px-1.5 py-0.5 text-paper/50">Fixed</span>
              </div>
            </div>
            <div className="bg-ink p-3.5">
              <span className="eyebrow !text-[0.6rem]">Email Address</span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-mono truncate text-xs text-paper/80">{who.email}</span>
                <span className="text-[0.65rem] border border-line px-1.5 py-0.5 text-gold">Verified</span>
              </div>
            </div>
          </motion.div>

          {/* Year selector - fully editable */}
          <motion.fieldset {...enter(1)} aria-describedby={tried && !year ? 'year-err' : undefined}>
            <div className="flex items-center justify-between">
              <legend className="eyebrow">Year of study</legend>
              <span className="text-xs text-paper/50 font-mono">Editable</span>
            </div>
            <div className="mt-2.5 grid grid-cols-4 border border-line">
              {([1, 2, 3, 4] as const).map((y) => (
                <button
                  key={y}
                  type="button"
                  aria-pressed={year === y}
                  onClick={() => setYear(y)}
                  className={`h-11 border-l border-line first:border-l-0 text-sm font-bold transition-colors ${
                    year === y ? 'bg-gold text-ink font-semibold' : 'hover-gold bg-ink text-paper/70'
                  }`}
                >
                  <Num>Year {y}</Num>
                </button>
              ))}
            </div>
            {tried && !year && <p id="year-err" className="mt-1.5 text-xs text-[#e0795f]">Please select your year of study.</p>}
          </motion.fieldset>

          {/* School selector - fully editable */}
          <motion.div {...enter(2)}>
            <div className="flex items-center justify-between">
              <label htmlFor="school" className="eyebrow">School / Faculty</label>
              <span className="text-xs text-paper/50 font-mono">Auto-selected</span>
            </div>
            <select
              id="school"
              className="field mt-2.5 w-full text-sm font-sans"
              value={school}
              aria-invalid={tried && !school}
              onChange={(e) => {
                const s = e.target.value as School
                setSchool(s)
                setInterests(defaultInterestsFor(s))
              }}
            >
              {SCHOOLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </motion.div>

          {/* Interests selector */}
          <motion.fieldset {...enter(3)}>
            <div className="flex items-center justify-between">
              <legend className="eyebrow">What should we put first?</legend>
              <span className="text-xs text-paper/50 font-mono">Select multiple</span>
            </div>
            <p className="mt-1 text-xs text-paper/60">Choose your primary interests to personalize your campus feed.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = interests.includes(c)
                return (
                  <button
                    key={c}
                    type="button"
                    className={`px-3 py-1.5 text-xs border transition-colors flex items-center gap-1.5 ${
                      active ? 'border-gold bg-gold/15 text-gold font-bold' : 'border-line text-paper/70 hover:border-gold'
                    }`}
                    aria-pressed={active}
                    onClick={() => toggle(c)}
                  >
                    {active && <Icon name="check" className="h-3 w-3" />}
                    <span>{c}</span>
                  </button>
                )
              })}
            </div>
          </motion.fieldset>

          {/* Optional Links - Collapsible to avoid cluttering screen */}
          <motion.div {...enter(4)} className="border-t border-line pt-5">
            <button
              type="button"
              onClick={() => setShowLinks(!showLinks)}
              className="flex w-full items-center justify-between text-left text-xs uppercase tracking-[0.1em] text-paper/70 hover:text-gold"
            >
              <span className="flex items-center gap-2">
                <Icon name="link" className="h-3.5 w-3.5 text-gold" />
                <span>Links & Portfolios (Optional)</span>
              </span>
              <span className="text-xs font-mono">{showLinks ? '− Hide' : '+ Add links'}</span>
            </button>

            {showLinks && (
              <div className="mt-4 space-y-3 pl-1">
                <LinksFields value={links} onChange={setLinks} />
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div {...enter(5)} className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <button type="submit" className="btn btn-gold flex-1 sm:flex-initial">
              <span>Go to my week</span>
              <Icon name="arrow" className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                clearPending()
                go('')
              }}
            >
              Cancel
            </button>
          </motion.div>
        </form>
      </main>
    </div>
  )
}
