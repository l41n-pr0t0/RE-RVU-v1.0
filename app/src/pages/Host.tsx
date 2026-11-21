import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ClubCover } from '../components/ClubCover'
import { ContactSheet } from '../components/Frames'
import { EmptyState, Icon, Monogram, Num, PageHeader } from '../components/ui'
import { CLUB_SECTIONS, type Ask, type CampusEvent, type Club, type ClubLayout, type ClubLook, type ClubPage, type ClubPattern, type ClubSection, type ClubTheme, type ClubType, type Photo, type Question } from '../data/types'
import { LAYOUTS, PATTERNS, THEMES, TYPES, themeStyle } from '../lib/clubThemes'
import { useCatalog } from '../lib/catalog'
import { dayMonth, longDate, ticketCode, time } from '../lib/format'
import { go, href } from '../lib/router'
import { myAttendeeId, useStore } from '../lib/store'

type Tab = 'page' | 'events' | 'checkin' | 'archive'
const TABS: { id: Tab; label: string }[] = [
  { id: 'page', label: 'Club page' },
  { id: 'events', label: 'Events' },
  { id: 'checkin', label: 'Check-in' },
  { id: 'archive', label: 'Archive' },
]

/** Sc. 08: the host dashboard for an approved club’s core team. */
export default function Host({ id }: { id?: string }) {
  const { clubs, clubById } = useCatalog()
  const { profile, managing, setManaging } = useStore()
  const clubId = id ?? managing ?? undefined
  const club = clubId ? clubById(clubId) : undefined
  const [tab, setTab] = useState<Tab>('page')

  if (!profile?.email)
    return <div className="py-16"><EmptyState title="Sign in to host" body="The host dashboard is for core teams of approved clubs." action={<a className="btn btn-gold" href="#/">Sign in</a>} /></div>

  if (!club)
    return (
      <>
        <PageHeader scene="08" eyebrow="Host dashboard" title="Which club do you run?">
          <p>In production this list only shows clubs where the Office of Student Affairs has you on the core team. In this prototype you can pick any.</p>
        </PageHeader>
        <ul className="mt-8 grid border-t border-line sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3">
          {[...clubs].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
            <li key={c.id} className="border-b border-line">
              <button className="row-hover flex w-full items-center gap-4 py-3 text-left" onClick={() => { setManaging(c.id); go(`host/${c.id}`) }}>
                <Monogram text={c.mono} size="sm" />
                <span className="font-display text-lg">{c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </>
    )

  return (
    <>
      <PageHeader scene="08" eyebrow="Host dashboard" title={club.name} aside={<a className="btn btn-sm" href={href(`clubs/${club.id}`)}><Icon name="eye" className="h-4 w-4" /> View page</a>}>
        <p>Edit the club page, publish events, check people in at the door and keep the archive. <button className="hover-gold text-gold underline underline-offset-4" onClick={() => { setManaging(null); go('host') }}>Switch club</button></p>
      </PageHeader>

      <div role="tablist" aria-label="Dashboard sections" className="mt-6 flex overflow-x-auto border-b border-line no-scrollbar">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} id={`tab-${t.id}`} aria-controls={`panel-${t.id}`} onClick={() => setTab(t.id)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm uppercase tracking-[0.12em] ${tab === t.id ? 'border-gold text-paper' : 'border-transparent text-mute'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="py-8">
        {tab === 'page' && <PageEditor clubId={club.id} />}
        {tab === 'events' && <EventsPanel clubId={club.id} />}
        {tab === 'checkin' && <CheckInPanel clubId={club.id} />}
        {tab === 'archive' && <ArchivePanel clubId={club.id} />}
      </div>
    </>
  )
}

/* ---------- Club page editor ---------- */

const ASKS: Ask[] = ['GitHub', 'LinkedIn', 'Portfolio']

function PageEditor({ clubId }: { clubId: string }) {
  const cat = useCatalog()
  const { saveClubPage, resetClubPage, clubPages } = useStore()
  const [p, setP] = useState<ClubPage>(() => cat.clubPage(clubId))
  const [saved, setSaved] = useState(false)
  const set = (patch: Partial<ClubPage>) => { setP({ ...p, ...patch }); setSaved(false) }
  const club = cat.clubById(clubId)!
  const f = useId()

  const move = (s: ClubSection, d: -1 | 1) => {
    const i = p.sections.indexOf(s)
    const j = i + d
    if (j < 0 || j >= p.sections.length) return
    const next = [...p.sections]
    ;[next[i], next[j]] = [next[j], next[i]]
    set({ sections: next })
  }

  const setQ = (i: number, q: Partial<Question>) => set({ questions: p.questions.map((x, k) => (k === i ? { ...x, ...q } : x)) })

  return (
    <form
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]"
      onSubmit={(e) => { e.preventDefault(); if (!e.currentTarget.checkValidity()) return; saveClubPage(clubId, p); setSaved(true) }}
    >
      <div className="grid gap-8">
        <LookEditor look={p.look} club={club} onChange={(look) => set({ look })} />

        <Group title="Identity">
          <Field label="Tagline" id={`${f}-tag`}><input id={`${f}-tag`} className="field" required maxLength={90} value={p.tagline} onChange={(e) => set({ tagline: e.target.value })} /></Field>
          <Field label="About" id={`${f}-about`}><textarea id={`${f}-about`} className="field min-h-28" required maxLength={600} value={p.about} onChange={(e) => set({ about: e.target.value })} /></Field>
          <Field label="Objectives, one per line" id={`${f}-obj`}>
            <textarea id={`${f}-obj`} className="field min-h-24" value={p.objectives.join('\n')} onChange={(e) => set({ objectives: e.target.value.split('\n').filter((x, i, a) => x.trim() || i === a.length - 1) })} />
          </Field>
        </Group>

        <Group title="Leadership">
          {p.leadership.map((m, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input aria-label="Name" className="field" required value={m.name} onChange={(e) => set({ leadership: p.leadership.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} />
              <input aria-label="Role" className="field" required value={m.role} onChange={(e) => set({ leadership: p.leadership.map((x, k) => (k === i ? { ...x, role: e.target.value } : x)) })} />
              <button type="button" className="icon-btn" aria-label={`Remove ${m.name}`} onClick={() => set({ leadership: p.leadership.filter((_, k) => k !== i) })}><Icon name="trash" className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" className="btn btn-sm justify-self-start" onClick={() => set({ leadership: [...p.leadership, { name: '', role: '' }] })}><Icon name="plus" className="h-4 w-4" /> Add person</button>
        </Group>

        <Group title="Recruitment">
          <label className="flex items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-gold" checked={p.recruitment.open} onChange={(e) => set({ recruitment: { ...p.recruitment, open: e.target.checked } })} /> Taking applications</label>
          {p.recruitment.open && (
            <>
              <Field label="Announcement" id={`${f}-msg`}><textarea id={`${f}-msg`} className="field min-h-20" required maxLength={300} value={p.recruitment.message} onChange={(e) => set({ recruitment: { ...p.recruitment, message: e.target.value } })} /></Field>
              <Field label="Roles, separated by commas" id={`${f}-roles`}><input id={`${f}-roles`} className="field" value={p.recruitment.roles.join(', ')} onChange={(e) => set({ recruitment: { ...p.recruitment, roles: e.target.value.split(',').map((r) => r.trim()).filter(Boolean) } })} /></Field>
              <Field label="Applications close" id={`${f}-closes`}>
                <input id={`${f}-closes`} type="date" className="field" value={p.recruitment.closes?.slice(0, 10) ?? ''} onChange={(e) => set({ recruitment: { ...p.recruitment, closes: e.target.value ? new Date(`${e.target.value}T23:59`).toISOString() : undefined } })} />
              </Field>
            </>
          )}
        </Group>

        <Group title="Application form">
          <p className="text-sm text-mute">Name, email, year and school come from the student’s profile automatically. Add only what you actually read.</p>
          {p.questions.map((q, i) => (
            <div key={q.id} className="grid gap-2 border border-line p-3">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                <input aria-label="Question" className="field" required value={q.label} onChange={(e) => setQ(i, { label: e.target.value })} />
                <select aria-label="Answer type" className="field !w-auto" value={q.kind} onChange={(e) => setQ(i, { kind: e.target.value as Question['kind'], options: e.target.value === 'choice' ? q.options ?? ['Yes', 'No'] : undefined })}>
                  <option value="short">Short answer</option>
                  <option value="long">Paragraph</option>
                  <option value="choice">Choice</option>
                </select>
                <button type="button" className="icon-btn" aria-label="Remove question" onClick={() => set({ questions: p.questions.filter((_, k) => k !== i) })}><Icon name="trash" className="h-4 w-4" /></button>
              </div>
              {q.kind === 'choice' && <input aria-label="Options, separated by commas" className="field" value={q.options?.join(', ') ?? ''} onChange={(e) => setQ(i, { options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean) })} />}
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-gold" checked={q.required} onChange={(e) => setQ(i, { required: e.target.checked })} /> Required</label>
            </div>
          ))}
          <button type="button" className="btn btn-sm justify-self-start" onClick={() => set({ questions: [...p.questions, { id: `q-${Date.now()}`, label: '', kind: 'short', required: false }] })}><Icon name="plus" className="h-4 w-4" /> Add question</button>
          <fieldset>
            <legend className="mb-2 text-sm">Ask applicants for</legend>
            <div className="flex flex-wrap gap-2">
              {ASKS.map((a) => <button type="button" key={a} className="chip" aria-pressed={p.asks.includes(a)} onClick={() => set({ asks: p.asks.includes(a) ? p.asks.filter((x) => x !== a) : [...p.asks, a] })}>{a}</button>)}
            </div>
          </fieldset>
        </Group>

        <Group title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" id={`${f}-email`}><input id={`${f}-email`} type="email" className="field" value={p.contact.email} onChange={(e) => set({ contact: { ...p.contact, email: e.target.value } })} /></Field>
            <Field label="Website" id={`${f}-web`} hint="Starts with https://"><input id={`${f}-web`} type="url" pattern="https://.*" className="field" placeholder="https://" value={p.contact.website} onChange={(e) => set({ contact: { ...p.contact, website: e.target.value } })} /></Field>
            <Field label="Instagram" id={`${f}-ig`}><input id={`${f}-ig`} className="field" value={p.contact.instagram} onChange={(e) => set({ contact: { ...p.contact, instagram: e.target.value } })} /></Field>
            <Field label="WhatsApp community link" id={`${f}-wa`}><input id={`${f}-wa`} type="url" className="field" placeholder="https://chat.whatsapp.com/…" value={p.contact.whatsapp} onChange={(e) => set({ contact: { ...p.contact, whatsapp: e.target.value } })} /></Field>
          </div>
        </Group>
      </div>

      <aside className="lg:sticky lg:top-[calc(var(--head)+1.5rem)] lg:self-start">
        <Group title="Live preview">
          <div className="club-theme border border-line-strong" data-type={p.look.type} style={themeStyle(p.look)}>
            <ClubCover club={club} look={p.look} className="aspect-[16/10]">
              <div className="flex h-full flex-col justify-end p-4">
                <span className="eyebrow !text-[0.55rem] !text-gold">{club.category} · {LAYOUTS[p.look.layout].label} layout</span>
                <span className="club-display mt-1 text-3xl leading-none">{club.name}</span>
                <span className="mt-1.5 line-clamp-2 text-xs text-mute">{p.tagline}</span>
              </div>
            </ClubCover>
            <div className="flex flex-wrap items-center gap-2 p-3">
              <span className="btn btn-gold btn-sm pointer-events-none">Apply to join</span>
              <span className="btn btn-sm pointer-events-none">Follow</span>
              <span className="tag tag-teal">Recruiting</span>
            </div>
          </div>
        </Group>
        <div className="mt-8" />
        <Group title="Sections">
          <p className="text-sm text-mute">Order and visibility on your page.</p>
          <ol className="border-t border-line">
            {p.sections.map((s, i) => {
              const hidden = p.hidden.includes(s)
              return (
                <li key={s} className="flex items-center gap-2 border-b border-line py-2">
                  <Num className="w-6 text-xs text-mute">{i + 1}</Num>
                  <span className={`flex-1 text-sm ${hidden ? 'text-mute line-through' : ''}`}>{CLUB_SECTIONS.find((x) => x.id === s)!.label}</span>
                  <button type="button" className="icon-btn !h-8 !w-8" aria-label="Move up" disabled={i === 0} onClick={() => move(s, -1)}><Icon name="up" className="h-4 w-4" /></button>
                  <button type="button" className="icon-btn !h-8 !w-8" aria-label="Move down" disabled={i === p.sections.length - 1} onClick={() => move(s, 1)}><Icon name="down" className="h-4 w-4" /></button>
                  <button type="button" className="icon-btn !h-8 !w-8" aria-pressed={!hidden} aria-label={hidden ? 'Show section' : 'Hide section'} onClick={() => set({ hidden: hidden ? p.hidden.filter((h) => h !== s) : [...p.hidden, s] })}><Icon name={hidden ? 'eye-off' : 'eye'} className="h-4 w-4" /></button>
                </li>
              )
            })}
          </ol>
        </Group>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" className="btn btn-gold">Publish changes</button>
          {clubPages[clubId] && <button type="button" className="btn" onClick={() => { resetClubPage(clubId); setP(cat.clubPage(clubId)); setSaved(false) }}>Reset</button>}
        </div>
        <p role="status" className="mt-3 text-sm text-gold">{saved ? 'Published. Your page is live.' : ''}</p>
      </aside>
    </form>
  )
}

/* ---------- Look and feel: presets only, no code ---------- */

function LookEditor({ look, club, onChange }: { look: ClubLook; club: Club; onChange: (l: ClubLook) => void }) {
  const set = (patch: Partial<ClubLook>) => onChange({ ...look, ...patch })
  const themes = Object.keys(THEMES) as ClubTheme[]
  const patterns = Object.keys(PATTERNS) as ClubPattern[]
  return (
    <Group title="Look and feel">
      <p className="text-sm text-mute">Every theme is built from the RV University palette, so your page stays on brand however you set it. Changes show in the preview straight away.</p>
      <fieldset>
        <legend className="mb-2 text-sm">Theme</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {themes.map((t) => {
            const d = THEMES[t]
            const on = look.theme === t
            return (
              <button key={t} type="button" aria-pressed={on} onClick={() => set({ theme: t })} className={`group text-left outline-offset-2 ${on ? 'outline-2 outline-gold' : ''}`} style={{ outlineStyle: on ? 'solid' : undefined }}>
                <span className="block border border-line-strong p-2.5" style={{ background: d.ink, color: d.paper }}>
                  <span className="flex gap-1">
                    {[d.surface, d.accent, d.paper].map((c) => <span key={c} className="h-3 w-3 border border-black/10" style={{ background: c }} />)}
                  </span>
                  <span className="mt-4 block font-display text-lg leading-none">Aa</span>
                </span>
                <span className="mt-1.5 block text-sm">{d.label}</span>
                <span className="block text-xs text-mute">{d.note}</span>
              </button>
            )
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm">Layout</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(LAYOUTS) as ClubLayout[]).map((l) => (
            <button key={l} type="button" aria-pressed={look.layout === l} onClick={() => set({ layout: l })} className={`border p-3 text-left transition-colors ${look.layout === l ? 'border-gold' : 'border-line hover:border-line-strong'}`}>
              <LayoutGlyph layout={l} />
              <span className="mt-2 block text-sm">{LAYOUTS[l].label}</span>
              <span className="block text-xs text-mute">{LAYOUTS[l].note}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm">Cover pattern</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {patterns.map((pt) => (
            <button key={pt} type="button" aria-pressed={look.pattern === pt} onClick={() => set({ pattern: pt })} className={`border text-left ${look.pattern === pt ? 'border-gold' : 'border-line'}`}>
              <ClubCover club={club} look={{ ...look, pattern: pt }} size="mini" className="aspect-square"><span /></ClubCover>
              <span className="block px-2 py-1.5 text-xs">{PATTERNS[pt]}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm">Type</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPES) as ClubType[]).map((t) => (
            <button key={t} type="button" aria-pressed={look.type === t} onClick={() => set({ type: t })} data-type={t} className={`border px-4 py-2.5 text-left ${look.type === t ? 'border-gold' : 'border-line'}`}>
              <span className="club-display block text-xl leading-none">{club.name.split(' ')[0]}</span>
              <span className="mt-1 block text-xs text-mute">{TYPES[t].note}</span>
            </button>
          ))}
        </div>
      </fieldset>
    </Group>
  )
}

/** Tiny wireframe of each layout, so the choice is visual. */
function LayoutGlyph({ layout }: { layout: ClubLayout }) {
  const b = 'bg-line-strong'
  return (
    <span aria-hidden className="grid h-14 gap-1">
      {layout === 'cover' && (<><span className={`${b} h-6`} /><span className="grid grid-cols-[1fr_0.4fr] gap-1"><span className={`${b} opacity-50`} /><span className={`${b} opacity-30`} /></span></>)}
      {layout === 'split' && (<span className="grid h-14 grid-cols-[0.45fr_1fr] gap-1"><span className={b} /><span className="grid gap-1"><span className={`${b} opacity-50`} /><span className={`${b} opacity-50`} /><span className={`${b} opacity-50`} /></span></span>)}
      {layout === 'poster' && (<><span className={`${b} h-4`} /><span className="grid grid-cols-2 gap-1"><span className={`${b} col-span-2 h-3 opacity-50`} /><span className={`${b} h-4 opacity-40`} /><span className={`${b} h-4 opacity-40`} /></span></>)}
    </span>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4">
      <h2 className="eyebrow border-b border-line pb-2">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, id, hint, children }: { label: string; id: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field-wrap grid gap-1.5">
      <label htmlFor={id} className="text-sm">{label}</label>
      {hint && <p className="text-xs text-mute">{hint}</p>}
      {children}
    </div>
  )
}

/* ---------- Events ---------- */

const pad = (n: number) => String(n).padStart(2, '0')
const localInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

function EventsPanel({ clubId }: { clubId: string }) {
  const cat = useCatalog()
  const club = cat.clubById(clubId)!
  const { hostEvent, removeHostedEvent } = useStore()
  const mine = cat.events.filter((e) => e.hostId === clubId)
  const f = useId()
  const tomorrow = new Date(Date.now() + 86_400_000)
  tomorrow.setHours(17, 0, 0, 0)
  const blank = { title: '', start: localInput(tomorrow), hours: 2, venue: '', seats: 60, summary: '', free: true, campus: 'Bengaluru Campus' as CampusEvent['campus'] }
  const [d, setD] = useState(blank)
  const [done, setDone] = useState('')

  const publish = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) return
    const start = new Date(d.start)
    const ev: CampusEvent = {
      id: `h-${clubId}-${Date.now().toString(36)}`, title: d.title.trim(), hostId: clubId, hostName: club.name, kind: 'Club event', category: club.category,
      start, end: new Date(start.getTime() + d.hours * 3_600_000), venue: d.venue.trim(), campus: d.campus, summary: d.summary.trim(),
      seats: d.seats, registered: 0, free: d.free, registrationOpen: true, waitlist: 0, hosted: true,
    }
    hostEvent(ev)
    setDone(ev.title)
    setD(blank)
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section>
        <h2 className="eyebrow border-b border-line pb-2">Your upcoming events</h2>
        {mine.length === 0 ? <p className="py-6 text-mute">Nothing scheduled. Publish your first event on the right.</p> : (
          <ul>
            {mine.map((e) => {
              const pct = Math.round((e.registered / e.seats) * 100)
              return (
                <li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-line py-4">
                  <div className="min-w-0">
                    <p className="text-xs text-mute"><Num>{dayMonth(e.start)} · {time(e.start)}</Num> · {e.venue}</p>
                    <p className="mt-1 font-display text-xl">{e.title}</p>
                    <div className="mt-2 h-[3px] bg-line"><div className="h-full origin-left bg-gold" style={{ transform: `scaleX(${Math.min(pct, 100) / 100})` }} /></div>
                    <p className="mt-1.5 text-xs text-mute"><Num>{e.registered}</Num> of <Num>{e.seats}</Num> registered · <Num>{e.waitlist}</Num> waitlisted</p>
                  </div>
                  {e.hosted && <button className="icon-btn" aria-label={`Delete ${e.title}`} onClick={() => removeHostedEvent(e.id)}><Icon name="trash" className="h-4 w-4" /></button>}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <form onSubmit={publish} className="grid content-start gap-4 border border-line-strong p-5 md:p-7">
        <h2 className="eyebrow">New event</h2>
        <Field label="Title" id={`${f}-t`}><input id={`${f}-t`} className="field" required minLength={4} maxLength={70} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /><p className="field-error text-sm"><b>Error:</b> Give it a title of at least 4 characters.</p></Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
          <Field label="Starts" id={`${f}-s`}><input id={`${f}-s`} type="datetime-local" className="field" required min={localInput(new Date())} value={d.start} onChange={(e) => setD({ ...d, start: e.target.value })} /><p className="field-error text-sm"><b>Error:</b> Pick a time in the future.</p></Field>
          <Field label="Hours" id={`${f}-h`}><input id={`${f}-h`} type="number" className="field" min={0.5} max={12} step={0.5} required value={d.hours} onChange={(e) => setD({ ...d, hours: +e.target.value })} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
          <Field label="Venue" id={`${f}-v`}><input id={`${f}-v`} className="field" required value={d.venue} onChange={(e) => setD({ ...d, venue: e.target.value })} /><p className="field-error text-sm"><b>Error:</b> Where is it?</p></Field>
          <Field label="Seats" id={`${f}-c`}><input id={`${f}-c`} type="number" className="field" min={1} max={3000} required value={d.seats} onChange={(e) => setD({ ...d, seats: +e.target.value })} /></Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm">Campus</legend>
          <div className="flex gap-2">
            {(['Bengaluru Campus', 'Mysuru Campus'] as const).map((c) => <button type="button" key={c} className="chip" aria-pressed={d.campus === c} onClick={() => setD({ ...d, campus: c })}>{c}</button>)}
          </div>
        </fieldset>
        <Field label="What happens" id={`${f}-d`}><textarea id={`${f}-d`} className="field min-h-24" required minLength={20} maxLength={400} value={d.summary} onChange={(e) => setD({ ...d, summary: e.target.value })} /><p className="field-error text-sm"><b>Error:</b> Two lines at least, so people know what to expect.</p></Field>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5 accent-gold" checked={d.free} onChange={(e) => setD({ ...d, free: e.target.checked })} /> Free entry</label>
        <p className="text-xs text-mute">When seats run out, a waitlist opens automatically and moves up as people cancel.</p>
        <button type="submit" className="btn btn-gold justify-self-start">Publish event</button>
        <p role="status" className="text-sm text-gold">{done && `“${done}” is live on Events and on your club page.`}</p>
      </form>
    </div>
  )
}

/* ---------- Check-in ---------- */

type Attendee = { id: string; name: string }

/** Who has a seat: a stable demo roster, plus the signed-in student if they RSVP’d. */
function useRoster(e: CampusEvent | undefined): Attendee[] {
  const { students } = useCatalog()
  const { profile, registered } = useStore()
  return useMemo(() => {
    if (!e) return []
    const n = Math.min(e.registered, 12)
    const offset = e.id.length % students.length
    const list: Attendee[] = Array.from({ length: n }, (_, i) => {
      const s = students[(offset + i) % students.length]
      return { id: s.id.replace('s-', ''), name: s.name }
    })
    const me = myAttendeeId(profile)
    if (profile?.email && registered.includes(e.id) && !list.some((a) => a.id === me)) list.unshift({ id: me, name: `${profile.name} (you)` })
    return list
  }, [e, students, profile, registered])
}

type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> }

function CheckInPanel({ clubId }: { clubId: string }) {
  const cat = useCatalog()
  const today = new Date()
  const candidates = cat.allEvents.filter((e) => e.hostId === clubId && Math.abs(e.start.getTime() - today.getTime()) < 14 * 86_400_000)
  const [eventId, setEventId] = useState(candidates.find((e) => e.end >= today)?.id ?? candidates[0]?.id ?? '')
  const e = cat.eventById(eventId)
  const roster = useRoster(e)
  const { checkins, checkIn, undoCheckIn } = useStore()
  const inList = checkins[eventId] ?? []
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [scanning, setScanning] = useState(false)
  const f = useId()

  const accept = (raw: string) => {
    if (!e) return
    const v = raw.trim().toUpperCase()
    // QR payload is RVUC:<event>:<attendee>; the printed code is ticketCode(event, attendee)
    const fromQr = v.startsWith('RVUC:') ? raw.split(':') : null
    const who = fromQr
      ? fromQr[1] === e.id ? roster.find((a) => a.id === fromQr[2]) : undefined
      : roster.find((a) => ticketCode(e.id, a.id) === v.replace(/\s/g, '').replace(/^(\w{3})(\w{3})$/, '$1-$2'))
    if (!who) return setMsg({ ok: false, text: fromQr && fromQr[1] !== e.id ? 'That pass is for a different event.' : 'No seat matches that code. Check the letters, or the event selected.' })
    if (inList.includes(who.id)) return setMsg({ ok: false, text: `${who.name} is already checked in.` })
    checkIn(e.id, who.id)
    setMsg({ ok: true, text: `${who.name} checked in.` })
    setCode('')
  }

  if (candidates.length === 0) return <EmptyState title="No events to check in" body="Check-in opens for events in the two weeks around today." />

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="grid content-start gap-5">
        <div className="field-wrap grid gap-1.5">
          <label htmlFor={`${f}-ev`} className="text-sm">Event</label>
          <select id={`${f}-ev`} className="field" value={eventId} onChange={(x) => { setEventId(x.target.value); setMsg(null) }}>
            {candidates.map((c) => <option key={c.id} value={c.id}>{c.title} · {dayMonth(c.start)}</option>)}
          </select>
        </div>

        {scanning ? <Scanner onCode={(v) => { accept(v); setScanning(false) }} onClose={() => setScanning(false)} /> : (
          <button className="btn btn-gold justify-self-start" onClick={() => setScanning(true)}><Icon name="camera" className="h-4 w-4" /> Scan entry pass</button>
        )}

        <form className="grid gap-1.5" onSubmit={(x) => { x.preventDefault(); accept(code) }}>
          <label htmlFor={`${f}-code`} className="text-sm">Or type the six-letter code</label>
          <div className="flex gap-2">
            <input id={`${f}-code`} className="field font-num uppercase tracking-[0.2em]" autoComplete="off" placeholder="ABC-DEF" maxLength={7} value={code} onChange={(x) => setCode(x.target.value)} />
            <button className="btn" type="submit">Check in</button>
          </div>
        </form>
        <p role="status" aria-live="polite" className={`min-h-6 text-sm ${msg?.ok ? 'text-gold' : 'alert-mark text-alert'}`}>{msg?.text}</p>
      </section>

      <section>
        <div className="flex items-baseline justify-between border-b border-line pb-2">
          <h2 className="eyebrow">At the door</h2>
          <p className="text-sm"><Num className="text-gold">{inList.length}</Num> of <Num>{roster.length}</Num> in</p>
        </div>
        <ul>
          {roster.map((a) => {
            const inn = inList.includes(a.id)
            return (
              <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-line py-2.5">
                <span className={`truncate ${inn ? '' : 'text-mute'}`}>{a.name}</span>
                <Num className="text-xs text-mute">{e && ticketCode(e.id, a.id)}</Num>
                <button className="chip !py-1" aria-pressed={inn} onClick={() => (inn ? undoCheckIn(eventId, a.id) : checkIn(eventId, a.id))}>{inn ? 'In' : 'Mark in'}</button>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-xs text-mute">Showing up to 12 names in this prototype. Attendance feeds each student’s participation history.</p>
      </section>
    </div>
  )
}

function Scanner({ onCode, onClose }: { onCode: (v: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    const Ctor = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector
    if (!Ctor) { setErr('This browser can’t read QR codes from the camera. Type the code instead.'); return }
    let stream: MediaStream | undefined
    let raf = 0
    let live = true
    const det = new Ctor({ formats: ['qr_code'] })
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } }).then((s) => {
      stream = s
      if (!video.current || !live) return
      video.current.srcObject = s
      void video.current.play()
      const tick = async () => {
        if (!live || !video.current) return
        try {
          const found = await det.detect(video.current)
          if (found[0]) return onCode(found[0].rawValue)
        } catch { /* frame not ready */ }
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }).catch(() => setErr('Camera access was blocked. Type the code instead.'))
    return () => { live = false; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()) }
  }, [onCode])
  return (
    <div className="grid gap-3">
      <div className="relative aspect-square max-w-sm overflow-hidden border border-line-strong bg-black">
        <video ref={video} muted playsInline className="h-full w-full object-cover" />
        <div aria-hidden className="absolute inset-[18%] border-2 border-gold" />
        {err && <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm">{err}</p>}
      </div>
      <button className="btn justify-self-start" onClick={onClose}>Stop camera</button>
    </div>
  )
}

/* ---------- Archive ---------- */

async function shrink(file: File): Promise<string> {
  const img = await createImageBitmap(file)
  const scale = Math.min(1, 900 / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * scale)
  c.height = Math.round(img.height * scale)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.72)
}

function ArchivePanel({ clubId }: { clubId: string }) {
  const cat = useCatalog()
  const { addPhotos, removePhoto, eventPhotos } = useStore()
  const past = cat.pastEvents.filter((e) => e.hostId === clubId)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  if (past.length === 0) return <EmptyState title="No past events yet" body="After an event ends it appears here, ready for photographs and a short recap." />

  const upload = async (eventId: string, files: FileList | null) => {
    if (!files?.length) return
    setBusy(eventId); setErr('')
    try {
      const photos: Photo[] = await Promise.all([...files].slice(0, 6).map(async (file, i) => ({ id: `u-${Date.now()}-${i}`, src: await shrink(file), caption: file.name.replace(/\.[^.]+$/, '') })))
      addPhotos(eventId, photos)
    } catch {
      setErr('One of those files isn’t an image we can read.')
    } finally { setBusy('') }
  }

  return (
    <div className="grid gap-12">
      <p role="status" className="alert-mark text-sm text-alert">{err}</p>
      {past.map((e) => (
        <section key={e.id} className="grid gap-4 md:grid-cols-[16rem_1fr]">
          <div>
            <Num className="text-sm text-gold">{longDate(e.start)}</Num>
            <h2 className="mt-1 text-2xl">{e.title}</h2>
            <p className="mt-2 text-sm text-mute"><Num>{(e.photos ?? []).length}</Num> frames</p>
            <label className="btn btn-sm mt-4 cursor-pointer">
              <Icon name="image" className="h-4 w-4" /> {busy === e.id ? 'Adding…' : 'Add photographs'}
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(x) => upload(e.id, x.target.files)} />
            </label>
          </div>
          <ContactSheet photos={e.photos ?? []} onRemove={(pid) => (eventPhotos[e.id] ?? []).some((p) => p.id === pid) && removePhoto(e.id, pid)} />
        </section>
      ))}
    </div>
  )
}
