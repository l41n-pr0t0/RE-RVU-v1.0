import type { Catalog } from './catalog'
import { skillMatch } from './catalog'
import { countdown, relativeDay, reminderLabel, time } from './format'
import type { useStore } from './store'

export type NotifKind = 'Reminder' | 'Waitlist' | 'From a club you follow' | 'Recruiting' | 'Your applications' | 'Matches your skills' | 'Official'

export interface Notif {
  id: string
  kind: NotifKind
  title: string
  body: string
  at: Date
  /** Hash path to open, or an event id for the sheet */
  path?: string
  eventId?: string
  urgent?: boolean
}

type Store = ReturnType<typeof useStore>

/**
 * Personalised notifications, built from what the student actually did:
 * RSVPs, follows, applications and skills. Nothing is broadcast to everyone
 * except official notices, and those can be cut to "needs action" only.
 */
export function buildNotifications(cat: Catalog, s: Store, now = new Date()): Notif[] {
  const p = s.notifPrefs
  const out: Notif[] = []
  const day = 86_400_000

  if (p.reminders) {
    for (const id of s.registered) {
      const e = cat.eventById(id)
      if (!e || e.end < now) continue
      const mins = s.reminders[id] ?? []
      // A reminder is "live" once its moment has passed and the event hasn't started yet
      const due = mins.filter((m) => e.start.getTime() - m * 60_000 <= now.getTime()).sort((a, b) => a - b)[0]
      if (due !== undefined || e.start <= now)
        out.push({
          id: `rem-${id}-${due ?? 0}`,
          kind: 'Reminder',
          title: e.start <= now ? `${e.title} is on now` : `${e.title} starts ${countdown(e.start, now)}`,
          body: `${e.venue} · ${time(e.start)}. Your entry pass is in the event.`,
          at: due !== undefined ? new Date(e.start.getTime() - due * 60_000) : e.start,
          eventId: id,
          urgent: true,
        })
      else if (mins.length)
        out.push({
          id: `rem-set-${id}`,
          kind: 'Reminder',
          title: `Reminder set for ${e.title}`,
          body: `${mins.map(reminderLabel).join(' and ')}. ${relativeDay(e.start, now)} at ${time(e.start)}.`,
          at: now,
          eventId: id,
        })
    }
    for (const [id, place] of Object.entries(s.waitlisted)) {
      const e = cat.eventById(id)
      if (!e || e.end < now) continue
      out.push({ id: `wl-${id}`, kind: 'Waitlist', title: `You’re number ${place} on the waitlist`, body: `${e.title}, ${relativeDay(e.start, now).toLowerCase()}. We’ll move you up when a seat frees.`, at: now, eventId: id })
    }
  }

  if (p.followedClubs) {
    for (const e of cat.events) {
      if (!s.followedClubs.includes(e.hostId) || e.start.getTime() - now.getTime() > 14 * day) continue
      out.push({ id: `fc-${e.id}`, kind: 'From a club you follow', title: `${e.hostName}: ${e.title}`, body: `${relativeDay(e.start, now)} at ${time(e.start)} · ${e.venue}`, at: new Date(e.start.getTime() - 7 * day), eventId: e.id })
    }
  }

  if (p.recruitment) {
    const interests = s.profile?.interests ?? []
    for (const c of cat.clubs) {
      if (!c.recruiting || s.joinRequests[c.id]) continue
      if (!s.followedClubs.includes(c.id) && !interests.includes(c.category)) continue
      const page = cat.clubPage(c.id)
      out.push({ id: `rc-${c.id}`, kind: 'Recruiting', title: `${c.name} is recruiting`, body: page.recruitment.roles.length ? `Open roles: ${page.recruitment.roles.join(', ')}.` : page.recruitment.message, at: new Date(now.getTime() - 2 * day), path: `clubs/${c.id}` })
    }
  }

  if (p.applications) {
    for (const [id, a] of Object.entries(s.applications)) {
      const pr = cat.projectById(id)
      if (!pr) continue
      out.push({ id: `ap-${id}`, kind: 'Your applications', title: `Sent to ${pr.name}`, body: `${a.role}. ${pr.team[0]?.name ?? 'The team'} will reply on your RVU email.`, at: new Date(a.at), path: `projects/${id}` })
    }
    for (const [id, r] of Object.entries(s.joinRequests)) {
      const c = cat.clubById(id)
      if (!c) continue
      out.push({ id: `jr-${id}`, kind: 'Your applications', title: `Request sent to ${c.name}`, body: `${r.role || 'Member'}. The core team reviews requests within a week.`, at: new Date(r.at), path: `clubs/${id}` })
    }
  }

  if (p.matches && s.profile?.skills.length) {
    for (const pr of cat.projects) {
      if (pr.mine || s.applications[pr.id]) continue
      const hit = pr.openings.find((o) => skillMatch(s.profile!.skills, o.skills).length)
      if (!hit) continue
      out.push({ id: `mt-${pr.id}`, kind: 'Matches your skills', title: `${pr.name} needs a ${hit.role.toLowerCase()}`, body: `You listed ${skillMatch(s.profile.skills, hit.skills).join(', ')}.`, at: pr.updated, path: `projects/${pr.id}` })
    }
  }

  for (const n of cat.notices) {
    if (p.official === 'high' && n.priority !== 'High') continue
    out.push({ id: `of-${n.id}`, kind: 'Official', title: n.title, body: n.from, at: n.posted, path: 'notices', urgent: n.priority === 'High' && !s.readNotices.includes(n.id) })
  }

  return out.sort((a, b) => Number(!!b.urgent) - Number(!!a.urgent) || +b.at - +a.at)
}
