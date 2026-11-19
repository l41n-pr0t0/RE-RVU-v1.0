import { useId } from 'react'
import type { Links } from '../data/types'
import { Icon, type IconName } from './ui'

/** Clubs and project teams ask for these. Stored once, attached on request. */
const FIELDS: { key: keyof Links; label: string; icon: IconName; hint: string; placeholder: string; pattern: string; error: string }[] = [
  {
    key: 'github',
    label: 'GitHub',
    icon: 'github',
    hint: 'github.com/your-username',
    placeholder: 'https://github.com/username',
    pattern: '(https?://)?(www\\.)?github\\.com/[A-Za-z0-9](?:[A-Za-z0-9\\-]{0,38})/?',
    error: 'Error: use a profile address like github.com/username.',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: 'linkedin',
    hint: 'linkedin.com/in/your-name',
    placeholder: 'https://www.linkedin.com/in/name',
    pattern: '(https?://)?([a-z]{2,3}\\.)?linkedin\\.com/in/[A-Za-z0-9\\-_%]{3,100}/?',
    error: 'Error: use a profile address like linkedin.com/in/your-name.',
  },
  {
    key: 'portfolio',
    label: 'Portfolio',
    icon: 'link',
    hint: 'Behance, Dribbble, a personal site',
    placeholder: 'https://',
    pattern: 'https?://[^\\s]+\\.[^\\s]+',
    error: 'Error: start with https:// and include the full address.',
  },
]

export const normaliseLink = (v: string) => {
  const t = v.trim()
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

export const linksValid = (l: Links) =>
  FIELDS.every((f) => !l[f.key] || new RegExp(`^(?:${f.pattern})$`).test(l[f.key].trim()))

export function LinksFields({ value, onChange, only }: { value: Links; onChange: (l: Links) => void; only?: (keyof Links)[] }) {
  const base = useId()
  return (
    <div className="grid gap-5">
      {FIELDS.filter((f) => !only || only.includes(f.key)).map((f) => {
        const id = `${base}-${f.key}`
        return (
          <div key={f.key} className="field-wrap">
            <label htmlFor={id} className="flex items-center gap-2 text-sm font-bold">
              <Icon name={f.icon} className="h-4 w-4 text-gold" /> {f.label}
              <span className="font-normal text-mute">(optional)</span>
            </label>
            <p id={`${id}-hint`} className="mt-0.5 text-xs text-mute">{f.hint}</p>
            <input
              id={id}
              className="field mt-2"
              type="text"
              inputMode="url"
              autoComplete="url"
              autoCapitalize="none"
              spellCheck={false}
              pattern={f.pattern}
              placeholder={f.placeholder}
              value={value[f.key]}
              onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
              aria-describedby={`${id}-hint ${id}-err`}
            />
            <p id={`${id}-err`} className="field-error">
              <Icon name="close" className="h-4 w-4 shrink-0" /> <span>{f.error}</span>
            </p>
          </div>
        )
      })}
    </div>
  )
}
