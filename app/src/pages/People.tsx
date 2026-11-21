import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useId, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Dialog, EmptyState, ErrorState, Icon, ListSkeleton, Monogram, Num, PageHeader, SectionTitle } from '../components/ui'
import {
  CATEGORIES,
  COMMITMENTS,
  REWARDS,
  SCHOOLS,
  WORK_MODES,
  type BoardPost,
  type Category,
  type Commitment,
  type PostKind,
  type Reward,
  type School,
  type Student,
  type WorkMode,
} from '../data/types'
import { daysFrom, longDate } from '../lib/format'
import { meAsStudent, skillMatch, useCatalog } from '../lib/catalog'
import { href } from '../lib/router'
import { useQuery, useStore } from '../lib/store'

gsap.registerPlugin(useGSAP, Flip, ScrollTrigger, SplitText)

/**
 * People: the board.
 * Signature (see DESIGN.md): billing order. Every ask is ranked by how much it
 * needs *you*, then shown and animated in that order: Lead 01, Supporting 02–03,
 * Ensemble 04+. Motion is the hierarchy playing out, never decoration.
 */

type Tab = 'seeking' | 'offering' | 'people'
const TAB_KEY = 'rvu-connect:people-tab'
const MOTION = '(prefers-reduced-motion: no-preference)'
const pad = (n: number) => String(n).padStart(2, '0')

export default function People({ id }: { id?: string }) {
  const { studentById, postById } = useCatalog()
  const { profile } = useStore()
  if (id && postById(id)) return <Board openId={id} />
  if (id) {
    const s = id === 'me' && profile ? meAsStudent(profile) : studentById(id)
    if (!s)
      return (
        <div className="py-16">
          <EmptyState title="We can’t find that student" body="They may have hidden their profile." action={<a className="btn" href={href('people')}>The board</a>} />
        </div>
      )
    return <Person s={s} />
  }
  return <Board />
}

/* ------------------------------------------------------------------ */
/* Billing: the ranking that drives layout and motion                  */
/* ------------------------------------------------------------------ */

interface Billed {
  post: BoardPost
  rank: number
  score: number
  /** Why it is billed here, in plain words. At most three. */
  reasons: string[]
  fit: string[]
}

const firstName = (n: string) => n.split(/\s+/)[0]
const shortSchool = (s: School) => s.replace('School of ', '')

function ago(d: Date) {
  const n = -daysFrom(d)
  if (n <= 0) return 'Today'
  if (n === 1) return 'Yesterday'
  if (n < 7) return `${n} days ago`
  return longDate(d)
}

function closing(d?: Date) {
  if (!d) return null
  const n = daysFrom(d)
  if (n < 0) return { label: 'Closed', soon: false, closed: true, days: n }
  if (n === 0) return { label: 'Closes today', soon: true, closed: false, days: n }
  if (n === 1) return { label: 'Closes tomorrow', soon: true, closed: false, days: n }
  return { label: `Closes in ${n} days`, soon: n <= 4, closed: false, days: n }
}

function bill(posts: BoardPost[], skills: string[], interests: Category[], myHands: Record<string, unknown>): Billed[] {
  const mine = new Set(skills.map((s) => s.toLowerCase()))
  return posts
    .map((p) => {
      const fit = skillMatch(skills, p.skills)
      const c = closing(p.closes)
      const hands = p.hands.length + (myHands[p.id] ? 1 : 0)
      const reasons: string[] = []
      let score = 0
      if (p.kind === 'seeking') {
        if (fit.length) {
          score += (3 * fit.length) / p.skills.length
          reasons.push(`You have ${fit.length} of the ${p.skills.length} skills`)
        }
        if (c && !c.closed) {
          score += 2 * Math.max(0, 1 - c.days / 14)
          if (c.soon) reasons.push(c.label)
        }
        if (p.urgent && !c?.closed) {
          score += 0.8
          reasons.push('Marked urgent')
        }
        const open = Math.max(0, p.spots - hands)
        if (!hands) {
          score += 0.5
          reasons.push('No hands raised yet')
        } else if (open) {
          score += 0.3
          reasons.push(`${open} of ${p.spots} ${p.spots === 1 ? 'spot' : 'spots'} still open`)
        }
      } else {
        const gaps = p.skills.filter((k) => !mine.has(k.toLowerCase()))
        if (skills.length && gaps.length) {
          score += Math.min(2, gaps.length) * 0.9
          reasons.push(`Teaches ${gaps.slice(0, 2).join(' and ')}, not on your profile`)
        }
        if (hands === 0) {
          score += 0.4
          reasons.push('Nobody has asked yet')
        }
      }
      if (interests.includes(p.category)) {
        score += 0.6
        reasons.push(`In ${p.category}, which you follow`)
      }
      score += Math.max(0, 1 - -daysFrom(p.posted) / 10) * 0.5
      if (c?.closed) score -= 100
      return { post: p, score, reasons: reasons.slice(0, 3), fit, rank: 0 }
    })
    .sort((a, b) => b.score - a.score)
    .map((b, i) => ({ ...b, rank: i + 1 }))
}

/** Billing for one kind, excluding your own posts (they are not competing for you). */
function useBilling(kind: PostKind) {
  const { posts } = useCatalog()
  const { profile, hands } = useStore()
  return useMemo(
    () => bill(posts.filter((p) => p.kind === kind && p.authorId !== 'me'), profile?.skills ?? [], profile?.interests ?? [], hands),
    [posts, kind, profile, hands],
  )
}

function useAuthor() {
  const { studentById } = useCatalog()
  const { profile } = useStore()
  return (id: string): Student | undefined => (id === 'me' ? (profile ? meAsStudent(profile) : undefined) : studentById(id))
}

/* ------------------------------------------------------------------ */
/* The board                                                           */
/* ------------------------------------------------------------------ */

