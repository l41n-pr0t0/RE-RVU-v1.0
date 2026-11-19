import { useEffect, useState } from 'react'
import { replayTheme, toggleTheme } from '../ink/controller'
import { getTheme, type Theme } from '../ink/theme'

/** Light / dark switch. Ink bleeds out from the click point (ported from MNEMOS-ZERO). T toggles, R replays. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => getTheme())

  useEffect(() => {
    const sync = () => setTheme(getTheme())
    window.addEventListener('rvu-theme', sync)
    const TEXT_ENTRY = 'input:not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"]'
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof Element && e.target.closest(TEXT_ENTRY)) return
      if (e.key.toLowerCase() === 't') {
        e.preventDefault()
        toggleTheme()
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault()
        replayTheme()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('rvu-theme', sync)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={(e) => {
        const keyboard = e.detail === 0
        const r = e.currentTarget.getBoundingClientRect()
        toggleTheme(keyboard ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: e.clientX, y: e.clientY })
      }}
      aria-label={`Switch to ${next} theme (T)`}
      title={`Switch to ${next} theme. T to toggle, R to replay`}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-paper transition-colors hover:border-gold hover:text-gold ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
        {theme === 'dark' ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  )
}
