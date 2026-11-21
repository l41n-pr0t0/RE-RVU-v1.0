import { useEffect, useId, useRef, useState } from 'react'
import { identityFromEmail, initials, isRvuEmail } from '../lib/identity'
import { go } from '../lib/router'
import { Dialog, Icon } from './ui'

export const blankLinks = { github: '', linkedin: '', portfolio: '' }

/**
 * Continue with Google.
 *
 * Real mode: set VITE_GOOGLE_CLIENT_ID in app/.env.local. Google Identity Services renders its own
 * button, restricted to rvu.edu.in accounts, and returns a signed ID token. We read name and email
 * from it in the browser; a production backend must verify the token before trusting it.
 *
 * Demo mode (no client ID): an account chooser in our own design. It is deliberately not a copy of
 * Google's screen, because a pixel copy of a sign-in page is what phishing looks like.
 *
 * Either way the result is the same: a pending identity (name + email), then the welcome step.
 * Nothing is guessed except, in demo mode only, the display name from the address.
 */

export type Identity = { name: string; email: string; via: 'google' | 'demo' }
const PENDING = 'rvu-connect:pending'

export const pendingIdentity = (): Identity | null => {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING) ?? 'null')
  } catch {
    return null
  }
}
export const clearPending = () => sessionStorage.removeItem(PENDING)

function finish(who: Identity) {
  try {
    const raw = localStorage.getItem('rvu-connect:v3')
    if (raw) {
      const s = JSON.parse(raw)
      const p = s.profile
      if (p && p.name !== 'Guest' && p.email?.toLowerCase() === who.email.toLowerCase() && p.year && p.school) {
        // Details already filled and saved: proceed straight to home without asking again
        sessionStorage.removeItem(PENDING)
        go('home')
        return
      }
    }
  } catch {}
  sessionStorage.setItem(PENDING, JSON.stringify(who))
  go('welcome')
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const DEMO_ACCOUNT = 'harshulkalabtech25@rvu.edu.in'

export function SignIn({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId()
  return (
    <Dialog open={open} onClose={onClose} variant="modal" labelledBy={titleId}>
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 md:px-7">
        <div>
          <p className="eyebrow">Sign in</p>
          <h2 id={titleId} className="mt-1 text-2xl md:text-3xl">Continue with Google</h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>
      {open && (CLIENT_ID ? <RealGoogle clientId={CLIENT_ID} /> : <DemoChooser />)}
    </Dialog>
  )
}

/* ---------------------------------------------------------------- real */

type Gsi = {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void; hd?: string; ux_mode?: string }) => void
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void
    }
  }
}

function loadGsi(): Promise<Gsi> {
  const w = window as unknown as { google?: Gsi }
  if (w.google?.accounts) return Promise.resolve(w.google)
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => (w.google ? resolve(w.google) : reject(new Error('gsi')))
    s.onerror = () => reject(new Error('gsi'))
    document.head.append(s)
  })
}

function readToken(jwt: string): { name?: string; email?: string; hd?: string } {
  const part = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(
    [...atob(part)].map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
  )
  return JSON.parse(json)
}

