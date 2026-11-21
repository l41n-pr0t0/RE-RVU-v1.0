import type { Route } from '../lib/router'

/**
 * The stage every signed-in page is played on (DESIGN.md §1, "The stage").
 * Two follow-spots, a sound-stage floor receding to a horizon, rigging on the
 * frame's columns, and the scene's name painted huge and cropped at the edge,
 * so the backdrop always says where you are. Brand palette only; no gold.
 */
const SCENES: Partial<Record<Route['name'], [string, string]>> = {
  home: ['02', 'Today'],
  events: ['03', 'Events'],
  clubs: ['04', 'Clubs'],
  projects: ['05', 'Projects'],
  profile: ['07', 'You'],
  host: ['08', 'Host'],
  saved: ['09', 'Saved'],
  calendar: ['10', 'Calendar'],
  notices: ['11', 'Notices'],
}

export function Stage({ route }: { route: Route }) {
  const [, word] = SCENES[route.name] ?? ['01', 'Connect']
  return (
    <div className="stage-bg" aria-hidden>
      <div className="stage-beam stage-beam--a" />
      <div className="stage-beam stage-beam--b" />
      <div className="stage-floor">
        <div className="stage-floor__grid" />
      </div>
      <div key={route.name} className="stage-title">
        <span className="stage-title__word">{word}</span>
      </div>
    </div>
  )
}
