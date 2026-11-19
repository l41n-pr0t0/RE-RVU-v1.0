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

### 19 November 2026 · Rework: every page, own concept, all screen sizes
- **Concept:** a film "call sheet". Each page has a scene number (Sc. 00 landing, Sc. 01 welcome, Sc. 02 Today, Sc. 03 Events, Sc. 04 Clubs, Sc. 05 Projects, Sc. 06 Notices, Sc. 07 You). Labels stay plain; the film language stays in the small type.
- **Decision:** no rounded corners anywhere (team rule). Every `--radius-*` token is set to 0, plus a global `border-radius: 0` guard.
- **Decision:** no accent lines down the edge of cards. Urgency is shown by order, a gold tag and Montserrat day counts.
- **Landing:** fits in one screen (`100dvh`, no scroll) from iPhone SE (375×667) to 1920×1080. Its headline size uses `clamp()` against both width and `svh`. On short phones the sub-line hides and the button labels shorten.
- **WebGL screen:** a gold torus knot behind procedural fluted glass, built with three.js. It loads lazily in its own chunk, pauses off-screen and in hidden tabs, has a visible Pause button (WCAG 2.2.2) and shows one still frame under reduced motion.
- **Sign-in:** the name comes from the RVU email (`harshulkalabtech25@rvu.edu.in` gives Harshul Kala, School of CSE, Year 2). In the prototype no password is asked and nothing is sent. The real version would be Google sign-in limited to rvu.edu.in.
- **Profile links:** GitHub, LinkedIn and Portfolio, entered once and attached when you apply to a team or ask to join a club. Clubs ask only for what fits their category.
- **Mobile:** a five-tab bottom bar (Today, Events, Clubs, Projects, You) with the active tab inverted. Notices sit behind the bell in the header. All dialogs are native `<dialog>`: a bottom sheet on phones, a side panel on desktop.
- **Testing:** headless Chrome screenshots at iPhone SE, iPhone 16, iPhone 16 Pro Max, Pixel 9, Pixel 9 Pro, Pixel 10, Galaxy A55, iPad, 1440×900 and 1920×1080. No horizontal overflow and no console errors. We scripted the main flows: sign-in validation, welcome, event sheet, apply dialog and Ctrl K search.
- **Problem:** labels cut short ("7 NOVEMBE") and a "starts now" badge on an event already under way. **Fix:** short dates use `7 Nov`, and events in progress say "On now".
