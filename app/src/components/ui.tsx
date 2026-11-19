import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'

export const DOLLY = [0.2, 0.7, 0.1, 1] as const

/** Official logo asset, unaltered. In light theme it sits on a black plate: the gold logo never touches a light surface (brand rule). */
export function Logo({ className = 'h-10' }: { className?: string }) {
  return (
    <span className="logo-plate">
      <img src="/brand/rvu-logo-gold.png" alt="RV University" className={`${className} w-auto select-none`} draggable={false} width={3000} height={1708} />
    </span>
  )
}

/** Every numeral goes through Montserrat. */
export const Num = ({ children, className = '' }: { children: ReactNode; className?: string }) => <span className={`num ${className}`}>{children}</span>

/** Section reveal: a short dolly-in. Cuts straight to the end state under reduced motion. */
export function Reveal({ children, delay = 0, className = '', as = 'div' }: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'section' | 'li' }) {
  const reduce = useReducedMotion()
  const M = motion[as]
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.75, ease: DOLLY, delay }}
    >
      {children}
    </M>
  )
}

/** Page title block. The slate number gives every page a scene number, like a call sheet. */
export function PageHeader({ scene, eyebrow, title, children, aside }: { scene: string; eyebrow: string; title: ReactNode; children?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="border-b border-line pt-8 pb-7 md:pt-14 md:pb-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <Reveal className="min-w-0">
          <p className="flex items-center gap-3">
            <span className="slate-no">Sc. {scene}</span>
            <span className="h-px w-8 bg-line-strong" aria-hidden />
            <span className="eyebrow">{eyebrow}</span>
          </p>
          <h1 className="mt-4 text-[clamp(2.2rem,1.6rem+2.6vw,4.4rem)] leading-[1.02]">{title}</h1>
          {children && <div className="mt-4 max-w-[58ch] text-mute">{children}</div>}
        </Reveal>
        {aside && <Reveal delay={0.1}>{aside}</Reveal>}
      </div>
    </header>
  )
}

export function SectionTitle({ id, title, count, action }: { id?: string; title: string; count?: number; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-line pb-3">
      <h2 id={id} className="text-2xl md:text-3xl">
        {title}
        {count !== undefined && <Num className="ml-3 align-middle text-sm text-mute">{String(count).padStart(2, '0')}</Num>}
      </h2>
      {action}
    </div>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-line-strong px-6 py-10 md:px-10">
      <p className="slate-no">Nothing here yet</p>
      <h3 className="mt-3 text-2xl">{title}</h3>
      <p className="mt-2 max-w-[48ch] text-mute">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="border border-[#e0795f]/50 px-6 py-10 md:px-10">
      <p className="slate-no !text-[#e0795f]">Connection lost</p>
      <h3 className="mt-3 text-2xl">We couldn’t load this</h3>
      <p className="mt-2 max-w-[48ch] text-mute">Your connection dropped or the server is busy. Nothing you saved has been lost.</p>
      <button className="btn btn-gold mt-6" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}

export function ListSkeleton({ rows = 4, tall = false }: { rows?: number; tall?: boolean }) {
  return (
    <div className="grid gap-px border border-line bg-line" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`bg-ink p-4`}>
          <div className={`skeleton ${tall ? 'h-36' : 'h-14'}`} />
        </div>
      ))}
    </div>
  )
}

/** Drawn club monogram: a square plate, no fake logos. */
export function Monogram({ text, size = 'md', gold = false }: { text: string; size?: 'sm' | 'md' | 'lg'; gold?: boolean }) {
  const s = size === 'lg' ? 'h-20 w-20 text-3xl' : size === 'sm' ? 'h-9 w-9 text-sm' : 'h-12 w-12 text-lg'
  return (
    <span aria-hidden className={`${s} grid shrink-0 place-items-center border font-display italic ${gold ? 'border-gold bg-gold text-black' : 'border-line-strong text-gold'}`}>
      {text}
    </span>
  )
}

/** Native <dialog> with light dismiss. The browser handles focus, Escape and the top layer. */
export function Dialog({
  open,
  onClose,
  variant = 'modal',
  labelledBy,
  children,
}: {
  open: boolean
  onClose: () => void
  variant?: 'modal' | 'sheet' | 'palette'
  labelledBy: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className={variant}
      aria-labelledby={labelledBy}
      {...({ closedby: 'any' } as object)}
      onClose={onClose}
      // Fallback light dismiss for browsers without closedby: a click that lands on the dialog itself is the backdrop.
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close()
      }}
    >
      {open && children}
    </dialog>
  )
}

export type IconName =
  | 'search' | 'close' | 'bookmark' | 'bookmark-fill' | 'calendar' | 'pin' | 'arrow' | 'arrow-left' | 'check' | 'clock'
  | 'users' | 'home' | 'layers' | 'user' | 'bell' | 'github' | 'linkedin' | 'link' | 'play' | 'pause' | 'plus' | 'external' | 'ticket'
  | 'share' | 'qr' | 'camera' | 'edit' | 'mail' | 'globe' | 'chat' | 'image' | 'trash' | 'eye' | 'eye-off' | 'settings' | 'up' | 'down' | 'archive' | 'filter'

