import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CampusEvent, Category, ClubPage, Links, Photo, Profile, Project } from '../data/types'

/**
 * Local, persistent state. Fixes F4 (onboarding not remembered):
 * everything is written the moment it changes and read on first paint.
 * In production each slice maps to one API resource; the shapes are the contract.
 */
export interface NotifPrefs {
  reminders: boolean
  followedClubs: boolean
  recruitment: boolean
  applications: boolean
  matches: boolean
  /** 'high' keeps only notices that need action */
  official: 'all' | 'high'
  /** Bundle low-priority items into one daily line */
  digest: boolean
}

export interface JoinRequest {
  at: string
  role: string
  answers: Record<string, string>
}

interface State {
  profile: Profile | null
  savedEvents: string[]
  savedNotices: string[]
  savedProjects: string[]
  registered: string[]
  /** eventId -> place in the queue when it was joined */
  waitlisted: Record<string, number>
  /** eventId -> minutes before start */
  reminders: Record<string, number[]>
  attended: string[]
  followedClubs: string[]
  joinRequests: Record<string, JoinRequest>
  applications: Record<string, { role: string; at: string; note: string }>
  readNotices: string[]
  readNotifs: string[]
  notifPrefs: NotifPrefs
  /** Host side */
  managing: string | null
  hostedEvents: CampusEvent[]
  clubPages: Record<string, ClubPage>
  checkins: Record<string, string[]>
  eventPhotos: Record<string, Photo[]>
  myProjects: Project[]
}

const KEY = 'rvu-connect:v3'
export const defaultPrefs: NotifPrefs = { reminders: true, followedClubs: true, recruitment: true, applications: true, matches: true, official: 'all', digest: false }
const empty: State = {
  profile: null,
  savedEvents: [],
  savedNotices: [],
  savedProjects: [],
  registered: [],
  waitlisted: {},
  reminders: {},
  attended: [],
  followedClubs: [],
  joinRequests: {},
  applications: {},
  readNotices: [],
  readNotifs: [],
  notifPrefs: defaultPrefs,
  managing: null,
  hostedEvents: [],
  clubPages: {},
  checkins: {},
  eventPhotos: {},
  myProjects: [],
}

const DATE_KEYS = new Set(['start', 'end', 'closes', 'updated'])
const ISO = /^\d{4}-\d{2}-\d{2}T/

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw, (k, v) => (DATE_KEYS.has(k) && typeof v === 'string' && ISO.test(v) ? new Date(v) : v))
    const s: State = { ...empty, ...parsed, notifPrefs: { ...defaultPrefs, ...parsed.notifPrefs } }
    if (s.profile) s.profile = Object.assign({ skills: [], openToCollaborate: false, bio: '' }, s.profile)
    return s
  } catch {
    return empty
  }
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
const add = (list: string[], id: string) => (list.includes(id) ? list : [...list, id])
const without = <T,>(r: Record<string, T>, id: string) => {
  const next = { ...r }
  delete next[id]
  return next
}

/** Past events the demo student "attended", so the participation profile is not empty on day one. */
const DEMO_HISTORY = ['past-iterium-1', 'past-rudra-1', 'past-cybersec-1']

