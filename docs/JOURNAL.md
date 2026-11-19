# Journal: problems faced and decisions

Dated log, newest at the bottom.

## 19 November 2026

- **Decision: brand rules beat generic design rules.** The brand book requires Black `#000000` and Playfair Display headings. Our design-quality checklist discourages both. RV University's brand wins.
- **Decision: full-app redesign, frontend only.** Vite + React + TypeScript + Tailwind + Framer Motion, using typed mock data. The live site's data is mostly empty (0 events, 0 announcements), so mock data is what lets us demonstrate real journeys.
- **Problem: brand book PDF is 183 MB.** It is too large for GitHub (100 MB limit). We kept `Resources/` out of git and moved every rule we need into `docs/BRIEF.md`.
- **Problem: live-site audit with a real account.** Signing in with Google drops a new student into a role-picker modal. After choosing Student, the choice was not remembered: reloading any route showed the role picker again, followed by a second "Basic information" step. We logged this as a finding.
- **Observation: the live site does not use the brand fonts.** Computed styles show Syne, Syne Mono, Instrument Serif and Bebas Neue. None of them is Cantarell, Playfair Display or Montserrat. Its gold is `#D0A863`, while the brand gold is `#D7AC54`.

### 19 November 2026 · Light and dark theme with the ink-bleed transition
- **Decision:** reuse the ink-bleed theme switch from our earlier project MNEMOS-ZERO, without changing its engine (`app/src/ink/viewInk.ts`). It uses View Transitions plus a JS-animated clip-path that spreads from the click point, and falls back to a cross-fade under reduced motion or in browsers without View Transitions. Keyboard: T toggles, R replays.
- **Problem:** the brand says the gold logo must never sit on a white background. **Fix:** in light theme the logo sits on a black plate (`.logo-plate`).
- **Problem:** brand gold `#D7AC54` used as text fails contrast on a light surface. **Fix:** light theme uses a deeper gold (`#85631f`) for gold *text* only. Fills, lines and buttons keep `#D7AC54`, and text on gold buttons is always black.
- Dark stays the default (first visit opens on the black stage). The theme is set by a pre-paint script, so there is no flash.
