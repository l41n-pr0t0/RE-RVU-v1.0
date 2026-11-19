import { EventRow } from '../components/EventBits'
import { EmptyState, Icon, PageHeader, SectionTitle } from '../components/ui'
import { useCatalog } from '../lib/catalog'
import { href } from '../lib/router'
import { useStore } from '../lib/store'

/** Everything you bookmarked or signed up for, in one list. */
export default function Saved() {
  const { allEvents, projectById, clubById } = useCatalog()
  const { savedEvents, registered, savedProjects, followedClubs, toggleSavedProject, toggleFollow } = useStore()
  const now = Date.now()
  const evs = allEvents
    .filter((e) => savedEvents.includes(e.id) || registered.includes(e.id))
    .sort((a, b) => +a.start - +b.start)
  const upcoming = evs.filter((e) => +e.end >= now)
  const past = evs.filter((e) => +e.end < now)
  const projects = savedProjects.map(projectById).filter((p) => !!p)
  const clubs = followedClubs.map(clubById).filter((c) => !!c)
  const empty = !evs.length && !projects.length && !clubs.length

  return (
    <div className="pb-16">
      <PageHeader scene="09" eyebrow="Saved" title="Kept for later.">
        Events you saved or signed up for, projects you bookmarked and clubs you follow.
      </PageHeader>

      {empty ? (
        <div className="mt-10">
          <EmptyState
            title="Nothing saved yet"
            body="Tap the bookmark on any event or project and it lands here."
            action={<a className="btn" href={href('events')}>Browse events</a>}
          />
        </div>
      ) : (
        <div className="mt-10 space-y-14">
          <section aria-labelledby="sv-events">
            <SectionTitle id="sv-events" title="Coming up" count={upcoming.length} action={<a className="hover-gold text-sm" href={href('calendar')}>Open calendar</a>} />
            {upcoming.length ? (
              <ul className="border-t border-line">{upcoming.map((e) => <EventRow key={e.id} e={e} />)}</ul>
            ) : (
              <p className="text-mute">No upcoming events saved.</p>
            )}
          </section>

          {projects.length > 0 && (
            <section aria-labelledby="sv-projects">
              <SectionTitle id="sv-projects" title="Projects" count={projects.length} />
              <ul className="border-t border-line">
                {projects.map((p) => (
                  <li key={p!.id} className="flex items-center justify-between gap-4 border-b border-line py-4">
                    <a href={href(`projects/${p!.id}`)} className="hover-gold min-w-0">
                      <span className="block truncate font-display text-xl">{p!.name}</span>
                      <span className="block text-sm text-mute">{p!.openings.length ? `${p!.openings.length} open roles` : p!.status}</span>
                    </a>
                    <button type="button" className="icon-btn" aria-label={`Remove ${p!.name}`} onClick={() => toggleSavedProject(p!.id)}>
                      <Icon name="close" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {clubs.length > 0 && (
            <section aria-labelledby="sv-clubs">
              <SectionTitle id="sv-clubs" title="Clubs you follow" count={clubs.length} />
              <ul className="border-t border-line">
                {clubs.map((c) => (
                  <li key={c!.id} className="flex items-center justify-between gap-4 border-b border-line py-4">
                    <a href={href(`clubs/${c!.id}`)} className="hover-gold min-w-0">
                      <span className="block truncate font-display text-xl">{c!.name}</span>
                      <span className="block text-sm text-mute">{c!.category}</span>
                    </a>
                    <button type="button" className="btn btn-sm" onClick={() => toggleFollow(c!.id)}>Unfollow</button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {past.length > 0 && (
            <section aria-labelledby="sv-past">
              <SectionTitle id="sv-past" title="Already happened" count={past.length} />
              <ul className="border-t border-line opacity-80">{past.map((e) => <EventRow key={e.id} e={e} />)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
