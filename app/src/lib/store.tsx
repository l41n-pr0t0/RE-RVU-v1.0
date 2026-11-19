import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Category, Links, Profile } from '../data/types'

/**
 * Local, persistent state. Fixes F4 (onboarding not remembered):
 * everything is written the moment it changes and read on first paint.
 */
interface State {
  profile: Profile | null
  savedEvents: string[]
  registered: string[]
  followedClubs: string[]
  joinRequests: Record<string, string> // clubId -> ISO date
  applications: Record<string, { role: string; at: string }> // projectId -> role
  readNotices: string[]
}

const KEY = 'rvu-connect:v2'
const empty: State = { profile: null, savedEvents: [], registered: [], followedClubs: [], joinRequests: {}, applications: {}, readNotices: [] }

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
  } catch {
    return empty
  }
}

interface Store extends State {
  setProfile: (p: Profile) => void
  setInterests: (i: Category[]) => void
  setLinks: (l: Links) => void
  toggleSaved: (id: string) => void
  register: (id: string) => void
  toggleFollow: (id: string) => void
  requestJoin: (clubId: string) => void
  apply: (projectId: string, role: string) => void
  withdraw: (projectId: string) => void
  markRead: (id: string) => void
  reset: () => void
}

const Ctx = createContext<Store | null>(null)

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
const add = (list: string[], id: string) => (list.includes(id) ? list : [...list, id])

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, set] = useState<State>(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(s))
  }, [s])

  const setProfile = useCallback((profile: Profile) => set((x) => ({ ...x, profile })), [])
  const setInterests = useCallback((interests: Category[]) => set((x) => (x.profile ? { ...x, profile: { ...x.profile, interests } } : x)), [])
  const setLinks = useCallback((links: Links) => set((x) => (x.profile ? { ...x, profile: { ...x.profile, links } } : x)), [])
  const toggleSaved = useCallback((id: string) => set((x) => ({ ...x, savedEvents: toggle(x.savedEvents, id) })), [])
  const register = useCallback((id: string) => set((x) => ({ ...x, registered: add(x.registered, id), savedEvents: add(x.savedEvents, id) })), [])
  const toggleFollow = useCallback((id: string) => set((x) => ({ ...x, followedClubs: toggle(x.followedClubs, id) })), [])
  const requestJoin = useCallback(
    (id: string) => set((x) => ({ ...x, joinRequests: { ...x.joinRequests, [id]: new Date().toISOString() }, followedClubs: add(x.followedClubs, id) })),
    [],
  )
  const apply = useCallback(
    (projectId: string, role: string) => set((x) => ({ ...x, applications: { ...x.applications, [projectId]: { role, at: new Date().toISOString() } } })),
    [],
  )
  const withdraw = useCallback(
    (projectId: string) =>
      set((x) => {
        const next = { ...x.applications }
        delete next[projectId]
        return { ...x, applications: next }
      }),
    [],
  )
  const markRead = useCallback((id: string) => set((x) => ({ ...x, readNotices: add(x.readNotices, id) })), [])
  const reset = useCallback(() => set(empty), [])

  const store = useMemo<Store>(
    () => ({ ...s, setProfile, setInterests, setLinks, toggleSaved, register, toggleFollow, requestJoin, apply, withdraw, markRead, reset }),
    [s, setProfile, setInterests, setLinks, toggleSaved, register, toggleFollow, requestJoin, apply, withdraw, markRead, reset],
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}

/**
 * Simulated fetch so every view shows real loading / error states.
 * Append `?offline` to the URL to see the error state.
 */
export function useQuery<T>(data: T, delay = 380) {
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; data?: T }>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    setState({ status: 'loading' })
    const fail = new URLSearchParams(location.search).has('offline') && attempt === 0
    const t = setTimeout(() => setState(fail ? { status: 'error' } : { status: 'ready', data }), delay)
    return () => clearTimeout(t)
  }, [data, delay, attempt])
  return { ...state, retry: () => setAttempt((a) => a + 1) }
}
