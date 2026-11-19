import { useId, useMemo, useState } from 'react'
import { SCHOOLS, type Profile } from '../data/types'
import { identityFromEmail, isRvuEmail } from '../lib/identity'
import { go } from '../lib/router'
import { useStore } from '../lib/store'
import { Dialog, Icon, Num } from './ui'

export const blankLinks = { github: '', linkedin: '', portfolio: '' }

/**
 * One field, one decision. The name, school and year come from the address
 * itself, so a first-time student never types what the university already knows.
 * Prototype note: no password is sent anywhere. In production this is Google
 * sign-in restricted to the rvu.edu.in domain.
 */
export function SignIn({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setProfile } = useStore()
  const [email, setEmail] = useState('')
  const [nameEdit, setNameEdit] = useState<string | null>(null)
  const titleId = useId()
  const hintId = useId()
  const errId = useId()
  const valid = isRvuEmail(email)
  const who = useMemo(() => (valid ? identityFromEmail(email) : null), [email, valid])
  const name = nameEdit ?? who?.name ?? ''

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || !who) return
    const p: Profile = {
      name: name.trim() || who.name,
      email: email.trim().toLowerCase(),
      year: who.year ?? 1,
      school: who.school ?? SCHOOLS[0],
      role: 'Student',
      interests: [],
      links: blankLinks,
    }
    setProfile(p)
    onClose()
    go('welcome')
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId}>
      <form onSubmit={submit} className="border border-line-strong bg-slate-2" noValidate={false}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 md:px-7">
          <div>
            <p className="slate-no">Sign in</p>
            <h2 id={titleId} className="mt-1 text-2xl md:text-3xl">Your RVU email is enough</h2>
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        <div className="px-5 py-6 md:px-7">
          <div className="field-wrap">
            <label htmlFor="signin-email" className="eyebrow">University email</label>
            <p id={hintId} className="mt-1 text-sm text-mute">Ends in @rvu.edu.in</p>
            <input
              id="signin-email"
              className="field mt-2"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              autoFocus
              pattern="[A-Za-z0-9._%+\-]+@[Rr][Vv][Uu]\.[Ee][Dd][Uu]\.[Ii][Nn]"
              placeholder="firstnamelastname@rvu.edu.in"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setNameEdit(null)
              }}
              aria-describedby={`${hintId} ${errId}`}
            />
            <p id={errId} className="field-error" role="status">
              <Icon name="close" className="h-4 w-4" />
              <span>Error: use your RV University address, ending in @rvu.edu.in.</span>
            </p>
          </div>

          {who && (
            <div className="mt-6 border border-line bg-ink/40 p-4">
              <p className="eyebrow">From your address</p>
              <label htmlFor="signin-name" className="sr-only">Your name</label>
              <input
                id="signin-name"
                className="mt-2 w-full border-0 border-b border-line-strong bg-transparent pb-1 font-display text-2xl text-paper focus:border-gold focus:outline-none"
                value={name}
                onChange={(e) => setNameEdit(e.target.value)}
                autoComplete="name"
              />
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-mute">School</dt>
                <dd>{who.school ?? 'Choose on the next step'}</dd>
                <dt className="text-mute">Year</dt>
                <dd>{who.year ? <Num>Year {who.year}</Num> : 'Choose on the next step'}</dd>
              </dl>
              <p className="mt-3 text-xs text-mute">Not right? Edit the name here; school and year can be changed next.</p>
            </div>
          )}

          <button type="submit" className="btn btn-gold mt-6 w-full" disabled={!valid}>
            <span>Continue{who ? ` as ${name.split(' ')[0] || who.name}` : ''}</span>
            <Icon name="arrow" className="h-4 w-4" />
          </button>
          <p className="mt-4 text-xs leading-relaxed text-mute">
            Prototype: nothing is sent to a server and no password is asked for. The live version would use Google sign-in limited to rvu.edu.in accounts.
          </p>
        </div>
      </form>
    </Dialog>
  )
}
