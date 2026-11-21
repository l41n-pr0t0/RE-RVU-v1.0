import type { CSSProperties } from 'react'
import { BRAND, mix, TONE, triplet } from './brand'
import type { Club, ClubLook, ClubLayout, ClubPattern, ClubTheme, ClubType } from '../data/types'

/**
 * Brand-safe club themes. Every preset is built only from the RV University
 * palette (Black, Gold, Dark Slate, Deep Teal, Ochre) and tints of it, including
 * the approved gold-background variant. A club core picks a preset, a layout,
 * a cover pattern and a type style; no code, and no colour outside the brand.
 *
 * A theme is just a set of CSS custom properties. Applied on `.club-theme`, it
 * re-skins every existing component (buttons, tags, fields) inside the page.
 */

export interface ThemeDef {
  label: string
  note: string
  mode: 'dark' | 'light'
  ink: string // stage
  surface: string // raised plates
  paper: string // text
  mute: string // secondary text
  accent: string // the club's one accent
  accentText: string // accent used as text (AA on stage)
  onAccent: string // text on an accent fill
  line: string // hairline base colour (rgb triplet)
}

const { black: K, gold: G, slate: S, teal: T, ochre: O, white: W } = BRAND
const theme = (d: Omit<ThemeDef, 'line'>): ThemeDef => ({ ...d, line: triplet(d.paper) })

export const THEMES: Record<ClubTheme, ThemeDef> = {
  'night-gold': theme({ label: 'Night Gold', note: 'Black stage, gold key light', mode: 'dark', ink: K, surface: TONE.surface, paper: TONE.paper, mute: TONE.mute, accent: G, accentText: G, onAccent: K }),
  'teal-studio': theme({ label: 'Teal Studio', note: 'Deep teal room, gold detail', mode: 'dark', ink: mix(T, K, 0.47), surface: mix(T, K, 0.25), paper: mix(W, T, 0.06), mute: mix(W, T, 0.4), accent: G, accentText: mix(G, W, 0.15), onAccent: mix(T, K, 0.47) }),
  'slate-lab': theme({ label: 'Slate Lab', note: 'Dark slate, ochre instruments', mode: 'dark', ink: mix(S, K, 0.4), surface: S, paper: mix(W, S, 0.06), mute: mix(W, S, 0.4), accent: O, accentText: mix(O, W, 0.15), onAccent: mix(S, K, 0.4) }),
  'deep-teal': theme({ label: 'Deep Teal', note: 'Black stage, teal signal', mode: 'dark', ink: K, surface: mix(T, K, 0.7), paper: mix(W, T, 0.06), mute: mix(W, T, 0.42), accent: mix(T, W, 0.3), accentText: TONE.tealText, onAccent: K }),
  'gold-field': theme({ label: 'Gold Field', note: 'The approved gold background', mode: 'light', ink: G, surface: mix(G, W, 0.2), paper: K, mute: mix(G, K, 0.75), accent: K, accentText: K, onAccent: G }),
  'paper-press': theme({ label: 'Paper Press', note: 'Warm paper, black type, gold rule', mode: 'light', ink: TONE.lightStage, surface: mix(W, G, 0.04), paper: mix(S, K, 0.5), mute: mix(S, W, 0.25), accent: TONE.goldOnLight, accentText: TONE.goldOnLight, onAccent: TONE.lightStage }),
  'teal-paper': theme({ label: 'Teal Paper', note: 'Pale paper, deep teal ink', mode: 'light', ink: mix(W, T, 0.07), surface: mix(W, T, 0.025), paper: mix(T, K, 0.6), mute: mix(T, W, 0.2), accent: T, accentText: T, onAccent: mix(W, T, 0.07) }),
  archive: theme({ label: 'Archive', note: 'Ochre on slate, like an old programme', mode: 'dark', ink: mix(S, K, 0.25), surface: S, paper: mix(W, O, 0.2), mute: mix(O, W, 0.3), accent: O, accentText: mix(O, W, 0.1), onAccent: mix(S, K, 0.25) }),
}

