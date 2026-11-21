import type { CSSProperties } from 'react'
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

export const THEMES: Record<ClubTheme, ThemeDef> = {
  'night-gold': { label: 'Night Gold', note: 'Black stage, gold key light', mode: 'dark', ink: '#000000', surface: '#10171c', paper: '#f2ede3', mute: '#a39f96', accent: '#d7ac54', accentText: '#d7ac54', onAccent: '#000000', line: '242 237 227' },
  'teal-studio': { label: 'Teal Studio', note: 'Deep teal room, gold detail', mode: 'dark', ink: '#00262d', surface: '#003640', paper: '#eef3f1', mute: '#9fb8b8', accent: '#d7ac54', accentText: '#e0bd73', onAccent: '#00262d', line: '238 243 241' },
  'slate-lab': { label: 'Slate Lab', note: 'Dark slate, ochre instruments', mode: 'dark', ink: '#141d23', surface: '#233039', paper: '#eef0ef', mute: '#9aa6ad', accent: '#c29650', accentText: '#d4ad6c', onAccent: '#141d23', line: '238 240 239' },
  'deep-teal': { label: 'Deep Teal', note: 'Black stage, teal signal', mode: 'dark', ink: '#000000', surface: '#071a1e', paper: '#eef3f1', mute: '#93abad', accent: '#3d8f9b', accentText: '#6fb3bd', onAccent: '#000000', line: '238 243 241' },
  'gold-field': { label: 'Gold Field', note: 'The approved gold background', mode: 'light', ink: '#d7ac54', surface: '#e2bf75', paper: '#000000', mute: '#3b2f14', accent: '#000000', accentText: '#000000', onAccent: '#d7ac54', line: '0 0 0' },
  'paper-press': { label: 'Paper Press', note: 'Warm paper, black type, gold rule', mode: 'light', ink: '#f4f0e6', surface: '#fbf8f1', paper: '#11181d', mute: '#565249', accent: '#85631f', accentText: '#85631f', onAccent: '#f4f0e6', line: '35 48 57' },
  'teal-paper': { label: 'Teal Paper', note: 'Pale paper, deep teal ink', mode: 'light', ink: '#eef1ec', surface: '#f8faf6', paper: '#0b1f23', mute: '#4f5f60', accent: '#004854', accentText: '#004854', onAccent: '#eef1ec', line: '0 72 84' },
  archive: { label: 'Archive', note: 'Ochre on slate, like an old programme', mode: 'dark', ink: '#1a2329', surface: '#233039', paper: '#efe6d2', mute: '#b2a68c', accent: '#c29650', accentText: '#c9a160', onAccent: '#1a2329', line: '239 230 210' },
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
