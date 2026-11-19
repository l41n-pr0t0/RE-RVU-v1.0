import { useMemo } from 'react'
import { clubs, defaultClubPage, events as baseEvents, notices, pastEvents as basePast, projects as baseProjects, students as baseStudents } from '../data/mock'
import type { CampusEvent, Club, ClubPage, Profile, Project, Student } from '../data/types'
import { useStore } from './store'

/**
 * One read model for every screen: the seeded data plus whatever this browser
 * created (hosted events, club page edits, published projects, your RSVP).
 * In production this is the API response; components never import mock data directly.
 */
export function useCatalog() {
  const { hostedEvents, clubPages, eventPhotos, myProjects, registered, profile } = useStore()

  return useMemo(() => {
    const now = new Date()
    const withMe = (e: CampusEvent): CampusEvent => ({
      ...e,
      registered: e.registered + (registered.includes(e.id) ? 1 : 0),
      photos: [...(e.photos ?? []), ...(eventPhotos[e.id] ?? [])],
    })
    const every = [...baseEvents, ...basePast, ...hostedEvents].map(withMe)
    const upcoming = every.filter((e) => e.end > now).sort((a, b) => +a.start - +b.start)
    const past = every.filter((e) => e.end <= now).sort((a, b) => +b.start - +a.start)

    const page = (id: string): ClubPage => {
      const c = clubs.find((x) => x.id === id)
      return clubPages[id] ?? (c ? defaultClubPage(c) : (undefined as never))
    }
    const liveClubs: Club[] = clubs.map((c) => {
      const p = clubPages[c.id]
      return p ? { ...c, tagline: p.tagline, recruiting: p.recruitment.open } : c
    })

    const projects: Project[] = [...myProjects.map((p) => ({ ...p, mine: true })), ...baseProjects].sort((a, b) => +b.updated - +a.updated)

    const me = profile && profile.email && profile.openToCollaborate ? meAsStudent(profile) : null
    const students: Student[] = me ? [me, ...baseStudents] : baseStudents

    return {
      clubs: liveClubs,
      clubById: (id: string) => liveClubs.find((c) => c.id === id),
      clubPage: page,
      events: upcoming,
      pastEvents: past,
      allEvents: every,
      eventById: (id: string) => every.find((e) => e.id === id),
      hostOf: (e: CampusEvent) => liveClubs.find((c) => c.id === e.hostId),
      projects,
      projectById: (id: string) => projects.find((p) => p.id === id),
      students,
      studentById: (id: string) => students.find((s) => s.id === id),
      notices,
    }
  }, [hostedEvents, clubPages, eventPhotos, myProjects, registered, profile])
}

export type Catalog = ReturnType<typeof useCatalog>

export function meAsStudent(p: Profile): Student {
  return {
    id: 'me',
    name: p.name,
    school: p.school,
    year: p.year,
    skills: p.skills,
    interests: p.interests,
    bio: p.bio,
    openToCollaborate: p.openToCollaborate,
    links: p.links,
    clubs: [],
  }
}

/** Seats, waitlist and your place in it: the one rule set for every RSVP button. */
export type RsvpState = 'past' | 'going' | 'waitlisted' | 'open' | 'full' | 'waitlist-open' | 'closed'

export function rsvpState(e: CampusEvent, s: { registered: string[]; waitlisted: Record<string, number> }, now = new Date()): RsvpState {
  if (e.end <= now) return 'past'
  if (s.registered.includes(e.id)) return 'going'
  if (s.waitlisted[e.id]) return 'waitlisted'
  if (!e.registrationOpen) return 'closed'
  if (e.registered >= e.seats) return e.waitlist >= 0 ? 'waitlist-open' : 'full'
  return 'open'
}

/** Case-insensitive skill overlap; used for "a team needs your skills". */
export const skillMatch = (mine: string[], wanted: string[]) => {
  const m = new Set(mine.map((x) => x.toLowerCase()))
  return wanted.filter((w) => m.has(w.toLowerCase()))
}
