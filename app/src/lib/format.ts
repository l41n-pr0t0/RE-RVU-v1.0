/** Brand date style: "4 April 2026" — no leading zero, no commas. */
export const longDate = (d: Date) =>
  `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'long' })} ${d.getFullYear()}`

export const dayMonth = (d: Date) =>
  `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`

export const weekday = (d: Date, style: 'long' | 'short' = 'short') =>
  d.toLocaleString('en-GB', { weekday: style })

export const time = (d: Date) =>
  d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', ' ')

const startOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export const daysFrom = (d: Date, now = new Date()) =>
  Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / 86_400_000)

/** "Today", "Tomorrow", "Thursday", or "24 November 2026" */
export const relativeDay = (d: Date, now = new Date()) => {
  const n = daysFrom(d, now)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  if (n > 1 && n < 7) return weekday(d, 'long')
  return longDate(d)
}

/** "in 3 h", "in 25 min", "now" */
export const countdown = (d: Date, now = new Date()) => {
  const mins = Math.round((d.getTime() - now.getTime()) / 60_000)
  if (mins <= 0) return 'now'
  if (mins < 60) return `in ${mins} min`
  const h = Math.round(mins / 60)
  if (h < 24) return `in ${h} h`
  const days = daysFrom(d, now)
  return `in ${days} day${days === 1 ? '' : 's'}`
}

export const isThisWeek = (d: Date, now = new Date()) => {
  const n = daysFrom(d, now)
  return n >= 0 && n < 7
}

/** Build an .ics file for "Add to calendar" — no third-party service. */
export function icsFor(e: { id: string; title: string; start: Date; end: Date; venue: string; summary: string }) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RVU Connect//EN',
    'BEGIN:VEVENT',
    `UID:${e.id}@rvu-connect`,
    `DTSTAMP:${f(new Date())}`,
    `DTSTART:${f(e.start)}`,
    `DTEND:${f(e.end)}`,
    `SUMMARY:${e.title}`,
    `LOCATION:${e.venue}, RV University`,
    `DESCRIPTION:${e.summary}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return URL.createObjectURL(new Blob([body], { type: 'text/calendar' }))
}

/** Build an .ics file containing multiple events for full schedule export. */
export function multiIcsFor(events: { id: string; title: string; start: Date; end: Date; venue: string; summary: string }[]) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RVU Connect//EN', 'CALSCALE:GREGORIAN']
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}@rvu-connect`,
      `DTSTAMP:${f(new Date())}`,
      `DTSTART:${f(e.start)}`,
      `DTEND:${f(e.end)}`,
      `SUMMARY:${e.title}`,
      `LOCATION:${e.venue}, RV University`,
      `DESCRIPTION:${e.summary}`,
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }))
}

/** Google Calendar "add event" link. Opens in a new tab; nothing is sent until the user saves. */
export function googleCalendarUrl(e: { title: string; start: Date; end: Date; venue: string; summary: string; campus?: string }) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${f(e.start)}/${f(e.end)}`,
    details: `${e.summary}\n\nFrom RVU Connect`,
    location: `${e.venue}, RV University${e.campus ? `, ${e.campus}` : ''}`,
  })
  return `https://calendar.google.com/calendar/render?${q}`
}

/** Absolute link to a screen in this app, for sharing. */
export const shareUrl = (path: string) => `${location.origin}${location.pathname}#/${path}`

/** Short, human-typeable ticket code. Deterministic so the host can match it. */
export function ticketCode(eventId: string, attendeeId: string) {
  let h = 2166136261
  for (const ch of `${eventId}:${attendeeId}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  let n = h >>> 0
  for (let i = 0; i < 6; i++) {
    out += alphabet[n % alphabet.length]
    n = Math.floor(n / alphabet.length) || (h >>> (i + 3))
  }
  return `${out.slice(0, 3)}-${out.slice(3)}`
}

export const REMINDER_OPTIONS = [
  { mins: 1440, label: 'A day before' },
  { mins: 60, label: 'An hour before' },
  { mins: 15, label: '15 minutes before' },
] as const

export const reminderLabel = (mins: number) => REMINDER_OPTIONS.find((o) => o.mins === mins)?.label ?? `${mins} min before`

export const monthLabel = (d: Date) => `${d.toLocaleString('en-GB', { month: 'long' })} ${d.getFullYear()}`