function Board({ openId }: { openId?: string }) {
  const { posts, students, postById } = useCatalog()
  const { profile, publishPost } = useStore()
  const [tab, setTabState] = useState<Tab>(() => {
    const p = openId ? postById(openId) : undefined
    if (p) return p.kind
    try {
      const t = sessionStorage.getItem(TAB_KEY)
      if (t === 'seeking' || t === 'offering' || t === 'people') return t
    } catch {
      /* storage blocked: default tab */
    }
    return 'seeking'
  })
  const tabsRef = useRef<HTMLDivElement>(null)
  const setTab = (t: Tab) => {
    // The underline travels to the new tab (Flip), so the change reads as one motion.
    const bar = tabsRef.current?.querySelector('[data-tab-bar]')
    const state = bar ? Flip.getState(bar) : null
    setTabState(t)
    try {
      sessionStorage.setItem(TAB_KEY, t)
    } catch {
      /* fine */
    }
    if (state) requestAnimationFrame(() => {
      const next = tabsRef.current?.querySelector('[data-tab-bar]')
      if (next) Flip.from(state, { targets: next, duration: 0.55, ease: 'expo.out' })
    })
  }
  const [open, setOpen] = useState<string | null>(openId ?? null)
  const [composing, setComposing] = useState<PostKind | null>(null)
  const [fresh, setFresh] = useState<string | null>(null)

  const asks = useBilling('seeking')
  const offers = useBilling('offering')
  const billing = tab === 'offering' ? offers : asks
  const lead = billing.find((b) => !closing(b.post.closes)?.closed)
  const openBilled = open ? [...asks, ...offers].find((b) => b.post.id === open) : undefined
  const openPost = open ? postById(open) : undefined

  const hero = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION, () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
        const h1 = hero.current?.querySelector('h1')
        if (h1) {
          SplitText.create(h1, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            onSplit: (self) => tl.from(self.lines, { yPercent: 110, duration: 1.15, stagger: 0.09 }, 0),
          })
        }
        tl.from('[data-hero=slate]', { opacity: 0, x: -12, duration: 0.6 }, 0)
        tl.from('[data-hero=fade]', { opacity: 0, y: 14, duration: 0.8, stagger: 0.08 }, 0.35)
        // Numbers roll up last: they are supporting facts, billed after the headline.
        hero.current?.querySelectorAll<HTMLElement>('[data-count]').forEach((el, i) => {
          const to = Number(el.dataset.count)
          const o = { v: 0 }
          tl.to(o, { v: to, duration: 1.1, ease: 'power3.out', onUpdate: () => (el.textContent = pad(Math.round(o.v))) }, 0.7 + i * 0.1)
        })
      })
    },
    { scope: hero },
  )

  const publish = (p: BoardPost) => {
    setComposing(null)
    publishPost(p)
    if (tab !== p.kind) setTab(p.kind)
    setFresh(p.id)
    requestAnimationFrame(() => document.getElementById('yours')?.scrollIntoView({ behavior: matchMedia(MOTION).matches ? 'smooth' : 'auto', block: 'start' }))
  }

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: 'seeking', label: 'Asks', n: asks.length },
    { id: 'offering', label: 'Offers', n: offers.length },
    { id: 'people', label: 'People', n: students.length },
  ]
  const openAsks = asks.filter((b) => !closing(b.post.closes)?.closed).length
  const collaborators = students.filter((s) => s.openToCollaborate).length

  return (
    <div className="pb-16">
      <header ref={hero} className="grid gap-10 border-b border-line pt-8 pb-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-end md:gap-12 md:pt-14 md:pb-14">
        <div className="min-w-0">
          <p className="slate-no" data-hero="slate">Scene 06 · People</p>
          <h1 className="mt-4 text-[clamp(2.4rem,1.5rem+3.2vw,4.8rem)] leading-[1.02] tracking-[-0.02em]">
            Who needs <em className="text-gold">a hand</em> this week.
          </h1>
          <p data-hero="fade" className="mt-5 max-w-[46ch] leading-relaxed text-mute">
            Every ask on campus, billed by how much it needs you: your skills, the deadline and the spots still open. Post your own the way a team posts an opening.
          </p>
          <div data-hero="fade" className="mt-7 flex flex-wrap gap-3">
            <button type="button" className="btn btn-gold" disabled={!profile} onClick={() => setComposing('seeking')}>
              <Icon name="plus" className="h-4 w-4" /> {profile ? 'Post an ask' : 'Sign in to post'}
            </button>
            <button type="button" className="btn" disabled={!profile} onClick={() => setComposing('offering')}>Offer your skills</button>
          </div>
          <dl className="mt-10 grid max-w-sm grid-cols-3 gap-4 border-t border-line pt-5">
            {(
              [
                ['Open asks', openAsks],
                ['Offering', offers.length],
                ['Open to build', collaborators],
              ] as const
            ).map(([k, v]) => (
              <div key={k} data-hero="fade" className="min-w-0">
                <dt className="eyebrow !text-[0.6rem]">{k}</dt>
                <dd className="num mt-1 text-3xl" data-count={v}>{pad(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="min-w-0">
          {tab === 'people' ? (
            <DemandPlate key="people" />
          ) : lead ? (
            <LeadPlate key={`${tab}-${lead.post.id}`} b={lead} total={billing.length} onOpen={() => setOpen(lead.post.id)} />
          ) : (
            <div className="border border-dashed border-line-strong p-8 text-mute">Nothing is billed yet. Post the first one.</div>
          )}
        </div>
      </header>

      <div ref={tabsRef} role="tablist" aria-label="Board" className="no-scrollbar mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            className={`relative shrink-0 px-4 pt-2 pb-3 text-sm transition-colors ${tab === t.id ? 'text-paper' : 'text-mute hover-gold'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label} <Num className="ml-1.5 text-xs text-mute">{pad(t.n)}</Num>
            {tab === t.id && <span data-tab-bar data-flip-id="tab-bar" className="absolute inset-x-0 -bottom-px h-0.5 bg-gold" />}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-6">
        {tab === 'people' ? (
          <Directory students={students} />
        ) : (
          <Listing
            key={tab}
            kind={tab}
            billing={billing}
            leadId={lead?.post.id}
            mine={posts.filter((p) => p.kind === tab && p.authorId === 'me')}
            fresh={fresh}
            onOpen={setOpen}
            onCompose={() => setComposing(tab)}
          />
        )}
      </div>

      <Dialog open={!!openPost} onClose={() => setOpen(null)} variant="sheet" labelledBy="post-title">
        {openPost && <PostSheet post={openPost} billed={openBilled} total={(openPost.kind === 'seeking' ? asks : offers).length} onClose={() => setOpen(null)} />}
      </Dialog>
      <Dialog open={!!composing} onClose={() => setComposing(null)} variant="sheet" labelledBy="compose-title">
        {composing && <Composer kind={composing} onCancel={() => setComposing(null)} onPublish={publish} />}
      </Dialog>
    </div>
  )
}

/* ---------- Lead plate: billed 01, the one thing in gold ---------- */

function LeadPlate({ b, total, onOpen }: { b: Billed; total: number; onOpen: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const author = useAuthor()(b.post.authorId)
  const { profile, hands } = useStore()
  const p = b.post
  const seeking = p.kind === 'seeking'
  const raised = p.hands.length + (hands[p.id] ? 1 : 0)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION, () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.25 })
        // A slate wipe: gold bar crosses the plate and the lead is underneath.
        gsap.set('[data-lead=body]', { opacity: 0 })
        tl.fromTo('[data-lead=wipe]', { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.5, ease: 'power3.inOut' })
          .set('[data-lead=body]', { opacity: 1 })
          .to('[data-lead=wipe]', { scaleX: 0, transformOrigin: '100% 50%', duration: 0.6, ease: 'power3.inOut' })
          .from('[data-lead=rank]', { yPercent: 105, duration: 1.1 }, '<')
          .from('[data-lead=line]', { y: 16, opacity: 0, duration: 0.8, stagger: 0.06 }, '<0.1')
          .from('[data-seg]', { scaleX: 0, transformOrigin: '0% 50%', duration: 0.55, stagger: 0.12, ease: 'power2.out' }, '<0.25')
      })
    },
    { scope: ref },
  )

  return (
    <article ref={ref} className="lead-plate relative overflow-hidden border border-line-strong bg-slate-2">
      <span data-lead="wipe" aria-hidden className="absolute inset-0 z-[2] origin-left scale-x-0 bg-gold" />
      <div data-lead="body" className="relative">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 pt-5 pb-4 md:px-7">
          <p data-lead="line" className="slate-no">Billed {pad(1)} of {pad(total)} · {seeking ? 'Needs you most' : 'Best fit for you'}</p>
          {p.urgent && !closing(p.closes)?.closed && <span data-lead="line" className="tag tag-gold">Urgent</span>}
        </div>
        <div className="grid gap-x-6 px-5 pt-6 md:grid-cols-[auto_minmax(0,1fr)] md:px-7">
          <span className="block overflow-hidden" aria-hidden>
            <span data-lead="rank" className="lead-rank num block">01</span>
          </span>
          <div className="min-w-0">
            <h2 data-lead="line" className="text-[clamp(1.7rem,1.2rem+1.6vw,2.6rem)] leading-[1.08]">{p.title}</h2>
            {author && (
              <p data-lead="line" className="mt-3 text-sm text-mute">
                {author.name} · Year <Num>{author.year}</Num> · {shortSchool(author.school)}
              </p>
            )}
            {b.reasons.length > 0 && (
              <ul className="mt-5 space-y-1.5 text-sm">
                {b.reasons.map((r) => (
                  <li data-lead="line" key={r} className="flex items-baseline gap-3">
                    <span aria-hidden className="h-px w-5 shrink-0 translate-y-[-0.25em] bg-gold" /> {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div data-lead="line" className="mt-6 px-5 md:px-7">
          <FitMeter skills={p.skills} fit={b.fit} kind={p.kind} hasSkills={!!profile?.skills.length} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-4 md:px-7">
          <p data-lead="line" className="text-sm text-mute">
            {p.commitment} · {p.mode} · <Num>{raised}</Num> {raised === 1 ? 'hand' : 'hands'}
          </p>
          <button data-lead="line" type="button" className="btn btn-gold" onClick={onOpen}>
            {seeking ? 'Read the ask' : 'Read the offer'} <Icon name="arrow" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

/** One segment per skill. Gold where you match (asks) or where you would learn (offers). */
function FitMeter({ skills, fit, kind, hasSkills }: { skills: string[]; fit: string[]; kind: PostKind; hasSkills: boolean }) {
  const lit = (k: string) => (kind === 'seeking' ? fit.includes(k) : !fit.includes(k) && hasSkills)
  const n = skills.filter(lit).length
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow !text-[0.6rem]">{kind === 'seeking' ? 'Your fit' : 'New to you'}</p>
        {hasSkills ? (
          <p className="text-xs text-mute"><Num className="text-paper">{n}</Num> of <Num>{skills.length}</Num></p>
        ) : (
          <a href={href('profile')} className="hover-gold text-xs text-mute underline underline-offset-4">Add your skills to see your fit</a>
        )}
      </div>
      <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${skills.length}, minmax(0, 1fr))` }}>
        {skills.map((k) => (
          <div key={k} className="min-w-0">
            <span data-seg className={`block h-1.5 ${lit(k) ? 'bg-gold' : 'bg-line-strong'}`} />
            <span className={`mt-1.5 block truncate text-xs ${lit(k) ? 'text-paper' : 'text-mute'}`}>{k}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- People tab lead: what the campus is asking for ---------- */

function DemandPlate() {
  const ref = useRef<HTMLElement>(null)
  const { posts } = useCatalog()
  const { profile } = useStore()
  const mine = new Set((profile?.skills ?? []).map((s) => s.toLowerCase()))
  const demand = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of posts) if (p.kind === 'seeking' && !closing(p.closes)?.closed) for (const k of p.skills) m.set(k, (m.get(k) ?? 0) + p.spots)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [posts])
  const max = demand[0]?.[1] ?? 1

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION, () => {
        gsap
          .timeline({ defaults: { ease: 'expo.out' }, delay: 0.2 })
          .from('[data-d=line]', { y: 14, opacity: 0, duration: 0.7, stagger: 0.06 })
          .from('[data-d=bar]', { scaleX: 0, transformOrigin: '0% 50%', duration: 0.9, stagger: 0.08 }, '<0.15')
      })
    },
    { scope: ref },
  )

  return (
    <article ref={ref} className="border border-line-strong bg-slate-2">
      <p data-d="line" className="slate-no border-b border-line px-5 pt-5 pb-4 md:px-7">Most asked for · open spots by skill</p>
      <ol className="space-y-4 px-5 py-6 md:px-7">
        {demand.map(([k, n], i) => (
          <li key={k} data-d="line" className="grid grid-cols-[2rem_minmax(0,9rem)_1fr_2rem] items-center gap-3">
            <Num className="text-xs text-mute">{pad(i + 1)}</Num>
            <span className={`truncate text-sm ${mine.has(k.toLowerCase()) ? 'text-gold' : ''}`}>{k}</span>
            <span className="h-1.5 bg-line">
              <span data-d="bar" className={`block h-full ${i === 0 ? 'bg-gold' : 'bg-paper/40'}`} style={{ width: `${(n / max) * 100}%` }} />
            </span>
            <Num className="text-right text-sm">{n}</Num>
          </li>
        ))}
      </ol>
      <p data-d="line" className="border-t border-line px-5 py-4 text-sm text-mute md:px-7">Skills in gold are on your profile. Filter the people below by any of them.</p>
    </article>
  )
}

/* ---------- The listing: supporting, then ensemble ---------- */

type FlipState = ReturnType<typeof Flip.getState>

function Listing({
  kind,
  billing,
  leadId,
  mine,
  fresh,
  onOpen,
  onCompose,
}: {
  kind: PostKind
  billing: Billed[]
  leadId?: string
  mine: BoardPost[]
  fresh: string | null
  onOpen: (id: string) => void
  onCompose: () => void
}) {
  const q = useQuery(billing)
  const { profile } = useStore()
  const mySkills = useMemo(() => profile?.skills ?? [], [profile?.skills])
  const [text, setText] = useState('')
  const [cat, setCat] = useState<Category | null>(null)
  const [commit, setCommit] = useState<Commitment | ''>('')
  const [fits, setFits] = useState(false)
  const [sort, setSort] = useState<'billing' | 'new' | 'closing'>('billing')
  const filtered = !!(text || cat || commit || fits)
  const root = useRef<HTMLDivElement>(null)
  const flip = useRef<FlipState | null>(null)

  /** Capture positions, then change: the layout effect below plays the re-billing. */
  const change = (fn: () => void) => {
    if (root.current && matchMedia(MOTION).matches) flip.current = Flip.getState(root.current.querySelectorAll('[data-flip-id]'))
    fn()
  }

  const list = useMemo(() => {
    const t = text.trim().toLowerCase()
    const out = (q.data ?? []).filter(({ post: p }) => {
      if (p.id === leadId) return false
      if (cat && p.category !== cat) return false
      if (commit && p.commitment !== commit) return false
      if (fits && !skillMatch(mySkills, p.skills).length) return false
      if (t && !`${p.title} ${p.body} ${p.skills.join(' ')}`.toLowerCase().includes(t)) return false
      return true
    })
    if (sort === 'new') out.sort((a, b) => +b.post.posted - +a.post.posted)
    if (sort === 'closing') out.sort((a, b) => (a.post.closes ? +a.post.closes : Infinity) - (b.post.closes ? +b.post.closes : Infinity))
    return out
  }, [q.data, text, cat, commit, fits, sort, mySkills, leadId])

  useLayoutEffect(() => {
    const state = flip.current
    if (!state || !root.current) return
    flip.current = null
    Flip.from(state, {
      targets: root.current.querySelectorAll('[data-flip-id]'),
      duration: 0.7,
      ease: 'expo.out',
      scale: true,
      stagger: 0.015,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.04, ease: 'expo.out' }),
    })
  }, [list])

  // First reveal: billed order, top to bottom, as rows come into view.
  useGSAP(
    () => {
      if (q.status !== 'ready') return
      const mm = gsap.matchMedia()
      mm.add(MOTION, () => {
        const rows = gsap.utils.toArray<HTMLElement>('[data-reveal]')
        gsap.set(rows, { opacity: 0, y: 26 })
        ScrollTrigger.batch(rows, {
          start: 'top 92%',
          once: true,
          onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out', overwrite: true }),
        })
      })
    },
    { scope: root, dependencies: [q.status] },
  )

  const supporting = sort === 'billing' && !filtered ? list.slice(0, 2) : []
  const ensemble = sort === 'billing' && !filtered ? list.slice(2) : list
  const word = kind === 'seeking' ? 'asks' : 'offers'

  return (
    <div ref={root}>
      <div className="grid gap-3 md:grid-cols-[1fr_13rem_12rem] md:items-end">
        <label className="relative block">
          <span className="sr-only">Search {word}</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute" />
          <input className="field pl-10" type="search" placeholder={kind === 'seeking' ? 'Try “ESP32”, “illustrator” or “pitch”' : 'What do you need help with?'} value={text} onChange={(e) => change(() => setText(e.target.value))} />
        </label>
        <label className="block">
          <span className="sr-only">Commitment</span>
          <select className="field" value={commit} onChange={(e) => change(() => setCommit(e.target.value as Commitment | ''))}>
            <option value="">Any commitment</option>
            {COMMITMENTS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Order</span>
          <select className="field" value={sort} onChange={(e) => change(() => setSort(e.target.value as typeof sort))}>
            <option value="billing">Billing: needs you most</option>
            <option value="new">Newest first</option>
            {kind === 'seeking' && <option value="closing">Closing soon</option>}
          </select>
        </label>
      </div>
      <div role="group" aria-label="Area" className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {mySkills.length > 0 && kind === 'seeking' && (
          <button type="button" className="chip shrink-0" aria-pressed={fits} onClick={() => change(() => setFits(!fits))}>
            <Icon name="check" className="h-3.5 w-3.5" /> Fits my skills
          </button>
        )}
        <button type="button" className="chip shrink-0" aria-pressed={!cat} onClick={() => change(() => setCat(null))}>Every area</button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className="chip shrink-0" aria-pressed={cat === c} onClick={() => change(() => setCat(cat === c ? null : c))}>{c}</button>
        ))}
      </div>

      {mine.length > 0 && (
        <section id="yours" aria-labelledby="yours-title" className="mt-10 scroll-mt-28">
          <SectionTitle id="yours-title" title="Yours" count={mine.length} />
          <ul className="divide-y divide-line border-y border-line">
            {mine.map((p) => (
              <li key={p.id} data-flip-id={p.id}>
                <EnsembleRow post={p} label="You" fresh={fresh === p.id} onOpen={() => onOpen(p.id)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10">
        {q.status === 'loading' ? (
          <ListSkeleton rows={4} />
        ) : q.status === 'error' ? (
          <ErrorState onRetry={q.retry} />
        ) : list.length ? (
          <>
            {supporting.length > 0 && (
              <section aria-labelledby="supporting">
                <p id="supporting" className="slate-no mb-3">Supporting · billed {pad(supporting[0].rank)}–{pad(supporting[supporting.length - 1].rank)}</p>
                <ul className="divide-y divide-line border-y border-line-strong">
                  {supporting.map((b) => (
                    <li key={b.post.id} data-flip-id={b.post.id} data-reveal>
                      <SupportingRow b={b} onOpen={() => onOpen(b.post.id)} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {ensemble.length > 0 && (
              <section aria-labelledby="ensemble" className={supporting.length ? 'mt-12' : ''}>
                <p id="ensemble" className="slate-no mb-3 !text-mute">{supporting.length ? 'Also on the board' : filtered ? `${pad(ensemble.length)} ${word} match` : sort === 'new' ? 'Newest first' : 'Closing soonest first'}</p>
                <ul className="divide-y divide-line border-y border-line">
                  {ensemble.map((b) => (
                    <li key={b.post.id} data-flip-id={b.post.id} data-reveal>
                      <EnsembleRow post={b.post} label={pad(b.rank)} onOpen={() => onOpen(b.post.id)} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : filtered ? (
          <EmptyState
            title={`No other ${word} match`}
            body="Try a broader word, or clear the filters. The lead above is always shown."
            action={<button type="button" className="btn" onClick={() => change(() => { setText(''); setCat(null); setCommit(''); setFits(false) })}>Clear filters</button>}
          />
        ) : (
          <EmptyState
            title={kind === 'seeking' ? 'Only one ask so far' : 'Only one offer so far'}
            body={kind === 'seeking' ? 'Say what you are building and who you need; it gets billed the moment you post.' : 'Put up what you are good at, and let a project find you.'}
            action={profile ? <button type="button" className="btn btn-gold" onClick={onCompose}>{kind === 'seeking' ? 'Post an ask' : 'Offer your skills'}</button> : undefined}
          />
        )}
      </div>
    </div>
  )
}

/** Billed 02–03: bigger type, the reasons spelled out. */
function SupportingRow({ b, onOpen }: { b: Billed; onOpen: () => void }) {
  const author = useAuthor()(b.post.authorId)
  const { profile } = useStore()
  const p = b.post
  const c = closing(p.closes)
  return (
    <button type="button" onClick={onOpen} className="bill-row group grid w-full gap-x-8 gap-y-4 py-7 text-left md:grid-cols-[5.5rem_minmax(0,1fr)_17rem] md:py-9">
      <span className="bill-rank num text-5xl md:text-6xl" aria-label={`Billed ${b.rank}`}>{pad(b.rank)}</span>
      <span className="min-w-0">
        <span className="bill-title block font-display text-[clamp(1.5rem,1.2rem+1vw,2.1rem)] leading-tight">{p.title}</span>
        <span className="mt-2 block text-sm text-mute">{author ? `${author.name} · ${shortSchool(author.school)}` : 'A student'} · {ago(p.posted)}</span>
        <span className="mt-3 line-clamp-2 block max-w-[62ch] text-sm leading-relaxed text-mute">{p.body}</span>
        {b.reasons.length > 0 && (
          <span className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {b.reasons.map((r) => (
              <span key={r} className="inline-flex items-baseline gap-2"><span aria-hidden className="h-px w-3 translate-y-[-0.25em] bg-gold" />{r}</span>
            ))}
          </span>
        )}
      </span>
      <span className="min-w-0 space-y-4 md:border-l md:border-line md:pl-6">
        <FitMeter skills={p.skills} fit={b.fit} kind={p.kind} hasSkills={!!profile?.skills.length} />
        <span className="grid grid-cols-2 gap-3 text-xs">
          <Fact k="Time" v={p.commitment} />
          <Fact k={c ? 'Closes' : 'Where'} v={c ? c.label.replace('Closes ', '') : p.mode} hot={c?.soon} />
        </span>
      </span>
    </button>
  )
}

/** Billed 04+: one dense line each. */
function EnsembleRow({ post: p, label, fresh = false, onOpen }: { post: BoardPost; label: string; fresh?: boolean; onOpen: () => void }) {
  const author = useAuthor()(p.authorId)
  const { profile, hands } = useStore()
  const match = skillMatch(profile?.skills ?? [], p.skills)
  const c = closing(p.closes)
  const raised = p.hands.length + (hands[p.id] ? 1 : 0)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`bill-row group grid w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-4 text-left md:grid-cols-[3rem_minmax(0,1fr)_minmax(0,14rem)_9rem_4.5rem] ${fresh ? 'bill-fresh' : ''} ${c?.closed ? 'opacity-55' : ''}`}
    >
      <span className={`bill-rank num text-sm ${label === 'You' ? 'text-gold' : ''}`}>{label}</span>
      <span className="min-w-0">
        <span className="bill-title block truncate text-[1.05rem]">{p.title}</span>
        <span className="block truncate text-xs text-mute">{author?.name ?? 'A student'} · {p.category}</span>
      </span>
      <span className="col-start-2 row-start-2 flex min-w-0 flex-wrap gap-1.5 md:col-start-auto md:row-start-auto">
        {p.skills.slice(0, 3).map((k) => <span key={k} className={match.includes(k) ? 'tag tag-gold' : 'tag'}>{k}</span>)}
      </span>
      <span className={`hidden text-xs md:block ${c?.soon ? 'text-gold' : 'text-mute'}`}>{c ? c.label : p.commitment}</span>
      <span className="row-span-2 flex items-center justify-end gap-2 text-xs text-mute md:row-span-1">
        <Hand className="h-4 w-4" /> <Num>{raised}</Num>
        <Icon name="arrow" className="bill-arrow h-4 w-4" />
      </span>
    </button>
  )
}

const Fact = ({ k, v, hot = false }: { k: string; v: string; hot?: boolean }) => (
  <span className="min-w-0">
    <span className="eyebrow block !text-[0.58rem]">{k}</span>
    <span className={`mt-1 block truncate ${hot ? 'text-gold' : ''}`}>{v}</span>
  </span>
)

/** A raised hand: the board's "I'm in". */
const Hand = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square">
    <path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4a1.5 1.5 0 0 1 3 0v6.5M14 10.5V5.5a1.5 1.5 0 0 1 3 0V13M8 12V9.5a1.5 1.5 0 0 0-3 0V14c0 4 2.5 6.5 6.5 6.5S17 18 17 14v-1" />
  </svg>
)

/* ------------------------------------------------------------------ */
/* One post, in a sheet                                                */
/* ------------------------------------------------------------------ */

function PostSheet({ post: p, billed, total, onClose }: { post: BoardPost; billed?: Billed; total: number; onClose: () => void }) {
  const author = useAuthor()
  const a = author(p.authorId)
  const { profile, hands, raiseHand, lowerHand, deletePost } = useStore()
  const { projectById } = useCatalog()
  const [note, setNote] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const mine = p.authorId === 'me'
  const mineHand = hands[p.id]
  const fit = skillMatch(profile?.skills ?? [], p.skills)
  const close = closing(p.closes)
  const project = p.projectId ? projectById(p.projectId) : undefined
  const seeking = p.kind === 'seeking'
  const people = p.hands.map((h) => author(h)).filter(Boolean) as Student[]
  const noteId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const myMono = useRef<HTMLLIElement>(null)
  const flyFrom = useRef<DOMRect | null>(null)
  const count = people.length + (mineHand ? 1 : 0)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION, () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 })
        tl.from('[data-s=rank]', { yPercent: 105, duration: 1 })
        const h = ref.current?.querySelector('#post-title')
        if (h) SplitText.create(h, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: (self) => tl.from(self.lines, { yPercent: 110, duration: 0.9, stagger: 0.07 }, 0.1) })
        tl.from('[data-s=line]', { y: 14, opacity: 0, duration: 0.7, stagger: 0.05 }, 0.3)
        tl.from('[data-seg]', { scaleX: 0, transformOrigin: '0% 50%', duration: 0.5, stagger: 0.1, ease: 'power2.out' }, 0.55)
      })
    },
    { scope: ref },
  )

  // Your monogram flies from the button into the line-up of raised hands.
  useLayoutEffect(() => {
    const from = flyFrom.current
    const el = myMono.current
    if (!mineHand || !from || !el || !matchMedia(MOTION).matches) return
    flyFrom.current = null
    const to = el.getBoundingClientRect()
    gsap.from(el, { x: from.left + from.width / 2 - (to.left + to.width / 2), y: from.top - to.top, scale: 1.8, duration: 1, ease: 'expo.out' })
    gsap.from(ref.current?.querySelector('[data-s=count]') ?? [], { yPercent: -100, opacity: 0, duration: 0.6, ease: 'expo.out' })
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [mineHand])

  return (
    <div ref={ref} className="flex h-full flex-col">
      <div className="flex shrink-0 items-end justify-between gap-4 border-b border-line px-5 pt-6 pb-4 md:px-7">
        <div className="flex items-end gap-4">
          <span className="block overflow-hidden" aria-hidden>
            <span data-s="rank" className={`num block text-6xl leading-none ${billed?.rank === 1 ? 'text-gold' : 'text-paper'}`}>{billed ? pad(billed.rank) : '—'}</span>
          </span>
          <p className={`slate-no pb-1 ${seeking ? '' : '!text-teal-bright'}`}>
            {billed ? <>Billed {pad(billed.rank)} of {pad(total)}<br /></> : mine ? <>Your post<br /></> : null}
            {seeking ? `Seeking · ${p.spots} ${p.spots === 1 ? 'spot' : 'spots'}` : 'Offering'} · {p.category}
          </p>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 md:px-7">
        <h2 id="post-title" className="text-3xl leading-tight md:text-4xl">{p.title}</h2>
        {a && (
          <a data-s="line" href={href(`people/${a.id}`)} className="row-hover mt-5 flex items-center gap-3 border border-line p-3">
            <Monogram text={a.name} size="sm" gold={mine} />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{a.name}</span>
              <span className="block truncate text-xs text-mute">Year <Num>{a.year}</Num> · {shortSchool(a.school)}</span>
            </span>
            <Icon name="arrow" className="h-4 w-4 text-mute" />
          </a>
        )}
        {billed && billed.reasons.length > 0 && (
          <ul className="mt-6 space-y-1.5 border-l-2 border-gold pl-4 text-sm">
            {billed.reasons.map((r) => <li data-s="line" key={r}>{r}</li>)}
          </ul>
        )}
        <p data-s="line" className="mt-6 max-w-[62ch] leading-relaxed whitespace-pre-line">{p.body}</p>

        <div data-s="line" className="mt-7">
          <FitMeter skills={p.skills} fit={fit} kind={p.kind} hasSkills={!!profile?.skills.length} />
        </div>

        <dl data-s="line" className="mt-7 grid grid-cols-2 gap-px border border-line bg-line text-sm">
          {(
            [
              ['Time', p.commitment, false],
              ['Where', p.mode, false],
              ['Posted', ago(p.posted), false],
              [seeking ? 'Applications' : 'Status', close ? close.label : 'Open', !!close?.soon],
            ] as const
          ).map(([k, v, hot]) => (
            <div key={k} className="bg-slate-2 p-3">
              <dt className="eyebrow !text-[0.6rem]">{k}</dt>
              <dd className={`mt-1 ${hot ? 'text-gold' : ''}`}>{v}</dd>
            </div>
          ))}
        </dl>

        <section data-s="line" className="mt-7">
          <p className="eyebrow">{seeking ? 'What you get' : 'Asks in return'}</p>
          <ul className="mt-3 space-y-2">
            {p.rewards.map((r) => <li key={r} className="flex items-center gap-2 text-sm"><Icon name="check" className="h-4 w-4 text-gold" /> {r}</li>)}
          </ul>
        </section>
        {project && (
          <a data-s="line" href={href(`projects/${project.id}`)} className="row-hover mt-7 flex items-center justify-between gap-4 border-y border-line py-4">
            <span className="min-w-0">
              <span className="eyebrow block">Project</span>
              <span className="mt-1 block truncate font-display text-xl">{project.name}</span>
            </span>
            <Icon name="arrow" />
          </a>
        )}
        <section data-s="line" className="mt-7">
          <p className="eyebrow">Raised hands <span className="inline-block overflow-hidden align-bottom"><span className="num ml-1 inline-block" data-s="count">{count}</span></span></p>
          {count ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {mineHand && profile && <li ref={myMono} title="You"><Monogram text={profile.name} size="sm" gold /></li>}
              {people.map((s) => <li key={s.id} title={s.name}><a href={href(`people/${s.id}`)}><Monogram text={s.name} size="sm" /></a></li>)}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-mute">No one yet. The first hand gets noticed.</p>
          )}
        </section>
      </div>

      <div className="shrink-0 border-t border-line bg-slate-2 px-5 py-4 md:px-7" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        {mine ? (
          confirmDelete ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="flex-1 text-sm">Take this post down? Raised hands go with it.</p>
              <button type="button" className="btn btn-sm" onClick={() => setConfirmDelete(false)}>Keep it</button>
              <button type="button" className="btn btn-sm border-[#e0795f] text-[#e0795f]" onClick={() => { deletePost(p.id); onClose() }}>Take down</button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-mute">Your post. People who raise a hand appear above.</p>
              <button type="button" className="btn btn-sm" onClick={() => setConfirmDelete(true)}><Icon name="trash" className="h-4 w-4" /> Take down</button>
            </div>
          )
        ) : mineHand ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1 text-sm"><Hand className="mr-1 inline h-4 w-4 text-gold" /> Hand raised. {a ? firstName(a.name) : 'They'} can see your profile and links.</p>
            <button type="button" className="btn btn-sm" onClick={() => lowerHand(p.id)}>Lower it</button>
          </div>
        ) : !profile ? (
          <p className="text-sm text-mute">Sign in to raise your hand.</p>
        ) : close?.closed ? (
          <p className="text-sm text-mute">This post is closed.</p>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              flyFrom.current = (e.nativeEvent as SubmitEvent).submitter?.getBoundingClientRect() ?? null
              raiseHand(p.id, note.trim())
            }}
          >
            <label htmlFor={noteId} className="sr-only">A line about you</label>
            <input id={noteId} className="field" maxLength={160} placeholder={seeking ? 'One line on why you (optional)' : 'What you need help with (optional)'} value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="submit" className="btn btn-gold"><Hand className="h-4 w-4" /> {seeking ? 'Raise your hand' : `Ask ${a ? firstName(a.name) : 'them'} for help`}</button>
          </form>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Writing a post                                                      */
/* ------------------------------------------------------------------ */

function Composer({ kind: initial, onCancel, onPublish }: { kind: PostKind; onCancel: () => void; onPublish: (p: BoardPost) => void }) {
  const { profile, myProjects } = useStore()
  const [kind, setKind] = useState<PostKind>(initial)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [skills, setSkills] = useState<string[]>(kind === 'offering' ? (profile?.skills ?? []).slice(0, 4) : [])
  const [skillText, setSkillText] = useState('')
  const [category, setCategory] = useState<Category>(profile?.interests[0] ?? 'Technology')
  const [commitment, setCommitment] = useState<Commitment>('Two to four weeks')
  const [mode, setMode] = useState<WorkMode>('Either')
  const [rewards, setRewards] = useState<Reward[]>(['Credit on the project'])
  const [spots, setSpots] = useState(1)
  const [closes, setCloses] = useState('')
  const [projectId, setProjectId] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [tried, setTried] = useState(false)
  const f = useId()
  const seeking = kind === 'seeking'

  const addSkill = (raw: string) => {
    const parts = raw.split(',').map((x) => x.trim()).filter(Boolean)
    if (parts.length) setSkills((s) => [...new Set([...s, ...parts])].slice(0, 8))
    setSkillText('')
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTried(true)
    const pending = skillText.trim() ? [...new Set([...skills, ...skillText.split(',').map((x) => x.trim()).filter(Boolean)])] : skills
    if (!e.currentTarget.checkValidity() || !pending.length || !rewards.length) return
    onPublish({
        id: `my-${Date.now().toString(36)}`,
        kind,
        authorId: 'me',
        title: title.trim(),
        body: body.trim(),
        skills: pending,
        category,
        commitment,
        mode,
        rewards,
        spots: seeking ? spots : 1,
        posted: new Date(),
        closes: seeking && closes ? new Date(`${closes}T23:59`) : undefined,
        projectId: projectId || undefined,
        urgent: seeking && urgent,
        hands: [],
    })
  }

  const [today] = useState(() => new Date().toISOString().slice(0, 10))

  return (
    <form noValidate onSubmit={submit} className={`flex h-full flex-col ${tried ? 'tried' : ''}`}>
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 pt-6 pb-5 md:px-7">
        <div>
          <p className="slate-no">New post · billed by fit</p>
          <h2 id="compose-title" className="mt-2 text-3xl">{seeking ? 'Who do you need?' : 'What can you lend?'}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close"><Icon name="close" /></button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 md:px-7">
        <div role="radiogroup" aria-label="Kind of post" className="grid grid-cols-2 border border-line-strong">
          {(['seeking', 'offering'] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`px-3 py-3 text-sm transition-colors ${kind === k ? (k === 'seeking' ? 'bg-gold text-black' : 'bg-teal text-[#f2ede3]') : 'text-mute hover-gold'}`}>
              {k === 'seeking' ? 'I need a hand' : 'I can help'}
            </button>
          ))}
        </div>

        <Field label={seeking ? 'The opening, in one line' : 'What you offer, in one line'} id={`${f}-t`} error="Eight characters at least.">
          <input id={`${f}-t`} className="field" required minLength={8} maxLength={80} placeholder={seeking ? 'Firmware hand for a sensor mesh' : 'I will review your PCB before you order it'} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="The details" id={`${f}-b`} error="Two lines at least, so people know what they are signing up for.">
          <textarea id={`${f}-b`} className="field min-h-28" required minLength={20} maxLength={600} placeholder={seeking ? 'What you are building, what is stuck, how you like to work.' : 'What you are good at, when you are free, how to reach you.'} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>

        <div>
          <label htmlFor={`${f}-s`} className="eyebrow block">{seeking ? 'Skills wanted' : 'Skills on offer'}</label>
          <div className={`mt-2 flex flex-wrap items-center gap-1.5 border p-2 ${tried && !skills.length && !skillText.trim() ? 'border-[#e0795f]' : 'border-line-strong'}`}>
            {skills.map((k) => (
              <button key={k} type="button" className="tag hover-gold" onClick={() => setSkills(skills.filter((x) => x !== k))} aria-label={`Remove ${k}`}>
                {k} <Icon name="close" className="h-3 w-3" />
              </button>
            ))}
            <input
              id={`${f}-s`}
              className="min-w-[10ch] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
              placeholder={skills.length ? 'Add another' : 'Type a skill, press Enter'}
              value={skillText}
              onChange={(e) => (e.target.value.endsWith(',') ? addSkill(e.target.value) : setSkillText(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSkill(skillText)
                } else if (e.key === 'Backspace' && !skillText && skills.length) setSkills(skills.slice(0, -1))
              }}
            />
          </div>
          {tried && !skills.length && !skillText.trim() && <p className="mt-1.5 text-sm text-[#e0795f]">Add at least one skill.</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Area" id={`${f}-c`} value={category} options={CATEGORIES} onChange={(v) => setCategory(v as Category)} />
          <Select label="Time it takes" id={`${f}-m`} value={commitment} options={COMMITMENTS} onChange={(v) => setCommitment(v as Commitment)} />
          <Select label="Where" id={`${f}-w`} value={mode} options={WORK_MODES} onChange={(v) => setMode(v as WorkMode)} />
          {seeking ? (
            <label className="block" htmlFor={`${f}-n`}>
              <span className="eyebrow block">People wanted</span>
              <input id={`${f}-n`} className="field mt-2 num" type="number" min={1} max={10} value={spots} onChange={(e) => setSpots(Math.max(1, Math.min(10, +e.target.value || 1)))} />
            </label>
          ) : null}
        </div>

        <fieldset>
          <legend className="eyebrow">{seeking ? 'What they get' : 'What you ask in return'}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {REWARDS.map((r) => (
              <button key={r} type="button" className="chip" aria-pressed={rewards.includes(r)} onClick={() => setRewards(rewards.includes(r) ? rewards.filter((x) => x !== r) : [...rewards, r])}>{r}</button>
            ))}
          </div>
          {tried && !rewards.length && <p className="mt-1.5 text-sm text-[#e0795f]">Pick at least one. Say it up front, like a real opening.</p>}
        </fieldset>

        {seeking && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block" htmlFor={`${f}-d`}>
              <span className="eyebrow block">Closes (optional)</span>
              <input id={`${f}-d`} className="field mt-2" type="date" min={today} value={closes} onChange={(e) => setCloses(e.target.value)} />
            </label>
            {myProjects.length > 0 && (
              <label className="block" htmlFor={`${f}-p`}>
                <span className="eyebrow block">Link a project</span>
                <select id={`${f}-p`} className="field mt-2" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">None</option>
                  {myProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            )}
            <button type="button" className="chip sm:col-span-2 justify-self-start" aria-pressed={urgent} onClick={() => setUrgent(!urgent)}>Mark as urgent</button>
          </div>
        )}
      </div>
      <div className="flex shrink-0 justify-end gap-3 border-t border-line bg-slate-2 px-5 py-4 md:px-7" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-gold">Put it on the board</button>
      </div>
    </form>
  )
}

function Field({ label, id, error, children }: { label: string; id: string; error: string; children: ReactNode }) {
  return (
    <div className="field-wrap">
      <label htmlFor={id} className="eyebrow mb-2 block">{label}</label>
      {children}
      <p className="field-error"><b>Error:</b> {error}</p>
    </div>
  )
}

function Select({ label, id, value, options, onChange }: { label: string; id: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <label className="block" htmlFor={id}>
      <span className="eyebrow block">{label}</span>
      <select id={id} className="field mt-2" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  )
}

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* The directory                                                       */
/* ------------------------------------------------------------------ */

function Directory({ students }: { students: Student[] }) {
  const q = useQuery(students)
  const { profile } = useStore()
  const { posts } = useCatalog()
  const [text, setText] = useState('')
  const [school, setSchool] = useState<School | ''>('')
  const [cat, setCat] = useState<Category | null>(null)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const flip = useRef<FlipState | null>(null)
  const change = (fn: () => void) => {
    if (root.current && matchMedia(MOTION).matches) flip.current = Flip.getState(root.current.querySelectorAll('[data-flip-id]'))
    fn()
  }

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

  useLayoutEffect(() => {
    const state = flip.current
    if (!state || !root.current) return
    flip.current = null
    Flip.from(state, {
      targets: root.current.querySelectorAll('[data-flip-id]'),
      duration: 0.6,
      ease: 'expo.out',
      scale: true,
      stagger: 0.012,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.03 }),
    })
  }, [list])

  useGSAP(
    () => {
      if (q.status !== 'ready') return
      const mm = gsap.matchMedia()
      mm.add(MOTION, () => {
        const rows = gsap.utils.toArray<HTMLElement>('[data-reveal]')
        gsap.set(rows, { opacity: 0, y: 20 })
        ScrollTrigger.batch(rows, { start: 'top 94%', once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.8, stagger: 0.05, ease: 'expo.out', overwrite: true }) })
      })
    },
    { scope: root, dependencies: [q.status] },
  )

  return (
    <div ref={root}>
      {profile && !profile.skills.length && (
        <p className="mb-5 border-l-2 border-gold pl-4 text-sm text-mute">
          Add your skills under <a className="hover-gold text-paper underline underline-offset-4" href={href('profile')}>You</a> so the asks that fit you get billed first.
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-[1fr_16rem_auto] md:items-end">
        <label className="relative block">
          <span className="sr-only">Search people</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute" />
          <input className="field pl-10" type="search" placeholder="Try “React”, “Figma” or a name" value={text} onChange={(e) => change(() => setText(e.target.value))} />
        </label>
        <label className="block">
          <span className="sr-only">School</span>
          <select className="field" value={school} onChange={(e) => change(() => setSchool(e.target.value as School | ''))}>
            <option value="">Every school</option>
            {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <button type="button" className="chip h-11" aria-pressed={open} onClick={() => change(() => setOpen(!open))}>Open to collaborate</button>
      </div>
      <div role="group" aria-label="Interest" className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        <button type="button" className="chip shrink-0" aria-pressed={!cat} onClick={() => change(() => setCat(null))}>Any interest</button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className="chip shrink-0" aria-pressed={cat === c} onClick={() => change(() => setCat(cat === c ? null : c))}>{c}</button>
        ))}
      </div>

      <div className="mt-8">
        {q.status === 'loading' ? (
          <ListSkeleton rows={5} />
        ) : q.status === 'error' ? (
          <ErrorState onRetry={q.retry} />
        ) : list.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {list.map((s) => {
              const hit = text ? skillMatch([text.trim()], s.skills) : []
              const live = posts.filter((p) => p.authorId === s.id).length
              return (
                <li key={s.id} data-flip-id={s.id} data-reveal>
                  <a href={href(`people/${s.id}`)} className="bill-row group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-4 md:grid-cols-[auto_minmax(0,16rem)_minmax(0,1fr)_minmax(0,16rem)_auto]">
                    <Monogram text={s.name} size="sm" />
                    <span className="min-w-0">
                      <span className="bill-title block truncate font-display text-lg">{s.name}</span>
                      <span className="block truncate text-xs text-mute">Year <Num>{s.year}</Num> · {shortSchool(s.school)}</span>
                    </span>
                    <span className="hidden truncate text-sm text-mute md:block">{s.bio}</span>
                    <span className="col-span-2 col-start-2 flex min-w-0 flex-wrap gap-1.5 md:col-span-1 md:col-start-auto">
                      {s.skills.slice(0, 3).map((k) => <span key={k} className={hit.includes(k) ? 'tag tag-gold' : 'tag'}>{k}</span>)}
                    </span>
                    <span className="row-start-1 col-start-3 flex items-center gap-2 md:col-start-auto">
                      {live > 0 && <span className="tag border-gold text-gold">On the board</span>}
                      {s.openToCollaborate && <span className="tag tag-teal">Open</span>}
                      <Icon name="arrow" className="bill-arrow h-4 w-4 text-mute" />
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState
            title="No one matches"
            body="Try a broader skill, or clear the filters."
            action={<button type="button" className="btn" onClick={() => change(() => { setText(''); setSchool(''); setCat(null); setOpen(false) })}>Clear filters</button>}
          />
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* One person                                                          */
/* ------------------------------------------------------------------ */

function Person({ s }: { s: Student }) {
  const { projects, clubById, posts } = useCatalog()
  const asks = useBilling('seeking')
  const offers = useBilling('offering')
  const work = projects.filter((p) => p.team.some((m) => m.studentId === s.id))
  const theirs = posts.filter((p) => p.authorId === s.id)
  const [open, setOpen] = useState<string | null>(null)
  const openPost = theirs.find((p) => p.id === open)
  const billedOf = (id: string) => [...asks, ...offers].find((b) => b.post.id === id)
  const links = [
    s.links.github && { icon: 'github' as const, label: 'GitHub', url: s.links.github },
    s.links.linkedin && { icon: 'linkedin' as const, label: 'LinkedIn', url: s.links.linkedin },
    s.links.portfolio && { icon: 'link' as const, label: 'Portfolio', url: s.links.portfolio },
  ].filter(Boolean) as { icon: 'github' | 'linkedin' | 'link'; label: string; url: string }[]

  return (
    <article className="pb-16">
      <div className="pt-6">
        <a href={href('people')} className="hover-gold inline-flex items-center gap-2 text-sm text-mute">
          <Icon name="arrow-left" /> The board
        </a>
      </div>
      <PageHeader scene="06" eyebrow={`Year ${s.year} · ${s.school}`} title={s.name} aside={<Monogram text={s.name} size="lg" gold />}>
        {s.bio || 'No bio yet.'}
      </PageHeader>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          {theirs.length > 0 && (
            <section aria-labelledby="board">
              <SectionTitle id="board" title="On the board" count={theirs.length} />
              <ul className="divide-y divide-line border-y border-line">
                {theirs.map((p) => {
                  const b = billedOf(p.id)
                  return (
                    <li key={p.id}>
                      <EnsembleRow post={p} label={b ? pad(b.rank) : '—'} onOpen={() => setOpen(p.id)} />
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
          <section aria-labelledby="skills">
            <SectionTitle id="skills" title="Skills" count={s.skills.length} />
            {s.skills.length ? <p className="flex flex-wrap gap-2">{s.skills.map((k) => <span key={k} className="tag">{k}</span>)}</p> : <p className="text-mute">No skills listed yet.</p>}
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
            <p className="border-l-2 border-teal-bright pl-4 text-sm">
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
                  return club ? <li key={c}><a className="hover-gold" href={href(`clubs/${c}`)}>{club.name}</a></li> : null
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
      <Dialog open={!!openPost} onClose={() => setOpen(null)} variant="sheet" labelledBy="post-title">
        {openPost && (
          <PostSheet post={openPost} billed={billedOf(openPost.id)} total={(openPost.kind === 'seeking' ? asks : offers).length} onClose={() => setOpen(null)} />
        )}
      </Dialog>
    </article>
  )
}
