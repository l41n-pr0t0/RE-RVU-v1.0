import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Category, Profile } from '../data/types'

/**
 * Local, persistent state. Fixes F4 (onboarding not remembered):
 * everything is written the moment it changes and read on first paint.
 */
interface State {
  profile: Profile | null
  savedEvents: string[]
  followedClubs: string[]
  appliedProjects: Record<string, string> // projectId -> role
  readNotices: string[]
}

const KEY = 'rvu-connect:v1'
const empty: State = { profile: null, savedEvents: [], followedClubs: [], appliedProjects: {}, readNotices: [] }

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
  toggleSaved: (id: string) => void
  toggleFollow: (id: string) => void
  apply: (projectId: string, role: string) => void
  markRead: (id: string) => void
  reset: () => void
}

const Ctx = createContext<Store | null>(null)

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, set] = useState<State>(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(s))
  }, [s])

  const store: Store = {
    ...s,
    setProfile: useCallback((profile: Profile) => set((x) => ({ ...x, profile })), []),
    setInterests: useCallback(
      (interests: Category[]) => set((x) => (x.profile ? { ...x, profile: { ...x.profile, interests } } : x)),
      [],
    ),
    toggleSaved: useCallback((id: string) => set((x) => ({ ...x, savedEvents: toggle(x.savedEvents, id) })), []),
    toggleFollow: useCallback((id: string) => set((x) => ({ ...x, followedClubs: toggle(x.followedClubs, id) })), []),
    apply: useCallback(
      (projectId: string, role: string) => set((x) => ({ ...x, appliedProjects: { ...x.appliedProjects, [projectId]: role } })),
      [],
    ),
    markRead: useCallback(
      (id: string) => set((x) => (x.readNotices.includes(id) ? x : { ...x, readNotices: [...x.readNotices, id] })),
      [],
    ),
    reset: useCallback(() => set(empty), []),
  }

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
export function useQuery<T>(data: T, delay = 550) {
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
