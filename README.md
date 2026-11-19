# RVU Connect: Reimagined

**RE:RVU v1.0 · Track 01: RVU Connect Innovation.** Our goal is to make the existing platform genuinely useful.

This is a frontend-only redesign of [RVU Connect](https://rvu-connect.vercel.app/?route=home), the campus platform built by Iterium for the Office of Student Affairs at RV University. We are not adding features for the sake of it. We fix the journeys students already take: finding what is happening this week, joining a club, getting onto a project, and not missing an important notice.

> Status: **exploration and audit in progress.** The prototype build follows. See `docs/JOURNAL.md` for a dated log.

## What is in this repo

| Path | Purpose |
|---|---|
| `docs/BRIEF.md` | Source-of-truth metadata from the event handbook, the product guide, and the RV University brand guidelines (colours, fonts, writing rules, deliverables, evaluation) |
| `docs/FINDINGS.md` | UX audit of the live site in the format the organisers asked for: current experience, observation, problem, affected users, proposed improvement, expected benefit, prototype |
| `docs/JOURNAL.md` | Problems we hit, decisions we made, and why |
| `docs/DECK_OUTLINE.md` | Structure of the solution deck (8 required sections) |
| `docs/DESIGN.md` | Design system for the prototype |
| `docs/CREDITS.md` | Third-party libraries, fonts and assets |
| `app/` | The prototype (Vite + React + TypeScript), *coming next* |

## Stack

- **React 18 + TypeScript**, built with **Vite**
- **Tailwind CSS** for tokens and layout
- **Framer Motion** for the cinematic, scroll-led motion. All motion uses transform and opacity and respects `prefers-reduced-motion`.
- **Typed mock data.** There is no backend; the prototype runs fully in the browser.
- Deployed as a static site on **Vercel**, with a public link and no login required.

## Brand rules we follow (RV University brand guidelines, March 2026)

| | |
|---|---|
| Colour | Black `#000000` · Gold `#D7AC54` · Dark Slate `#233039` · Teal `#004854` · Secondary Gold `#C29650` |
| Type | **Cantarell** everywhere · **Playfair Display** for headings only · **Montserrat** for every numeral |
| Writing | "RV University", exactly · UK English · dates as `4 April 2026` |
| Logo | Used as supplied, never on a white background |

## Running locally

```bash
cd app
npm install
npm run dev
```

## Source material

The event PDFs (participant handbook, product exploration guide, brand guidelines) live in `Resources/` locally. They are **not committed**: the brand book is 183 MB, over GitHub's file limit, and the documents belong to the organisers. Everything we rely on from them is captured in `docs/BRIEF.md`.

## Team

Contributions per member are listed in the solution deck, as the handbook requires.
