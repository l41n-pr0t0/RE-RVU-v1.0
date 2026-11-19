# Findings: live RVU Connect audit

Audited on 19 November 2026 at https://rvu-connect.vercel.app/?route=home, signed in with a real student account (Google sign-in), desktop at 1316 × 924. Format follows the Product Exploration Guide. Severity: **H** blocks a journey, **M** causes friction, **L** is polish.

---

### F1 · Brand fonts are not used (H, brand compliance)
- **Current experience:** Headlines use Bebas Neue. Body text uses Syne and Instrument Serif. Labels use Syne Mono.
- **Observation:** Computed styles list `Syne, Cantarell, system-ui`. Cantarell is only a fallback, and Playfair Display and Montserrat are missing.
- **Problem:** The product breaks the RV University brand guidelines (Cantarell primary, Playfair Display headings, Montserrat numerals). Mixing four display faces also muddies the hierarchy.
- **Affected users:** everyone, plus the Brand Team.
- **Proposed improvement:** A three-face system, used strictly: Cantarell for UI and body, Playfair Display for headings only, Montserrat for every number.
- **Expected benefit:** Brand compliance and a calmer, more readable hierarchy.
- **Prototype:** whole app; tokens in `app/src/index.css`.

### F2 · Off-brand gold, and the gold logo on a near-white background (H, brand compliance)
- **Current experience:** The accent is `#D0A863`. The gold logo sits on cream `#FAF8F3`.
- **Observation:** The brand gold is `#D7AC54`, and the brand book says the gold logo must never sit on a white background.
- **Problem:** The colour is off-palette and the logo is used in a way the brand book prohibits. Gold on cream also has low contrast.
- **Affected users:** everyone, plus the Brand Team.
- **Proposed improvement:** Black and Dark Slate surfaces, with Gold `#D7AC54` and Teal `#004854` as accents. The gold logo appears only on dark surfaces.
- **Expected benefit:** Compliance and a stronger logo presence.
- **Prototype:** global theme.

### F3 · Landing page tells you nothing before asking you to sign in (M, first-time UX)
- **Current experience:** A single, non-scrolling screen: a headline, "Continue with Google", "Explore demo", and four tiles.
- **Observation:** The tiles read "Live events from Firestore", "Published notices only". This is developer wording, and nothing shows what is actually on the platform.
- **Problem:** A first-year student cannot see any value before handing over their account.
- **Affected users:** new students, visitors, parents.
- **Proposed improvement:** A scroll-led landing page that shows this week's real events on a timeline, explains the three core jobs (find, join, never miss), and lets anyone browse without signing in.
- **Expected benefit:** Higher sign-in intent and less confusion.
- **Prototype:** `#/` landing page.

### F4 · Onboarding choice is not remembered (H, reliability)
- **Current experience:** After Google sign-in, a modal asks "How will you use RVU Connect?" (Student / Club core / School representative). A second step asks for name, year and school.
- **Observation:** After choosing Student, reloading any route (for example `?route=events`) shows the role picker again.
- **Problem:** Students go through onboarding repeatedly, and every deep link starts with a modal.
- **Affected users:** every newly signed-in user.
- **Proposed improvement:** Persist onboarding immediately. In our prototype, a single one-screen setup (role, year, school, interests) is saved locally and never shown twice. Club core and school representative roles go through a verification request instead of a self-selected toggle.
- **Expected benefit:** Deep links work, and onboarding takes one step instead of two.
- **Prototype:** `Onboarding` component.

### F5 · Dashboard leads with zeros and contradicts itself (H, IA / trust)
- **Current experience:** The hero stat boxes show "0 live events", "26 approved clubs", "0 updates". A scrolling ticker advertises "AI Build Night", "Club Recruitment" and "Project Collaboration".
- **Observation:** The ticker promises events that the feed says do not exist.
- **Problem:** The student loses trust in the first few seconds, and the first thing they see is an empty state.
- **Affected users:** all students.
- **Proposed improvement:** The home screen answers "What do I need to know today?" with the next event, unread priority notices, and this week on a single timeline. If a section is empty, it hides or points to the next useful action. Marketing tickers that are not backed by data are removed.
- **Expected benefit:** The first glance is useful and honest.
- **Prototype:** `#/home`.

### F6 · Empty states speak to developers, not students (M, content)
- **Current experience:** "Published events from Firestore will appear here once approved club core…", "Add interests and publish matching events or projects in Firestore."
- **Observation:** Students can't act on "Firestore".
- **Problem:** Empty states are dead ends with jargon.
- **Affected users:** all students.
- **Proposed improvement:** Every empty state says what is happening and gives one action, for example "No events match. Clear filters" or "Follow a club to see its events here".
- **Expected benefit:** Fewer dead ends.
- **Prototype:** `EmptyState` component, used everywhere.

### F7 · "Personalized for you" uses interests the student never picked (M, personalisation)
- **Current experience:** The section header lists "AI, Web Development, Design, Finance, Film, Product".
- **Observation:** These were never chosen during onboarding, and there is no visible control to change them on the dashboard. The spelling is US ("Personalized"); the brand requires UK English.
- **Problem:** The personalisation is unexplained and can't be controlled.
- **Affected users:** all students.
- **Proposed improvement:** Students pick interests in onboarding, the chips can be edited inline, and the section is titled "For you" or "Picked for you".
- **Expected benefit:** Recommendations the student understands and trusts.
- **Prototype:** onboarding plus Profile.

### F8 · Events filter is a 26-option club dropdown (M, findability)
- **Current experience:** The Events page has three selects: Type (All / Club Event / School Event), Club (26 names in one list) and Date.
- **Observation:** There is no text search on the page, no category filter, and filtering by more than one club isn't possible.
- **Problem:** Finding "something for me this week" means scanning a long dropdown.
- **Affected users:** all students, especially first years who don't know club names.
- **Proposed improvement:** Quick filter chips (Today / This week / Free / Open registration), category chips, search inside the page, and the active filters shown as removable chips.
- **Expected benefit:** Faster discovery.
- **Prototype:** `#/events`.

### F9 · "Events disappear after their date and time" (L, continuity)
- **Current experience:** This is stated on the Events page.
- **Problem:** Students can't look back at what a club has done, which is a key signal when choosing a club.
- **Proposed improvement:** Past events stay on the club page under "Past".
- **Prototype:** club detail.

### F10 · Global search sits in the header, away from the content (L, navigation)
- **Current experience:** A search field in the top bar.
- **Proposed improvement:** A command palette (Ctrl/⌘ K or `/`) that searches events, clubs, projects and notices together and lets you jump straight to them.
- **Prototype:** `CommandPalette`.

---

### Not yet audited
- Clubs, Projects, Announcements and Profile in a signed-in state on the live site, and its mobile layout. We paused because finishing onboarding would write to a real student profile. Our prototype covers all of these screens; we still need to compare them against the live site with team consent.
