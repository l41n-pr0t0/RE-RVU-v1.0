/**
 * The RV University palette (Brand guidelines March 2026, §11) and the only
 * way this app makes any other colour: a tint or shade mixed from it.
 * No hand-picked hex lives outside this file; everything else imports from here
 * (CSS does the same with `color-mix()` on the same five values).
 */
export const BRAND = {
  black: '#000000', // RV Black, Pantone 426 C
  gold: '#D7AC54', // RV Gold, Pantone P 15-13 C
  slate: '#233039', // Dark Slate, Pantone 7546 C
  teal: '#004854', // Deep Teal / Slate Green (secondary)
  ochre: '#C29650', // Secondary Gold / Ochre (secondary)
  white: '#FFFFFF', // tint base only (the reverse logo is white/gold)
} as const

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/** `mix(a, b, t)`: colour `a` with a fraction `t` of colour `b` mixed in (sRGB). */
export function mix(a: string, b: string, t: number): string {
  const x = rgb(a)
  const y = rgb(b)
  return '#' + x.map((v, i) => Math.round(v * (1 - t) + y[i] * t).toString(16).padStart(2, '0')).join('').toUpperCase()
}

/** "r g b" for `rgb(r g b / a)` hairlines. */
export const triplet = (hex: string) => rgb(hex).join(' ')

/** Derived tones shared by the app's dark and light themes. Mirrors the tokens in index.css. */
export const TONE = {
  surface: mix(BRAND.slate, BRAND.black, 0.55), // raised plates on the black stage
  paper: mix(BRAND.white, BRAND.gold, 0.08), // text on dark
  mute: mix(BRAND.white, BRAND.slate, 0.38), // secondary text on dark
  tealText: mix(BRAND.teal, BRAND.white, 0.5), // teal readable on black
  lightStage: mix(BRAND.white, BRAND.gold, 0.16), // the light theme's stage
  goldOnLight: mix(BRAND.ochre, BRAND.black, 0.45), // gold used as text on the light stage
} as const
