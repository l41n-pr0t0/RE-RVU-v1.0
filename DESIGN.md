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

**The stage** (`components/Stage.tsx`, mounted once in Shell): a sound stage.
Dark Slate key light from the top left, two slow follow-spots, a Deep Teal floor
ruled in perspective to a horizon, hairline rigging on the 12 columns of the
`.wrap` frame, grain, and the scene's name (Today, Events, Clubs…) painted huge
in outlined Playfair italic and cropped at the right edge, so the backdrop says
where you are. Slate and teal are used in the roles the brand book gives them
(corporate backgrounds; environmental graphics). Gold never touches the backdrop.
Sections sit straight on the stage; use `divide-*` hairlines, not opaque
`bg-ink` cells.

**Navigation**: four sections (Today, Events, Clubs, Projects) are the
whole primary nav, identical in the desktop bar and the phone tab bar. Search
and alerts sit beside them. Everything personal (profile, saved, calendar,
notices, host dashboard, theme) is behind the monogram's menu (native popover).

## 1b. Signature element (exactly one)
**Billing order: everything is credited in order of importance, and moves in that order.**
Like film credits, the most important item is billed first, largest and in gold;
the rest follow in a strict, numbered order in Montserrat. Motion plays the
billing out: the lead lands first, supporting items follow, the ensemble last.
It comes from this product (a campus of people, clubs and events competing for
attention) and the app's existing film language, not from an effects catalogue.
Sustained in: the slate numbers on every page header, the gold line on Home
(events billed along the week).

## 2. Palette and roles
Only the five brand colours (Brand guidelines §11) and tints/shades mixed from
them. CSS uses `color-mix()` on the five hex values; TypeScript uses
`app/src/lib/brand.ts` (`BRAND`, `mix()`, `TONE`). No other hex is allowed.
- **RV Black** (#000000) — the stage. Brand primary; used instead of off-black by brand rule.
- **Dark Slate** (#233039) — depth; `slate-2` raised plates = Slate 45% into Black.
- **RV Gold** (#D7AC54) — the single accent: the lead item, primary action, focus ring, your skill matches. Never on white.
- **Secondary Gold / Ochre** (#C29650) — secondary sub-accents and errors (always with a marker and words, never colour alone). On the light stage it is shaded with Black for AA.
- **Deep Teal** (#004854) — "open" and category markers; `teal-bright` = Teal 50% into white so it reads on black.
- **Paper** (white with 8% Gold) — text on dark. **Mute** (white with 38% Slate) — secondary text.
- Light theme stage: white with 16% Gold; text: Slate 50% into Black.

## 3. Typography
- Only the approved styles are loaded: Cantarell Regular/Bold/Oblique, Playfair Display Regular/Bold/Oblique, Montserrat Regular/Medium/Bold. `font-synthesis: none`, so no fake weights or italics.
- Display: Playfair Display — headings and titles only, never body. Hierarchy by size step and italic, not weight spam.
- Body/UI: Cantarell — everything else; body max 65ch, relaxed leading.
- Numerals: Montserrat, through the `RVU Numerals` face (Montserrat limited to the digits 0–9) at the front of the sans stack. Every figure in running text sets in Montserrat and every letter in Cantarell, so Montserrat is never used for words.
- Writing: UK English; dates as "4 April 2026"; "RV University" exactly; campuses as "Bengaluru Campus" / "Mysuru Campus".
- Banned: Inter, system monospace, any other face, text gradients, all-caps paragraphs.

## 3b. Logo
- Gold logo on dark, black logo on light; never gold on white.
- At least 21 mm tall with 5 mm clear space (`.rv-logo`, sized in physical units). The header height is derived from it (`--head`), and every sticky offset uses `--head`.
- Nothing set beside it as a lockup: school/product lockups come only from the Communications Department.

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
- Tier: CSS for hover and press; Framer Motion for small reveals on other pages.
- Order = hierarchy: lead → supporting → ensemble. Easing `expo.out` / dolly; no linear easing.
- Transform and opacity only (Flip runs in scale mode).
- Everything inside `prefers-reduced-motion: no-preference`; content is visible without JS animation.

## 7. Anti-patterns (BANNED)
Emojis. Inter. Neon, glows, purple. Any colour not mixed from the five brand colours. Text gradients. Custom cursors. Overlapping
elements. Three identical cards. Ambient blobs or effects that carry no
information. "John Doe"/"Acme". Fake round numbers. "Elevate", "Seamless",
"Unleash", "Next-gen". Bouncing chevrons, "Scroll to explore". Gold on white.
Playfair for body copy. US spellings.
