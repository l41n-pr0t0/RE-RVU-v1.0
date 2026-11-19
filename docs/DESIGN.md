# DESIGN.md: RVU Connect, reimagined

## Visual thesis
**Campus life as a premiere.** A black stage, warm gold light, and one thin gold line that carries time. Each screen should feel like the opening shot of a film: calm, deliberate, with one thing in focus.

## Dials
- **VARIANCE 6:** asymmetric splits on the landing page, and a disciplined grid inside the app.
- **MOTION 7 on the landing page, 3 in the app:** cinematic outside, quick and quiet where students work.
- **DENSITY 4 on the landing page, 6 in the app.**

## Signature element: the Gold Line
The base line under the RV University wordmark is "integral" to the logo. We extend it into the product's timeline: a single 1px gold rule that represents the week.
- **Landing:** the line draws from the centre on load (cold open), and on scroll this week's events drop onto it.
- **Home:** the line becomes the week navigator, with seven day ticks and a marker for each event. "Now" is a glowing point that moves along it.
- **Elsewhere:** it appears as the active-nav underline and as section rules. It is never decorative noise.

## Colour (brand, enforced)
| Token | Hex | Use |
|---|---|---|
| `ink` | `#000000` | stage / page background |
| `slate` | `#233039` | raised surfaces, panels |
| `slate-2` | `#1A242B` | between ink and slate, for cards on black (a tint of Dark Slate) |
| `gold` | `#D7AC54` | the Gold Line, primary actions, focus |
| `gold-2` | `#C29650` | pressed / secondary gold |
| `teal` | `#004854` | secondary accent, "open / registration" status |
| `paper` | `#F2EDE3` | primary text on dark |
| `mute` | `#A39F96` | secondary text (≥ 4.5:1 on black) |

The gold logo appears only on `ink` or `slate`, never on light surfaces.

## Type (brand, enforced)
- **Playfair Display:** h1 to h3 and feature titles. Never paragraphs.
- **Cantarell:** everything else (UI, body, labels).
- **Montserrat:** every numeral (dates, counts, times), via `.num` with `font-variant-numeric: tabular-nums`.

## Motion
- Only transform and opacity animate. Easing: `cubic-bezier(.2,.7,.1,1)` ("dolly").
- Landing shots: (1) cold open, the line draws and the logo fades up; (2) the headline is revealed line by line behind a mask with a slow push-in of 1.04 → 1; (3) a scroll-scrubbed week; (4) jobs reveal; (5) end card.
- `prefers-reduced-motion`: every shot cuts straight to its end state.

## States
Every data view has loading (skeleton shaped like the content), empty (one-line reason plus one action) and error (plain cause plus retry).

## Writing
UK English. "RV University" in full on first mention. Dates like `24 November 2026`. Avoid phrases like "Elevate", "Seamless" or "Unlock".
