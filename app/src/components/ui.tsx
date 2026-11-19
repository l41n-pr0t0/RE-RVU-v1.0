import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

export const DOLLY = [0.2, 0.7, 0.1, 1] as const

/** Official logo asset, unaltered. In light theme it sits on a black plate: the gold logo never touches a light surface (brand rule). */
export function Logo({ className = 'h-10' }: { className?: string }) {
  return (
    <span className="logo-plate">
      <img src="/brand/rvu-logo-gold.png" alt="RV University" className={`${className} w-auto select-none`} draggable={false} />
    </span>
  )
}

/** Every numeral goes through Montserrat. */
export const Num = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <span className={`num ${className}`}>{children}</span>
)

/** Section reveal: a short dolly-in. Cuts to the end state under reduced motion. */
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: DOLLY, delay }}
    >
      {children}
    </motion.div>
  )
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="pt-10 pb-8 md:pt-16 md:pb-10">
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-4xl md:text-6xl leading-[1.05]">{title}</h1>
        {children && <div className="mt-4 max-w-[60ch] text-mute">{children}</div>}
      </Reveal>
    </header>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="panel px-6 py-10 text-center md:px-10">
      <div className="mx-auto mb-5 h-px w-16 bg-gold/70" aria-hidden />
      <h3 className="text-2xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-[46ch] text-mute">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="panel border-gold/30 px-6 py-10 text-center">
      <h3 className="text-2xl">We couldn’t reach RVU Connect</h3>
      <p className="mx-auto mt-2 max-w-[46ch] text-mute">
        Your connection dropped or the server is busy. Nothing you saved has been lost.
      </p>
      <button className="btn btn-gold mt-6" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}

export function ListSkeleton({ rows = 4, tall = false }: { rows?: number; tall?: boolean }) {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`skeleton ${tall ? 'h-44' : 'h-24'}`} />
      ))}
    </div>
  )
}

/** Drawn club monogram — avoids fake logos. */
export function Monogram({ text, size = 'md' }: { text: string; size?: 'md' | 'lg' }) {
  const s = size === 'lg' ? 'h-20 w-20 text-3xl' : 'h-12 w-12 text-lg'
  return (
    <span
      aria-hidden
      className={`${s} grid shrink-0 place-items-center rounded-full border border-gold/50 font-display italic text-gold`}
    >
      {text}
    </span>
  )
}

export function Icon({ name, className = 'h-5 w-5' }: { name: 'search' | 'close' | 'bookmark' | 'bookmark-fill' | 'calendar' | 'pin' | 'arrow' | 'check' | 'clock' | 'users'; className?: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const paths: Record<typeof name, ReactNode> = {
    search: <><circle cx="11" cy="11" r="6.5" {...p} /><path d="m20 20-4.2-4.2" {...p} /></>,
    close: <path d="M6 6l12 12M18 6 6 18" {...p} />,
    bookmark: <path d="M7 4h10v16l-5-3.5L7 20z" {...p} />,
    'bookmark-fill': <path d="M7 4h10v16l-5-3.5L7 20z" fill="currentColor" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />,
    calendar: <><rect x="4" y="5.5" width="16" height="14" rx="2" {...p} /><path d="M4 10h16M9 3.5v4M15 3.5v4" {...p} /></>,
    pin: <><path d="M12 21s6-5.6 6-11a6 6 0 1 0-12 0c0 5.4 6 11 6 11z" {...p} /><circle cx="12" cy="10" r="2" {...p} /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" {...p} />,
    check: <path d="m5 12.5 4.5 4.5L19 7.5" {...p} />,
    clock: <><circle cx="12" cy="12" r="8" {...p} /><path d="M12 8v4l2.5 2" {...p} /></>,
    users: <><circle cx="9" cy="9" r="3.2" {...p} /><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6M15.5 6.2a3 3 0 0 1 0 5.6M17 14.6c1.8.5 3 1.9 3.5 4.4" {...p} /></>,
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {paths[name]}
    </svg>
  )
}