function useActions(set: React.Dispatch<React.SetStateAction<State>>) {
  return useMemo(() => {
    const patch = (fn: (x: State) => Partial<State>) => set((x) => ({ ...x, ...fn(x) }))
    return {
      setProfile: (profile: Profile) =>
        patch((x) => ({ profile, attended: x.profile || !profile.email ? x.attended : [...new Set([...x.attended, ...DEMO_HISTORY])] })),
      updateProfile: (p: Partial<Profile>) => patch((x) => (x.profile ? { profile: { ...x.profile, ...p } } : {})),
      setInterests: (interests: Category[]) => patch((x) => (x.profile ? { profile: { ...x.profile, interests } } : {})),
      setLinks: (links: Links) => patch((x) => (x.profile ? { profile: { ...x.profile, links } } : {})),
      toggleSaved: (id: string) => patch((x) => ({ savedEvents: toggle(x.savedEvents, id) })),
      toggleSavedNotice: (id: string) => patch((x) => ({ savedNotices: toggle(x.savedNotices, id) })),
      toggleSavedProject: (id: string) => patch((x) => ({ savedProjects: toggle(x.savedProjects, id) })),
      /** RSVP. A default one-hour reminder is set so nobody has to remember to remember. */
      register: (id: string) =>
        patch((x) => ({
          registered: add(x.registered, id),
          savedEvents: add(x.savedEvents, id),
          waitlisted: without(x.waitlisted, id),
          reminders: x.reminders[id] ? x.reminders : { ...x.reminders, [id]: [60] },
        })),
      cancelRegistration: (id: string) => patch((x) => ({ registered: x.registered.filter((r) => r !== id), reminders: without(x.reminders, id) })),
      joinWaitlist: (id: string, place: number) => patch((x) => ({ waitlisted: { ...x.waitlisted, [id]: place }, savedEvents: add(x.savedEvents, id) })),
      leaveWaitlist: (id: string) => patch((x) => ({ waitlisted: without(x.waitlisted, id) })),
      setReminders: (id: string, mins: number[]) => patch((x) => ({ reminders: mins.length ? { ...x.reminders, [id]: mins } : without(x.reminders, id) })),
      toggleFollow: (id: string) => patch((x) => ({ followedClubs: toggle(x.followedClubs, id) })),
      requestJoin: (clubId: string, role: string, answers: Record<string, string>) =>
        patch((x) => ({ joinRequests: { ...x.joinRequests, [clubId]: { at: new Date().toISOString(), role, answers } }, followedClubs: add(x.followedClubs, clubId) })),
      withdrawJoin: (clubId: string) => patch((x) => ({ joinRequests: without(x.joinRequests, clubId) })),
      apply: (projectId: string, role: string, note = '') =>
        patch((x) => ({ applications: { ...x.applications, [projectId]: { role, at: new Date().toISOString(), note } } })),
      withdraw: (projectId: string) => patch((x) => ({ applications: without(x.applications, projectId) })),
      markRead: (id: string) => patch((x) => ({ readNotices: add(x.readNotices, id) })),
      markNotifsRead: (ids: string[]) => patch((x) => ({ readNotifs: [...new Set([...x.readNotifs, ...ids])] })),
      setNotifPrefs: (p: Partial<NotifPrefs>) => patch((x) => ({ notifPrefs: { ...x.notifPrefs, ...p } })),
      setManaging: (clubId: string | null) => patch(() => ({ managing: clubId })),
      saveClubPage: (clubId: string, page: ClubPage) => patch((x) => ({ clubPages: { ...x.clubPages, [clubId]: page } })),
      resetClubPage: (clubId: string) => patch((x) => ({ clubPages: without(x.clubPages, clubId) })),
      hostEvent: (e: CampusEvent) => patch((x) => ({ hostedEvents: [...x.hostedEvents.filter((h) => h.id !== e.id), e] })),
      removeHostedEvent: (id: string) => patch((x) => ({ hostedEvents: x.hostedEvents.filter((h) => h.id !== id) })),
      checkIn: (eventId: string, attendeeId: string) =>
        patch((x) => ({ checkins: { ...x.checkins, [eventId]: add(x.checkins[eventId] ?? [], attendeeId) } })),
      undoCheckIn: (eventId: string, attendeeId: string) =>
        patch((x) => ({ checkins: { ...x.checkins, [eventId]: (x.checkins[eventId] ?? []).filter((a) => a !== attendeeId) } })),
      markAttended: (eventId: string) => patch((x) => ({ attended: add(x.attended, eventId) })),
      addPhotos: (eventId: string, photos: Photo[]) => patch((x) => ({ eventPhotos: { ...x.eventPhotos, [eventId]: [...(x.eventPhotos[eventId] ?? []), ...photos] } })),
      removePhoto: (eventId: string, photoId: string) =>
        patch((x) => ({ eventPhotos: { ...x.eventPhotos, [eventId]: (x.eventPhotos[eventId] ?? []).filter((p) => p.id !== photoId) } })),
      publishProject: (p: Project) => patch((x) => ({ myProjects: [...x.myProjects.filter((m) => m.id !== p.id), p] })),
      deleteProject: (id: string) => patch((x) => ({ myProjects: x.myProjects.filter((m) => m.id !== id) })),
      reset: () => set(empty),
    }
  }, [set])
}

export type Actions = ReturnType<typeof useActions>
type Store = State & Actions

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, set] = useState<State>(load)
  const actions = useActions(set)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s))
    } catch {
      // Storage full (usually photos). The state still works for this session.
    }
  }, [s])

  const store = useMemo<Store>(() => ({ ...s, ...actions }), [s, actions])
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}

/** Identity for check-in and tickets. */
export const myAttendeeId = (p: Profile | null) => (p?.email ? p.email.split('@')[0] : 'guest')

/**
 * Simulated fetch so every view shows real loading / error states.
 * Append `?offline` to the URL to see the error state.
 */
export function useQuery<T>(data: T, delay = 380) {
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; data?: T }>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    setState((x) => (x.status === 'ready' ? { status: 'ready', data } : { status: 'loading' }))
    const fail = new URLSearchParams(location.search).has('offline') && attempt === 0
    const t = setTimeout(() => setState(fail ? { status: 'error' } : { status: 'ready', data }), delay)
    return () => clearTimeout(t)
  }, [data, delay, attempt])
  return { ...state, retry: () => setAttempt((a) => a + 1) }
}
