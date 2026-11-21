import { motion, useReducedMotion } from 'framer-motion'
import { useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { InkPool } from '../components/InkPool'
import { DOLLY, Dialog, EmptyState, ErrorState, Icon, ListSkeleton, Monogram, Num, PageHeader, Reveal, SectionTitle } from '../components/ui'
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
import { inkReveal, soak, type Pt } from '../ink/bleed'
import { daysFrom, longDate } from '../lib/format'
import { meAsStudent, skillMatch, useCatalog } from '../lib/catalog'
import { href } from '../lib/router'
import { useQuery, useStore } from '../lib/store'

type Tab = 'seeking' | 'offering' | 'people'
const TAB_KEY = 'rvu-connect:people-tab'

export default function People({ id }: { id?: string }) {
  const { studentById, postById } = useCatalog()
  const { profile } = useStore()
  if (id && postById(id)) return <Board openId={id} />
  if (id) {
    const s = id === 'me' && profile ? meAsStudent(profile) : studentById(id)
    if (!s)
      return (
        <div className="py-16">
          <EmptyState title="We can’t find that student" body="They may have hidden their profile." action={<a className="btn" href={href('people')}>Everyone</a>} />
        </div>
      )
    return <Person s={s} />
  }
  return <Board />
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

/** Ink soaks into a surface from wherever the pointer comes in, and drains back out the same way. */
function useSoak() {
  const tint = useRef<HTMLSpanElement>(null)
  const anim = useRef<Animation | null>(null)
  const fill = (p: Pt) => {
    if (!tint.current) return
    anim.current?.cancel()
    anim.current = soak(tint.current, p, 950, { verts: 64, frames: 32, tendrils: 0.8 })
  }
  const drain = () => {
    const a = anim.current
    if (!a) {
      if (tint.current) tint.current.style.clipPath = ''
      return
    }
    a.playbackRate = 1.6
    a.reverse()
  }
  const centre = (el: HTMLElement): Pt => {
    const b = el.getBoundingClientRect()
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 }
  }
  return {
    tint,
    handlers: {
      onPointerEnter: (e: React.PointerEvent<HTMLElement>) => e.pointerType !== 'touch' && fill({ x: e.clientX, y: e.clientY }),
      onPointerLeave: (e: React.PointerEvent<HTMLElement>) => e.pointerType !== 'touch' && drain(),
      onFocus: (e: React.FocusEvent<HTMLElement>) => e.currentTarget.matches(':focus-visible') && fill(centre(e.currentTarget)),
      onBlur: drain,
    },
  }
}

const Tint = ({ r, tone }: { r: React.RefObject<HTMLSpanElement | null>; tone: 'gold' | 'teal' }) => <span ref={r} aria-hidden className="ink-tint" data-tone={tone} />

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
  if (n < 0) return { label: 'Closed', soon: false, closed: true }
  if (n === 0) return { label: 'Closes today', soon: true, closed: false }
  if (n === 1) return { label: 'Closes tomorrow', soon: true, closed: false }
  return { label: `Closes in ${n} days`, soon: n <= 4, closed: false }
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
  const reduce = useReducedMotion()
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
  const setTab = (t: Tab) => {
    setTabState(t)
    try {
      sessionStorage.setItem(TAB_KEY, t)
    } catch {
      /* fine */
    }
  }
  const [open, setOpen] = useState<string | null>(openId ?? null)
  const [composing, setComposing] = useState<PostKind | null>(null)
  const [fresh, setFresh] = useState<string | null>(null)
  const listTop = useRef<HTMLDivElement>(null)

  const asks = posts.filter((p) => p.kind === 'seeking')
  const offers = posts.filter((p) => p.kind === 'offering')
  const collaborators = students.filter((s) => s.openToCollaborate).length
  const openPost = open ? postById(open) : undefined

  const publish = (p: BoardPost, at: Pt) => {
    setComposing(null)
    // Let the sheet close first, so the ink bleeds over the board, not the form.
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        inkReveal(at, () =>
          flushSync(() => {
            publishPost(p)
            setTab(p.kind)
            setFresh(p.id)
          }),
        ),
      ),
    )
    window.setTimeout(() => listTop.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 900)
  }

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: 'seeking', label: 'Asks', n: asks.length },
    { id: 'offering', label: 'Offers', n: offers.length },
    { id: 'people', label: 'People', n: students.length },
  ]

  return (
    <div className="pb-16">
      <header className="board-hero relative isolate overflow-hidden border-b border-line">
        <div aria-hidden className="board-hero__pool">
          <InkPool />
        </div>
        <div className="relative z-[1] max-w-[40rem] pt-44 pb-9 md:pt-16 md:pb-12">
          <Reveal>
            <p className="eyebrow">People · The board</p>
            <h1 className="mt-4 text-[clamp(2.3rem,1.6rem+2.8vw,4.6rem)] leading-[1.02]">
              Need a hand? <em className="text-gold">Ask the campus.</em>
            </h1>
            <p className="mt-4 max-w-[52ch] text-mute">
              Post what you are building and who you need, the way a team posts an opening. Or put up what you are good at, and let the right project find you.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" className="btn btn-gold" disabled={!profile} onClick={() => setComposing('seeking')}>
                <Icon name="plus" className="h-4 w-4" /> {profile ? 'Post an ask' : 'Sign in to post'}
              </button>
              <button type="button" className="btn" disabled={!profile} onClick={() => setComposing('offering')}>
                Offer your skills
              </button>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <dl className="mt-9 grid max-w-md grid-cols-3 border-t border-line pt-5">
              {[
                ['Open asks', asks.filter((p) => !closing(p.closes)?.closed).length],
                ['Offering help', offers.length],
                ['Open to build', collaborators],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="eyebrow !text-[0.62rem]">{k}</dt>
                  <dd className="mt-1 font-num text-3xl tabular-nums">{String(v).padStart(2, '0')}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </header>

      <div ref={listTop} className="scroll-mt-24" />
      <div role="tablist" aria-label="Board" className="no-scrollbar mt-6 flex gap-1 overflow-x-auto border-b border-line">
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
            {t.label} <Num className="ml-1.5 text-xs text-mute">{String(t.n).padStart(2, '0')}</Num>
            {tab === t.id && <motion.span layoutId="board-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-gold" transition={{ duration: reduce ? 0 : 0.5, ease: DOLLY }} />}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-6">
        {tab === 'people' ? (
          <Directory students={students} />
        ) : (
          <PostList key={tab} kind={tab} posts={tab === 'seeking' ? asks : offers} fresh={fresh} onOpen={setOpen} onCompose={() => setComposing(tab)} />
        )}
      </div>

      <Dialog open={!!openPost} onClose={() => setOpen(null)} variant="sheet" labelledBy="post-title">
        {openPost && <PostSheet post={openPost} onClose={() => setOpen(null)} />}
      </Dialog>
      <Dialog open={!!composing} onClose={() => setComposing(null)} variant="sheet" labelledBy="compose-title">
        {composing && <Composer kind={composing} onCancel={() => setComposing(null)} onPublish={publish} />}
      </Dialog>
    </div>
  )
}

function PostList({ kind, posts, fresh, onOpen, onCompose }: { kind: PostKind; posts: BoardPost[]; fresh: string | null; onOpen: (id: string) => void; onCompose: () => void }) {
  const q = useQuery(posts)
  const { profile } = useStore()
  const mySkills = useMemo(() => profile?.skills ?? [], [profile?.skills])
  const [text, setText] = useState('')
  const [cat, setCat] = useState<Category | null>(null)
  const [commit, setCommit] = useState<Commitment | ''>('')
  const [fits, setFits] = useState(false)
  const [sort, setSort] = useState<'new' | 'closing' | 'hands'>('new')
  const filtered = text || cat || commit || fits

  const list = useMemo(() => {
    const t = text.trim().toLowerCase()
    const out = (q.data ?? []).filter((p) => {
      if (cat && p.category !== cat) return false
      if (commit && p.commitment !== commit) return false
      if (fits && !skillMatch(mySkills, p.skills).length) return false
      if (t && !`${p.title} ${p.body} ${p.skills.join(' ')}`.toLowerCase().includes(t)) return false
      return true
    })
    if (sort === 'closing') out.sort((a, b) => (a.closes ? +a.closes : Infinity) - (b.closes ? +b.closes : Infinity))
    if (sort === 'hands') out.sort((a, b) => b.hands.length - a.hands.length)
    return out
  }, [q.data, text, cat, commit, fits, sort, mySkills])

  const forYou = kind === 'seeking' && !filtered ? (q.data ?? []).filter((p) => p.authorId !== 'me' && !closing(p.closes)?.closed && skillMatch(mySkills, p.skills).length).slice(0, 3) : []
  const word = kind === 'seeking' ? 'asks' : 'offers'

  return (
    <>
      <div className="grid gap-3 md:grid-cols-[1fr_13rem_11rem] md:items-end">
        <label className="relative block">
          <span className="sr-only">Search {word}</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute" />
          <input className="field pl-10" type="search" placeholder={kind === 'seeking' ? 'Try “ESP32”, “illustrator” or “pitch”' : 'What do you need help with?'} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <label className="block">
          <span className="sr-only">Commitment</span>
          <select className="field" value={commit} onChange={(e) => setCommit(e.target.value as Commitment | '')}>
            <option value="">Any commitment</option>
            {COMMITMENTS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Sort</span>
          <select className="field" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="new">Newest first</option>
            {kind === 'seeking' && <option value="closing">Closing soon</option>}
            <option value="hands">Most hands</option>
          </select>
        </label>
      </div>
      <div role="group" aria-label="Category" className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {mySkills.length > 0 && (
          <button type="button" className="chip shrink-0" aria-pressed={fits} onClick={() => setFits(!fits)}>
            <Icon name="check" className="h-3.5 w-3.5" /> Fits my skills
          </button>
        )}
        <button type="button" className="chip shrink-0" aria-pressed={!cat} onClick={() => setCat(null)}>Everything</button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className="chip shrink-0" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>{c}</button>
        ))}
      </div>

      {forYou.length > 0 && (
        <section aria-labelledby="for-you" className="mt-10">
          <SectionTitle id="for-you" title="You could help with" count={forYou.length} />
          <ul className="grid gap-px border border-gold/40 bg-gold/25 md:grid-cols-3">
            {forYou.map((p, i) => (
              <Reveal as="li" key={p.id} delay={i * 0.05} className="min-w-0 bg-ink">
                <CompactPost post={p} onOpen={() => onOpen(p.id)} />
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10">
        {q.status === 'loading' ? (
          <ListSkeleton rows={4} tall />
        ) : q.status === 'error' ? (
          <ErrorState onRetry={q.retry} />
        ) : list.length ? (
          <ul className="grid grid-cols-1 gap-px border border-line bg-line lg:grid-cols-2">
            {list.map((p, i) => (
              <Reveal as="li" key={p.id} delay={Math.min(i, 6) * 0.04} className="min-w-0 bg-ink">
                <PostCard post={p} fresh={fresh === p.id} onOpen={() => onOpen(p.id)} />
              </Reveal>
            ))}
          </ul>
        ) : filtered ? (
          <EmptyState
            title={`No ${word} match`}
            body="Try a broader word, or clear the filters."
            action={<button type="button" className="btn" onClick={() => { setText(''); setCat(null); setCommit(''); setFits(false) }}>Clear filters</button>}
          />
        ) : (
          <EmptyState
            title={kind === 'seeking' ? 'No one is asking yet' : 'No one is offering yet'}
            body={kind === 'seeking' ? 'Be the first: say what you are building and who you need.' : 'Put up what you are good at, and let a project find you.'}
            action={profile ? <button type="button" className="btn btn-gold" onClick={onCompose}>{kind === 'seeking' ? 'Post an ask' : 'Offer your skills'}</button> : undefined}
          />
        )}
      </div>
    </>
  )
}

function PostCard({ post: p, fresh, onOpen }: { post: BoardPost; fresh: boolean; onOpen: () => void }) {
  const { tint, handlers } = useSoak()
  const author = useAuthor()(p.authorId)
  const { profile, hands } = useStore()
  const match = skillMatch(profile?.skills ?? [], p.skills)
  const close = closing(p.closes)
  const raised = p.hands.length + (hands[p.id] ? 1 : 0)
  const seeking = p.kind === 'seeking'

  return (
    <button type="button" onClick={onOpen} {...handlers} className={`ink-surface group flex h-full w-full flex-col gap-4 p-5 text-left md:p-6 ${fresh ? 'ink-fresh' : ''} ${close?.closed ? 'opacity-60' : ''}`}>
      <Tint r={tint} tone={seeking ? 'gold' : 'teal'} />
      <span className="flex flex-wrap items-center gap-2">
        <span className={seeking ? 'slate-no' : 'slate-no !text-teal-bright'}>{seeking ? `Seeking · ${p.spots} ${p.spots === 1 ? 'spot' : 'spots'}` : 'Offering'}</span>
        {p.authorId === 'me' && <span className="tag tag-gold">Yours</span>}
        {p.urgent && !close?.closed && <span className="tag border-gold text-gold">Urgent</span>}
        <span className={`ml-auto text-xs ${close?.soon ? 'text-gold' : 'text-mute'}`}>{close ? close.label : ago(p.posted)}</span>
      </span>
      <span className="block">
        <span className="block font-display text-2xl leading-tight transition-colors duration-300 group-hover:text-gold md:text-[1.7rem]">{p.title}</span>
        <span className="mt-2 line-clamp-2 block text-sm text-mute">{p.body}</span>
      </span>
      <span className="flex flex-wrap gap-1.5">
        {p.skills.map((k) => <span key={k} className={match.includes(k) ? 'tag tag-gold' : 'tag'}>{k}</span>)}
      </span>
      <span className="grid grid-cols-3 gap-3 border-y border-line py-3 text-xs">
        <Fact k="Time" v={p.commitment} />
        <Fact k="Where" v={p.mode} />
        <Fact k={seeking ? 'You get' : 'In return'} v={p.rewards[0]} more={p.rewards.length - 1} />
      </span>
      <span className="mt-auto flex items-center gap-3">
        {author && <Monogram text={author.name} size="sm" gold={p.authorId === 'me'} />}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{author?.name ?? 'A student'}</span>
          <span className="block truncate text-xs text-mute">{author ? `Year ${author.year} · ${shortSchool(author.school)}` : ''}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-mute">
          <Hand className="h-4 w-4" /> <Num>{raised}</Num>
          <Icon name="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </span>
    </button>
  )
}

function CompactPost({ post: p, onOpen }: { post: BoardPost; onOpen: () => void }) {
  const { tint, handlers } = useSoak()
  const { profile } = useStore()
  const match = skillMatch(profile?.skills ?? [], p.skills)
  return (
    <button type="button" onClick={onOpen} {...handlers} className="ink-surface group flex h-full w-full flex-col gap-3 p-5 text-left">
      <Tint r={tint} tone="gold" />
      <span className="slate-no">Your {match.join(', ')}</span>
      <span className="block font-display text-xl leading-snug group-hover:text-gold">{p.title}</span>
      <span className="mt-auto text-xs text-mute">{p.commitment} · {p.mode}</span>
    </button>
  )
}

const Fact = ({ k, v, more = 0 }: { k: string; v: string; more?: number }) => (
  <span className="min-w-0">
    <span className="eyebrow block !text-[0.58rem]">{k}</span>
    <span className="mt-1 block truncate">{v}{more > 0 && <Num className="text-mute"> +{more}</Num>}</span>
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

function PostSheet({ post: p, onClose }: { post: BoardPost; onClose: () => void }) {
  const author = useAuthor()
  const a = author(p.authorId)
  const { profile, hands, raiseHand, lowerHand, deletePost } = useStore()
  const { projectById } = useCatalog()
  const [note, setNote] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const mine = p.authorId === 'me'
  const mineHand = hands[p.id]
  const match = skillMatch(profile?.skills ?? [], p.skills)
  const close = closing(p.closes)
  const project = p.projectId ? projectById(p.projectId) : undefined
  const seeking = p.kind === 'seeking'
  const people = p.hands.map((h) => author(h)).filter(Boolean) as Student[]
  const noteId = useId()

  return (
    <div className="flex h-full flex-col">
      <div className="relative h-36 shrink-0 overflow-hidden border-b border-line md:h-44">
        <InkPool tone={seeking ? 'gold' : 'teal'} />
        <button type="button" className="icon-btn absolute top-3 right-3 bg-ink/60 backdrop-blur" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
        <p className={`absolute bottom-3 left-5 ${seeking ? 'slate-no' : 'slate-no !text-teal-bright'}`}>{seeking ? `Seeking · ${p.spots} ${p.spots === 1 ? 'spot' : 'spots'}` : 'Offering'} · {p.category}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 md:px-7">
        <h2 id="post-title" className="text-3xl leading-tight md:text-4xl">{p.title}</h2>
        {a && (
          <a href={href(`people/${a.id}`)} className="row-hover mt-5 flex items-center gap-3 border border-line p-3">
            <Monogram text={a.name} size="sm" gold={mine} />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{a.name}</span>
              <span className="block truncate text-xs text-mute">Year {a.year} · {shortSchool(a.school)}</span>
            </span>
            <Icon name="arrow" className="h-4 w-4 text-mute" />
          </a>
        )}
        <p className="mt-6 leading-relaxed whitespace-pre-line">{p.body}</p>

        <dl className="mt-7 grid grid-cols-2 gap-px border border-line bg-line text-sm">
          {[
            ['Time', p.commitment],
            ['Where', p.mode],
            ['Posted', ago(p.posted)],
            [seeking ? 'Applications' : 'Status', close ? close.label : 'Open'],
          ].map(([k, v]) => (
            <div key={k} className="bg-slate-2 p-3">
              <dt className="eyebrow !text-[0.6rem]">{k}</dt>
              <dd className={`mt-1 ${k !== 'Time' && close?.soon && v === close.label ? 'text-gold' : ''}`}>{v}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-7">
          <p className="eyebrow">{seeking ? 'Skills wanted' : 'Skills on offer'}</p>
          <p className="mt-3 flex flex-wrap gap-1.5">{p.skills.map((k) => <span key={k} className={match.includes(k) ? 'tag tag-gold' : 'tag'}>{k}</span>)}</p>
          {seeking && match.length > 0 && !mine && <p className="mt-2 text-sm text-gold">You have {match.length} of {p.skills.length}.</p>}
        </section>
        <section className="mt-7">
          <p className="eyebrow">{seeking ? 'What you get' : 'Asks in return'}</p>
          <ul className="mt-3 space-y-2">
            {p.rewards.map((r) => (
              <li key={r} className="flex items-center gap-2 text-sm"><Icon name="check" className="h-4 w-4 text-gold" /> {r}</li>
            ))}
          </ul>
        </section>
        {project && (
          <a href={href(`projects/${project.id}`)} className="row-hover mt-7 flex items-center justify-between gap-4 border-y border-line py-4">
            <span className="min-w-0">
              <span className="eyebrow block">Project</span>
              <span className="mt-1 block truncate font-display text-xl">{project.name}</span>
            </span>
            <Icon name="arrow" />
          </a>
        )}
        <section className="mt-7">
          <p className="eyebrow">Raised hands <Num className="ml-1">{people.length + (mineHand ? 1 : 0)}</Num></p>
          {people.length || mineHand ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {mineHand && profile && <li title="You"><Monogram text={profile.name} size="sm" gold /></li>}
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
              <p className="text-sm text-mute">This is your post. People who raise a hand appear above.</p>
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

function Composer({ kind: initial, onCancel, onPublish }: { kind: PostKind; onCancel: () => void; onPublish: (p: BoardPost, at: Pt) => void }) {
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
    const btn = (e.nativeEvent as SubmitEvent).submitter?.getBoundingClientRect()
    const at = btn ? { x: btn.left + btn.width / 2, y: btn.top + btn.height / 2 } : { x: innerWidth / 2, y: innerHeight / 2 }
    onPublish(
      {
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
      },
      at,
    )
  }

  const [today] = useState(() => new Date().toISOString().slice(0, 10))

  return (
    <form noValidate onSubmit={submit} className={`flex h-full flex-col ${tried ? 'tried' : ''}`}>
      <div className="relative h-28 shrink-0 overflow-hidden border-b border-line">
        <InkPool tone={seeking ? 'gold' : 'teal'} />
        <button type="button" className="icon-btn absolute top-3 right-3 bg-ink/60 backdrop-blur" onClick={onCancel} aria-label="Close">
          <Icon name="close" />
        </button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 md:px-7">
        <div>
          <p className="eyebrow">New post</p>
          <h2 id="compose-title" className="mt-2 text-3xl">{seeking ? 'Who do you need?' : 'What can you lend?'}</h2>
        </div>
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
/* The directory                                                       */
/* ------------------------------------------------------------------ */

function Directory({ students }: { students: Student[] }) {
  const q = useQuery(students)
  const { profile } = useStore()
  const [text, setText] = useState('')
  const [school, setSchool] = useState<School | ''>('')
  const [cat, setCat] = useState<Category | null>(null)
  const [open, setOpen] = useState(false)

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

  return (
    <>
      {profile && !profile.skills.length && (
        <p className="mb-5 border border-line p-4 text-sm text-mute">
          Add your skills under <a className="hover-gold text-paper underline underline-offset-4" href={href('profile')}>You</a> so asks that fit you find their way here.
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-[1fr_16rem_auto] md:items-end">
        <label className="relative block">
          <span className="sr-only">Search people</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute" />
          <input className="field pl-10" type="search" placeholder="Try “React”, “Figma” or a name" value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <label className="block">
          <span className="sr-only">School</span>
          <select className="field" value={school} onChange={(e) => setSchool(e.target.value as School | '')}>
            <option value="">Every school</option>
            {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <button type="button" className="chip h-11" aria-pressed={open} onClick={() => setOpen(!open)}>Open to collaborate</button>
      </div>
      <div role="group" aria-label="Interest" className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        <button type="button" className="chip shrink-0" aria-pressed={!cat} onClick={() => setCat(null)}>Any interest</button>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className="chip shrink-0" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>{c}</button>
        ))}
      </div>

      <div className="mt-8">
        {q.status === 'loading' ? (
          <ListSkeleton rows={5} />
        ) : q.status === 'error' ? (
          <ErrorState onRetry={q.retry} />
        ) : list.length ? (
          <ul className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
            {list.map((s, i) => (
              <Reveal as="li" key={s.id} delay={Math.min(i, 8) * 0.03} className="min-w-0 bg-ink">
                <PersonCard s={s} hit={text ? skillMatch([text.trim()], s.skills) : []} />
              </Reveal>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No one matches"
            body="Try a broader skill, or clear the filters."
            action={<button type="button" className="btn" onClick={() => { setText(''); setSchool(''); setCat(null); setOpen(false) }}>Clear filters</button>}
          />
        )}
      </div>
    </>
  )
}

function PersonCard({ s, hit }: { s: Student; hit: string[] }) {
  const { tint, handlers } = useSoak()
  const { posts } = useCatalog()
  const live = posts.filter((p) => p.authorId === s.id).length
  return (
    <a href={href(`people/${s.id}`)} {...handlers} className="ink-surface group flex h-full flex-col gap-4 p-5">
      <Tint r={tint} tone={s.openToCollaborate ? 'teal' : 'gold'} />
      <span className="flex items-center gap-4">
        <Monogram text={s.name} />
        <span className="min-w-0">
          <span className="block truncate font-display text-xl group-hover:text-gold">{s.name}</span>
          <span className="block truncate text-sm text-mute">Year {s.year} · {shortSchool(s.school)}</span>
        </span>
      </span>
      <span className="line-clamp-2 text-sm text-mute">{s.bio}</span>
      <span className="mt-auto flex flex-wrap gap-1.5">
        {s.skills.slice(0, 4).map((k) => <span key={k} className={hit.includes(k) ? 'tag tag-gold' : 'tag'}>{k}</span>)}
        {s.openToCollaborate && <span className="tag tag-teal">Open</span>}
        {live > 0 && <span className="tag border-gold text-gold">On the board</span>}
      </span>
    </a>
  )
}

/* ------------------------------------------------------------------ */
/* One person                                                          */
/* ------------------------------------------------------------------ */

function Person({ s }: { s: Student }) {
  const { projects, clubById, posts } = useCatalog()
  const work = projects.filter((p) => p.team.some((m) => m.studentId === s.id))
  const theirs = posts.filter((p) => p.authorId === s.id)
  const [open, setOpen] = useState<string | null>(null)
  const openPost = theirs.find((p) => p.id === open)
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
              <ul className="grid gap-px border border-line bg-line md:grid-cols-2">
                {theirs.map((p) => (
                  <li key={p.id} className="min-w-0 bg-ink">
                    <PostCard post={p} fresh={false} onOpen={() => setOpen(p.id)} />
                  </li>
                ))}
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
            <div className="relative h-40 overflow-hidden border border-line">
              <InkPool tone="teal" />
              <p className="absolute inset-x-0 bottom-0 p-4 text-sm">
                <span className="tag tag-teal">Open to collaborate</span>
                <span className="mt-2 block">Happy to hear about new projects.</span>
              </p>
            </div>
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
        {openPost && <PostSheet post={openPost} onClose={() => setOpen(null)} />}
      </Dialog>
    </article>
  )
}
