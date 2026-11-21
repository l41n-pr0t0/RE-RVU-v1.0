export type Theme = 'light' | 'dark'

const root = document.documentElement
const KEY = 'rvu-connect:theme-v2'

export function getTheme(): Theme {
  return root.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function otherTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}

/** Applies a theme to the live DOM, remembers it, and tells listeners. */
export function applyTheme(theme: Theme): void {
  root.dataset.theme = theme
  root.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#000000' : '#F4F0E6')
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* storage blocked: theme still applies for this page view */
  }
  try {
    if (typeof window !== 'undefined' && window.location.search.includes('theme=')) {
      const url = new URL(window.location.href)
      url.searchParams.delete('theme')
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash)
    }
  } catch {}
  window.dispatchEvent(new CustomEvent('rvu-theme', { detail: theme }))
}