export function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'square' as const, strokeLinejoin: 'miter' as const }
  const paths: Record<IconName, ReactNode> = {
    search: <><path d="M10.5 4.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" {...p} /><path d="m20 20-5-5" {...p} /></>,
    close: <path d="M6 6l12 12M18 6 6 18" {...p} />,
    bookmark: <path d="M7 4h10v16l-5-4-5 4z" {...p} />,
    'bookmark-fill': <path d="M7 4h10v16l-5-4-5 4z" fill="currentColor" stroke="currentColor" strokeWidth={1.5} />,
    calendar: <><path d="M4 6h16v14H4zM4 10h16M9 3.5v4M15 3.5v4" {...p} /></>,
    pin: <><path d="M12 21s6-5.6 6-11a6 6 0 1 0-12 0c0 5.4 6 11 6 11z" {...p} /><path d="M11 9h2v2h-2z" {...p} /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" {...p} />,
    'arrow-left': <path d="M19 12H5m5-5-5 5 5 5" {...p} />,
    check: <path d="m5 12.5 4.5 4.5L19 7.5" {...p} />,
    clock: <><path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" {...p} /><path d="M12 8v4l3 2" {...p} /></>,
    users: <><path d="M9 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6M15.5 6.2a3 3 0 0 1 0 5.6M17 14.6c1.8.5 3 1.9 3.5 4.4" {...p} /></>,
    home: <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" {...p} />,
    layers: <><path d="m12 4 8 4-8 4-8-4z" {...p} /><path d="m4 12 8 4 8-4M4 16l8 4 8-4" {...p} /></>,
    user: <><path d="M12 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" {...p} /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" {...p} /></>,
    bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" {...p} /><path d="M10 20.5h4" {...p} /></>,
    github: <path d="M12 3.5a8.5 8.5 0 0 0-2.7 16.6c.4.1.6-.2.6-.4v-1.5c-2.4.5-2.9-1-2.9-1-.4-1-1-1.3-1-1.3-.8-.5.1-.5.1-.5.9.1 1.3.9 1.3.9.8 1.3 2 1 2.5.7.1-.6.3-1 .5-1.2-1.9-.2-3.9-1-3.9-4.2 0-.9.3-1.7.9-2.3-.1-.2-.4-1.1.1-2.3 0 0 .7-.2 2.3.9a8 8 0 0 1 4.2 0c1.6-1.1 2.3-.9 2.3-.9.5 1.2.2 2.1.1 2.3.6.6.9 1.4.9 2.3 0 3.3-2 4-3.9 4.2.3.3.6.8.6 1.6v2.4c0 .2.2.5.6.4A8.5 8.5 0 0 0 12 3.5z" fill="currentColor" />,
    linkedin: <><path d="M4 4h16v16H4z" {...p} /><path d="M8 10.5V16M8 7.6v.1M11.5 16v-5.5M11.5 13c0-1.7.9-2.6 2.2-2.6 1.3 0 2.3.8 2.3 2.6V16" {...p} /></>,
    link: <><path d="M10 14 14 10" {...p} /><path d="M9 11 6.5 13.5a3 3 0 0 0 4 4L13 15M11 9l2.5-2.5a3 3 0 0 1 4 4L15 13" {...p} /></>,
    play: <path d="M8 5v14l11-7z" fill="currentColor" />,
    pause: <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />,
    plus: <path d="M12 5v14M5 12h14" {...p} />,
    external: <><path d="M14 5h5v5M19 5l-8 8" {...p} /><path d="M17 14v5H5V7h5" {...p} /></>,
    ticket: <><path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" {...p} /><path d="M14 7v10" {...p} strokeDasharray="1.5 2" /></>,
    share: <><path d="M12 4v11M7.5 8.5 12 4l4.5 4.5" {...p} /><path d="M5 12v8h14v-8" {...p} /></>,
    qr: <><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" {...p} /><path d="M14 14h2v2h-2zM18 14h2M14 18v2M18 18h2v2" {...p} /></>,
    camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" {...p} /><path d="M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" {...p} /></>,
    edit: <><path d="M4 20h4L19 9l-4-4L4 16z" {...p} /><path d="M13 7l4 4" {...p} /></>,
    mail: <><path d="M3 6h18v12H3z" {...p} /><path d="m3 7 9 6 9-6" {...p} /></>,
    globe: <><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" {...p} /><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z" {...p} /></>,
    chat: <><path d="M4 5h16v11H9l-5 4z" {...p} /></>,
    image: <><path d="M4 5h16v14H4z" {...p} /><path d="m4 16 5-5 4 4 2-2 5 5" {...p} /><path d="M15.5 9.5h.01" {...p} /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" {...p} /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" {...p} /><path d="M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" {...p} /></>,
    'eye-off': <><path d="M2 12s3.5-6 10-6c1.6 0 3 .4 4.2 1M22 12s-3.5 6-10 6c-1.6 0-3-.4-4.2-1" {...p} /><path d="M4 20 20 4" {...p} /></>,
    settings: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" {...p} /><path d="M14 5h4v4h-4zM6 15h4v4H6z" {...p} /></>,
    up: <path d="m6 15 6-6 6 6" {...p} />,
    down: <path d="m6 9 6 6 6-6" {...p} />,
    archive: <><path d="M3 4h18v4H3zM5 8v12h14V8" {...p} /><path d="M10 12h4" {...p} /></>,
    filter: <path d="M4 5h16l-6 8v6l-4-2v-4z" {...p} />,
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {paths[name]}
    </svg>
  )
}
