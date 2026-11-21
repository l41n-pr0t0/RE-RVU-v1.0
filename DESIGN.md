# Design System: RVU Connect — RV University

Brand rules come from `Resources/Brand guidelines March 2026.md` and win every tie
with this file. Where the anti-slop defaults disagree with the brand (pure black,
a serif display face), the brand is the client and the brand stands.

## 0. Dials
VARIANCE: 7 | MOTION: 7 | DENSITY: 5

## 1. Atmosphere
A film set after dark. Every screen is a scene with a slate number, things move
on a dolly (`cubic-bezier(0.2, 0.7, 0.1, 1)`), the stage is RV Black with fine
grain, and RV Gold is used like a key light: on the one thing that matters most
in the frame, nowhere else. Square corners everywhere. Hierarchy is shown by
order, size and light, never by decoration.

**The stage** (`.stage-bg`, mounted once in Shell): RV Black base, a Dark Slate
key light from the top left, a Deep Teal floor at the bottom right, hairline
"rigging" on the 12 columns of the `.wrap` frame, and grain. Slate and teal are
used in the roles the brand book gives them (corporate backgrounds; environmental
graphics). Gold never touches the backdrop. Sections sit straight on the stage;
use `divide-*` hairlines, not opaque `bg-ink` cells, so the stage shows through.

## 1b. Signature element (exactly one)
**Billing order: everything is credited in order of importance, and moves in that order.**
Like film credits, the most important item is billed first, largest and in gold;
the rest follow in a strict, numbered order in Montserrat. Motion plays the
billing out: the lead lands first, supporting items follow, the ensemble last.
It comes from this product (a campus of people, clubs and events competing for
attention) and the app's existing film language, not from an effects catalogue.
Sustained in: the slate numbers on every page header, the gold line on Home
(events billed along the week), and the People board, where every ask is ranked
by how much it needs *you* (skill fit, deadline, urgency, open spots), shown as
Lead (01) → Supporting (02–03) → Ensemble (04+), and re-ranked live with Flip.

## 2. Palette and roles
- **RV Black** (#000000) — the stage. Brand primary; used instead of off-black by brand rule.
- **Slate 2** (#10171C) — raised surfaces: sheets, plates, panels.
- **Dark Slate** (#233039) — depth, plate gradients.
- **RV Gold** (#D7AC54) — the single accent: the lead item, primary action, focus ring, your skill matches. Never on white.
- **Gold text on paper** (#85631F) — gold for text in the light theme (AA on paper).
- **Deep Teal** (#004854) / **Teal bright** (#3D8F9B) — secondary category marker only (offers, "open"). Never competes with gold.
- **Paper** (#F2EDE3) — text on dark; stage in the light theme (#F4F0E6).
- **Mute** (#A39F96) — secondary text.

## 3. Typography
- Display: Playfair Display — headings and titles only, never body. Hierarchy by size step and italic, not weight spam.
- Body/UI: Cantarell — everything else; body max 65ch, relaxed leading.
- Numerals: Montserrat — every number, rank, count and date, tabular lining figures.
- Writing: UK English; dates as "4 April 2026"; "RV University" exactly; campuses as "Bengaluru Campus" / "Mysuru Campus".
- Banned: Inter, any other serif, text gradients, all-caps paragraphs.

## 4. Components
- Buttons: square, 46px min height, a fill wipes in from the left on hover, `translateY(1px)` on press. Gold = the one primary action per view.
- Plates (lead items): Slate 2 with a hairline border; elevation is the only reason to use one. Lists use `divide-y` rows, not card grids.
- Inputs: label above, error below, gold focus border. No floating labels.
- Loading: skeletons at the real row size. Empty: says how to fill it and offers the action. Error: inline, with retry.

## 5. Layout
- Asymmetric heroes (copy left, lead item right); no centred heroes.
- No row of three identical cards: lead / supporting / ensemble steps instead.
- CSS grid; `.wrap` max 90rem; one column under 768px; no horizontal page scroll.
- `min-h-[100dvh]`, never `h-screen`.

## 6. Motion
- Tier: CSS for hover and press; Framer Motion for small reveals on other pages; GSAP (SplitText, Flip, ScrollTrigger) on People, isolated in that page's tree with `useGSAP` cleanup. No page mixes Framer and GSAP.
- Order = hierarchy: lead → supporting → ensemble. Easing `expo.out` / dolly; no linear easing.
- Transform and opacity only (Flip runs in scale mode).
- Everything inside `prefers-reduced-motion: no-preference`; content is visible without JS animation.

## 7. Anti-patterns (BANNED)
Emojis. Inter. Neon, glows, purple. Text gradients. Custom cursors. Overlapping
elements. Three identical cards. Ambient blobs or effects that carry no
information. "John Doe"/"Acme". Fake round numbers. "Elevate", "Seamless",
"Unleash", "Next-gen". Bouncing chevrons, "Scroll to explore". Gold on white.
Playfair for body copy. US spellings.
