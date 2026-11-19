import { useEffect, useState } from 'react'

/** Tiny hash router: deep links like #/clubs/iterium survive reloads (F4). */
export type Route =
  | { name: 'landing' }
  | { name: 'home' }
  | { name: 'events'; id?: string }
  | { name: 'clubs'; id?: string }
  | { name: 'projects'; id?: string }
  | { name: 'notices' }
  | { name: 'profile' }

export function parse(hash: string): Route {
  const [, a, b] = hash.replace(/^#/, '').split('/')
  switch (a) {
    case 'home':
      return { name: 'home' }
    case 'events':
      return { name: 'events', id: b }
    case 'clubs':
      return { name: 'clubs', id: b }
    case 'projects':
      return { name: 'projects', id: b }
    case 'notices':
      return { name: 'notices' }
    case 'profile':
      return { name: 'profile' }
    default:
      return { name: 'landing' }
  }
}

export const href = (path: string) => `#/${path}`

export function go(path: string) {
  location.hash = `/${path}`
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const on = () => {
      const next = parse(location.hash)
      setRoute((prev) => {
        // Only scroll to top when the page changes, not when a drawer opens
        if (prev.name !== next.name) window.scrollTo({ top: 0 })
        return next
      })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
