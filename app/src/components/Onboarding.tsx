import { motion } from 'framer-motion'
import { useState } from 'react'
import { CATEGORIES, SCHOOLS, type Category, type Profile, type Role, type School } from '../data/types'
import { useStore } from '../lib/store'
import { DOLLY, Logo } from './ui'

/**
 * One screen instead of two modals (F4, F7). Saved instantly and never
 * shown again. Club core and school representative roles are verified,
 * not self-assigned.
 */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const { setProfile } = useStore()
  const [name, setName] = useState('')
  const [year, setYear] = useState<Profile['year']>(1)
  const [school, setSchool] = useState<School>(SCHOOLS[0])
  const [role, setRole] = useState<Role>('Student')
  const [interests, setInterests] = useState<Category[]>([])
  const [touched, setTouched] = useState(false)

  const nameError = touched && !name.trim() ? 'Add your name so clubs know who is registering.' : ''

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!name.trim()) return
    setProfile({ name: name.trim(), year, school, role, interests })
    onDone()
  }

  return (
    <div className="grid min-h-[100dvh] md:grid-cols-[5fr_7fr]">
      <aside className="relative hidden overflow-hidden border-r border-line bg-slate-2 p-12 md:flex md:flex-col md:justify-between">
        <Logo className="h-14" />
        <div>
          <p className="eyebrow">Step 1 of 1</p>
          <h1 className="mt-4 text-5xl leading-[1.05]">Tell us a little. We’ll do the sorting.</h1>
          <p className="mt-5 max-w-[38ch] text-mute">
            Your interests decide what appears under “For you”. You can change them any time from your profile.
          </p>
        </div>
        <div className="h-px w-full bg-gold/60" />
      </aside>

      <motion.form
        onSubmit={submit}
        noValidate
        className="mx-auto w-full max-w-2xl px-5 py-10 md:px-12 md:py-16"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: DOLLY }}
      >
        <div className="md:hidden">
          <Logo className="h-11" />
          <h1 className="mt-8 text-4xl leading-tight">Tell us a little.</h1>
        </div>

        <fieldset className="mt-8 md:mt-0">
          <label htmlFor="name" className="eyebrow">
            Your name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            autoComplete="name"
            aria-invalid={!!nameError}
            aria-describedby="name-err"
            className="mt-2 h-12 w-full rounded-xl border border-line bg-transparent px-4 text-paper focus:border-gold focus:outline-none"
          />
          <p id="name-err" className="mt-1.5 min-h-5 text-sm text-gold">
            {nameError}
          </p>
        </fieldset>

        <div className="mt-4 grid gap-6 md:grid-cols-[8rem_1fr]">
          <fieldset>
            <legend className="eyebrow">Year</legend>
            <div className="mt-2 flex gap-2">
              {([1, 2, 3, 4] as const).map((y) => (
                <button type="button" key={y} aria-pressed={year === y} onClick={() => setYear(y)} className="chip num w-11 justify-center !px-0">
                  {y}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="school" className="eyebrow">
              School
            </label>
            <select
              id="school"
              value={school}
              onChange={(e) => setSchool(e.target.value as School)}
              className="mt-2 h-12 w-full rounded-xl border border-line bg-ink px-4 text-paper focus:border-gold focus:outline-none"
            >
              {SCHOOLS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="mt-8">
          <legend className="eyebrow">What are you into? Pick any</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const on = interests.includes(c)
              return (
                <button
                  type="button"
                  key={c}
                  aria-pressed={on}
                  className="chip"
                  onClick={() => setInterests(on ? interests.filter((x) => x !== c) : [...interests, c])}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="eyebrow">I’m joining as</legend>
          <div className="mt-3 grid gap-2">
            {(
              [
                ['Student', 'Discover events, follow clubs, join projects.'],
                ['Club core', 'Post events for your club. We’ll confirm with your faculty coordinator.'],
                ['School representative', 'Post school events and notices. Verified by the Office of Student Affairs.'],
              ] as const
            ).map(([r, d]) => (
              <label
                key={r}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  role === r ? 'border-gold bg-gold/5' : 'border-line hover:border-paper/30'
                }`}
              >
                <input type="radio" name="role" className="mt-1 accent-[#D7AC54]" checked={role === r} onChange={() => setRole(r)} />
                <span>
                  <span className="block font-bold">{r}</span>
                  <span className="block text-sm text-mute">{d}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-10 flex items-center gap-4">
          <button type="submit" className="btn btn-gold">
            Start exploring
          </button>
          <p className="text-sm text-mute">Saved on this device. You won’t see this again.</p>
        </div>
      </motion.form>
    </div>
  )
}