function RealGoogle({ clientId }: { clientId: string }) {
  const slot = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let live = true
    loadGsi()
      .then((g) => {
        if (!live || !slot.current) return
        g.accounts.id.initialize({
          client_id: clientId,
          hd: 'rvu.edu.in',
          callback: ({ credential }) => {
            const t = readToken(credential)
            if (!t.email || !isRvuEmail(t.email)) {
              setError('That account isn’t an RV University one. Use your rvu.edu.in address.')
              return
            }
            finish({ name: t.name ?? identityFromEmail(t.email).name, email: t.email, via: 'google' })
          },
        })
        g.accounts.id.renderButton(slot.current, { theme: 'filled_black', size: 'large', shape: 'rectangular', text: 'continue_with', width: 300 })
      })
      .catch(() => live && setError('Google sign-in didn’t load. Check your connection and try again.'))
    return () => {
      live = false
    }
  }, [clientId])
  return (
    <div className="px-5 py-6 md:px-7 md:py-8">
      <p className="text-mute">Use your RV University Google account. Other accounts are turned away.</p>
      <div ref={slot} className="mt-6 min-h-11" />
      {error && (
        <p role="alert" className="mt-4 flex items-start gap-2 text-alert">
          <Icon name="close" className="mt-0.5 h-4 w-4 shrink-0" /> <span>Error: {error}</span>
        </p>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- demo */

function DemoChooser() {
  const [other, setOther] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const fieldId = useId()
  const hintId = useId()
  const errId = useId()
  const valid = isRvuEmail(email)

  // Use currently saved student profile if one exists
  let savedProfile: { name: string; email: string } | null = null
  try {
    const raw = localStorage.getItem('rvu-connect:v3')
    if (raw) {
      const p = JSON.parse(raw).profile
      if (p && p.name && p.name !== 'Guest' && p.email) {
        savedProfile = { name: p.name, email: p.email }
      }
    }
  } catch {}

  const defaultAccount = savedProfile ? savedProfile.email : DEMO_ACCOUNT
  const defaultName = savedProfile ? savedProfile.name : identityFromEmail(DEMO_ACCOUNT).name

  const pick = (address: string, customName?: string) => {
    const resolvedName = customName?.trim() || identityFromEmail(address).name
    finish({ name: resolvedName, email: address.toLowerCase(), via: 'demo' })
  }

  return (
    <div className="px-5 py-6 md:px-7 md:py-7">
      <p className="text-mute">Choose an account to continue to RVU Connect.</p>
      <ul className="mt-5 border-y border-line">
        <li>
          <button className="row-hover flex w-full items-center gap-4 px-1 py-4 text-left" onClick={() => pick(defaultAccount, defaultName)} autoFocus>
            <span className="grid h-11 w-11 shrink-0 place-items-center bg-gold font-bold text-black">{initials(defaultName)}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{defaultName}</span>
              <span className="block truncate text-sm text-mute">{defaultAccount}</span>
            </span>
            <Icon name="arrow" className="h-4 w-4 text-mute" />
          </button>
        </li>
        <li className="border-t border-line">
          <button className="row-hover flex w-full items-center gap-4 px-1 py-4 text-left" aria-expanded={other} onClick={() => setOther((x) => !x)}>
            <span className="grid h-11 w-11 shrink-0 place-items-center border border-line-strong">
              <Icon name="user" className="h-5 w-5" />
            </span>
            <span className="flex-1">Use another RVU account</span>
          </button>
        </li>
      </ul>

      {other && (
        <form
          className="field-wrap mt-5 space-y-3"
          noValidate={false}
          onSubmit={(e) => {
            e.preventDefault()
            if (valid) pick(email, name)
          }}
        >
          <div>
            <label htmlFor={`${fieldId}-name`} className="eyebrow">Your name (optional)</label>
            <input
              id={`${fieldId}-name`}
              type="text"
              placeholder="e.g. Alex Sharma"
              className="field mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={fieldId} className="eyebrow">RVU email</label>
            <p id={hintId} className="mt-1 text-sm text-mute">Ends in @rvu.edu.in</p>
            <div className="mt-2 flex gap-2">
              <input
                id={fieldId}
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                pattern="[^@\s]+@rvu\.edu\.in"
                className="field min-w-0 flex-1"
                placeholder="nameprogramme25@rvu.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                aria-describedby={`${hintId} ${errId}`}
                autoFocus
              />
              <button className="btn btn-gold" type="submit">Next</button>
            </div>
            <p id={errId} className="field-error mt-2 text-sm">Error: use your @rvu.edu.in address.</p>
          </div>
        </form>
      )}

      <p className="mt-6 text-xs leading-relaxed text-mute">
        Demo sign-in: nothing leaves this browser. The live version uses Google sign-in limited to rvu.edu.in accounts.
      </p>
    </div>
  )
}
