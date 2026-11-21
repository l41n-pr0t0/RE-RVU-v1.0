import { useId, useMemo } from 'react'
import { useCatalog } from '../lib/catalog'
import { relativeDay, time } from '../lib/format'
import { buildNotifications, type Notif } from '../lib/notifications'
import { go } from '../lib/router'
import { useStore } from '../lib/store'
import { useOpenEvent } from './EventBits'
import { Dialog, Icon, Num } from './ui'

export function useNotifications() {
  const cat = useCatalog()
  const store = useStore()
  const items = useMemo(() => buildNotifications(cat, store), [cat, store])
  const unseen = items.filter((n) => !store.readNotifs.includes(n.id)).length
  return { items, unseen }
}

export function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId()
  return (
    <Dialog open={open} onClose={onClose} variant="sheet" labelledBy={titleId}>
      {open && <Panel titleId={titleId} onClose={onClose} />}
    </Dialog>
  )
}

function Panel({ titleId, onClose }: { titleId: string; onClose: () => void }) {
  const { items } = useNotifications()
  const { readNotifs, markNotifsRead, notifPrefs } = useStore()
  const openEvent = useOpenEvent()
  const now = new Date()

  // The digest keeps urgent things on top and folds the rest into one line
  const urgent = items.filter((n) => n.urgent)
  const rest = items.filter((n) => !n.urgent)

  const openItem = (n: Notif) => {
    markNotifsRead([n.id])
    onClose()
    if (n.eventId) openEvent(n.eventId)
    else if (n.path) go(n.path)
  }

  const row = (n: Notif) => {
    const seen = readNotifs.includes(n.id)
    return (
      <li key={n.id}>
        <button onClick={() => openItem(n)} className="row-hover grid w-full grid-cols-[0.5rem_minmax(0,1fr)_auto] gap-3 border-b border-line px-5 py-4 text-left md:px-8">
          <span aria-hidden className={`mt-2 h-2 w-2 ${seen ? '' : n.urgent ? 'bg-gold' : 'bg-paper/60'}`} />
          <span className="min-w-0">
            <span className="eyebrow block !text-[0.58rem]">{n.kind}</span>
            <span className={`mt-1 block leading-snug ${seen ? 'text-mute' : ''}`}>{n.title}</span>
            <span className="mt-0.5 block text-sm text-mute">{n.body}</span>
          </span>
          <span className="num pt-0.5 text-[0.68rem] text-mute">{n.at <= now && relativeDay(n.at, now) === 'Today' ? time(n.at) : relativeDay(n.at, now)}</span>
          {!seen && <span className="sr-only">Unread</span>}
        </button>
      </li>
    )
  }

  return (
    <div className="flex h-full max-h-[inherit] flex-col border-t border-line-strong bg-slate-2 md:border-t-0 md:border-l">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 md:px-8 md:py-4">
        <div>
          <h2 id={titleId} className="text-2xl">Notifications</h2>
          <button
            onClick={() => { onClose(); go('notices') }}
            className="mt-0.5 text-xs text-gold hover:underline"
          >
            All university notices →
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-sm" onClick={() => markNotifsRead(items.map((n) => n.id))}>Mark all read</button>
          <button onClick={onClose} aria-label="Close" className="icon-btn"><Icon name="close" /></button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {items.length === 0 ? (
          <div className="px-5 py-14 text-center md:px-8">
            <p className="font-display text-2xl">Nothing for you right now.</p>
            <p className="mt-2 text-sm text-mute">RSVP to an event, follow a club or add your skills, and the things that concern you will land here.</p>
          </div>
        ) : notifPrefs.digest ? (
          <>
            <ul>{urgent.map(row)}</ul>
            {rest.length > 0 && (
              <details className="border-b border-line">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 md:px-8">
                  <span>Daily digest · <Num>{rest.length}</Num> updates</span>
                  <Icon name="down" className="h-4 w-4 text-mute" />
                </summary>
                <ul className="border-t border-line">{rest.map(row)}</ul>
              </details>
            )}
          </>
        ) : (
          <ul>{items.map(row)}</ul>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm md:px-8">
        <span className="text-mute">You choose what reaches you.</span>
        <button className="hover-gold inline-flex items-center gap-2 text-gold" onClick={() => { onClose(); go('profile') ; setTimeout(() => document.getElementById('notification-settings')?.scrollIntoView(), 120) }}>
          <Icon name="settings" className="h-4 w-4" /> Settings
        </button>
      </div>
    </div>
  )
}
