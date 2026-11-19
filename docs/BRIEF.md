# RE:RVU v1.0 — Track 01 Brief (metadata, source of truth)

Extracted from `Resources/` on 19 November 2026. Everything here is a **hard constraint** unless marked *(guidance)*.

## 1. Sources
| File | What it governs |
|---|---|
| `Resources/RE-RVU_Participant-Handbook.pdf` (16 pp) | Event rules, tracks, deliverables, evaluation weights |
| `Resources/RVU-Connect_Product-Exploration-Guide.pdf` (12 pp) | Track 01 exploration framework, findings format, brand summary |
| `Resources/Brand guidelines March 2026.pdf` (24 pp) | Logo, colour, typography, writing style — "no exceptions" |

## 2. Event
- **Event:** RE:RVU v1.0 — "Build what comes next. Rethink. Rebuild. Reimagine."
- **Organiser:** Iterium — AI Automation and Product Development Club, RV University. Platform: Unstop. 100% online, 7 days.
- **Product:** RVU Connect, built by Iterium for the Office of Student Affairs. Live: https://rvu-connect.vercel.app/?route=home
- **Our track:** **TRACK 01 — RVU Connect Innovation: "Make the existing platform genuinely useful."**
- **Our scope (decided):** frontend only, TypeScript + React (Vite), mock data, full-app redesign.

## 3. Track 01 focus areas
- **User experience:** simplify confusing journeys, cut unnecessary steps, improve interaction, make key info easier to find.
- **Interface & design:** visual hierarchy, intuitive layouts, consistency across screens, easier to understand.
- **Navigation & IA:** organise information, improve nav structures, easier access to key sections, less friction between related workflows.
- **Existing functionality:** make existing features more useful, find workflow gaps, more reliable/accessible, improve common tasks.
- **Rule:** "Adding more features is not automatically an improvement. Prioritise usefulness, simplicity and user value."
- **Principles:** Improve before expanding · Solve real problems · Think about the entire journey · Design for actual users · Demonstrate, don't just describe.

## 4. Exploration framework (Product Guide)
A. First-time user experience · B. Navigation & IA · C. UI & visual design · D. Existing features & workflows · E. Mobile experience.
Opportunity method: **Observe → Understand → Define → Propose → Demonstrate.**

## 5. Findings format (each improvement)
Current Experience · Observation · Problem · Affected Users · Proposed Improvement · Expected Benefit · Prototype. → `docs/FINDINGS.md`

## 6. Deliverables
1. **Solution deck (PDF)**, in this order: Problem Statement · Target Users · Problem Context · Proposed Solution · Key Features · User Journey · Implementation Approach · Expected Impact. Track 01 decks must also cover: which part of RVU Connect was explored, the current UX, the problem/opportunity, why it matters, the improvement, how it works, the benefit, and the implementation approach. → `docs/DECK_OUTLINE.md`
2. **Prototype link:** working, publicly accessible with no special access needed. GitHub and video are NOT required.
- Must state each member's contribution. Third-party assets/libraries must be acknowledged (→ `docs/CREDITS.md`).
- AI tools allowed, but we must be able to explain the problem, why the solution fits, how the prototype works, and who did what.

## 7. Evaluation (20% each)
1. Problem understanding & relevance · 2. Innovation & solution quality · 3. UX & design · 4. Feasibility & technical potential · 5. Prototype quality & execution.
Track 01 lens: "meaningful improvements to existing features, navigation, usability and user journeys."

## 8. BRAND — enforced (Brand guidelines March 2026)
### Colour
| Role | Name | HEX | RGB | CMYK / Pantone |
|---|---|---|---|---|
| Primary | Black | `#000000` | 0 0 0 | C0 M0 Y0 K100 · PANTONE 426C |
| Primary accent | Gold | `#D7AC54` | 215 172 84 | C19 M33 Y75 K0 · PANTONE P 15-13 C |
| Secondary | Dark Slate | `#233039` | 35 48 57 | C81 M60 Y49 K64 · PANTONE 7546 C |
| Secondary | Teal | `#004854` | 0 72 84 | C100 M10 Y29 K68 |
| Secondary | Secondary Gold | `#C29650` (guide) / RGB 200 160 82 (brand book) | | C12 M33 Y74 K15 |
- RGB is the screen colour system. **Decision:** brand wins over the antislop "no #000" rule.
- **Never place the gold logo on a white background.**

### Typography
| Role | Face | Rule |
|---|---|---|
| Primary | **Cantarell** (Regular, Bold, Oblique) | Headlines, subheads, body, captions: everywhere possible |
| Secondary | **Playfair Display** (Regular, Bold, Italic) | Selective emphasis only: headings, feature titles, highlights. **Never extended body copy.** |
| Numerals | **Montserrat** | All numbers: stats, dates, tables, charts, data |
- Nothing else. No Inter or system-font substitutes in UI.

### Logo
- Use exactly as supplied. No distortion, recolouring, moving elements apart, or redesign. The base line is integral.
- Min height 21 mm. Keep ≥5 mm clear space after the icon. Crest alone only with Brand Team approval. Sub-brand logos are not allowed for initiatives/events.
- RV University masterbrand stays primary in scale, placement and hierarchy.
- Logo source: official Drive (link in brand book p.7). In the prototype we **reuse the logo asset from the live RVU Connect site** and do not redraw it.

### Writing style
- Official name: **RV University**, exactly. Never "R V", "R.V.", "Rv", or "Rashtreeya Vidyalaya University".
- **UK English:** programme, specialisation, colour, organise, centre.
- **Dates:** `DD Month YYYY` with no leading zero and no commas (e.g. `4 April 2026`).
- Campuses: **Bengaluru Campus | Mysuru Campus** only.
- Initials/titles take periods: N.H.R. Davda, Ms., Dr., Prof.
- Address: RV Vidyaniketan Post, 8th Mile, Mysuru Road, Bengaluru 560059 · 080 6819 9900 · headcommunication@rvu.edu.in