export const LAYOUTS: Record<ClubLayout, { label: string; note: string }> = {
  cover: { label: 'Cover', note: 'A wide cover band, sections below' },
  split: { label: 'Split', note: 'Identity pinned left, sections scroll right' },
  poster: { label: 'Poster', note: 'Huge name, sections as a grid' },
}

export const PATTERNS: Record<ClubPattern, string> = {
  grid: 'Grid',
  rays: 'Rays',
  waves: 'Waves',
  dots: 'Dots',
  stripes: 'Stripes',
  rings: 'Rings',
}

export const TYPES: Record<ClubType, { label: string; note: string }> = {
  classic: { label: 'Classic', note: 'Playfair, upright' },
  italic: { label: 'Italic', note: 'Playfair, italic' },
  bold: { label: 'Bold', note: 'Cantarell Bold, tight caps' },
}

/** CSS variables for a look. Spread onto the element that has `.club-theme`. */
export function themeStyle(look: ClubLook): CSSProperties {
  const t = THEMES[look.theme] ?? THEMES['night-gold']
  return {
    '--color-ink': t.ink,
    '--color-slate-2': t.surface,
    '--color-paper': t.paper,
    '--color-mute': t.mute,
    '--color-gold': t.accent,
    '--color-gold-2': t.accent,
    '--color-gold-text': t.accentText,
    '--on-accent': t.onAccent,
    '--color-line': `rgb(${t.line} / 0.14)`,
    '--color-line-strong': `rgb(${t.line} / 0.3)`,
    '--pat': `color-mix(in srgb, ${t.accent} ${t.mode === 'light' ? 22 : 30}%, transparent)`,
    colorScheme: t.mode,
  } as CSSProperties
}

/** Hand-picked looks for clubs that appear in the demo most, so each reads as itself. */
const CURATED: Record<string, ClubLook> = {
  iterium: { theme: 'night-gold', layout: 'cover', pattern: 'grid', type: 'bold' },
  vyoma: { theme: 'deep-teal', layout: 'poster', pattern: 'dots', type: 'classic' },
  poethra: { theme: 'paper-press', layout: 'split', pattern: 'waves', type: 'italic' },
  ecell: { theme: 'gold-field', layout: 'poster', pattern: 'stripes', type: 'bold' },
  cybersec: { theme: 'slate-lab', layout: 'split', pattern: 'grid', type: 'bold' },
  rudra: { theme: 'archive', layout: 'poster', pattern: 'rays', type: 'italic' },
  'green-alliance': { theme: 'teal-paper', layout: 'cover', pattern: 'waves', type: 'classic' },
  thesis: { theme: 'night-gold', layout: 'split', pattern: 'rings', type: 'italic' },
  presscorps: { theme: 'paper-press', layout: 'cover', pattern: 'stripes', type: 'classic' },
  chiptech: { theme: 'teal-studio', layout: 'cover', pattern: 'grid', type: 'bold' },
  'open-mike': { theme: 'archive', layout: 'cover', pattern: 'rings', type: 'italic' },
  underdawgs: { theme: 'gold-field', layout: 'cover', pattern: 'rays', type: 'bold' },
}

/** Every club starts with its own look, so the demo already shows the range. */
export function defaultLook(c: Club): ClubLook {
  if (CURATED[c.id]) return CURATED[c.id]
  const themes = Object.keys(THEMES) as ClubTheme[]
  const patterns = Object.keys(PATTERNS) as ClubPattern[]
  const layouts = Object.keys(LAYOUTS) as ClubLayout[]
  const types = Object.keys(TYPES) as ClubType[]
  let h = 0
  for (const ch of c.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return {
    theme: themes[h % themes.length],
    pattern: patterns[(h >>> 3) % patterns.length],
    layout: layouts[(h >>> 6) % layouts.length],
    type: types[(h >>> 9) % types.length],
  }
}
