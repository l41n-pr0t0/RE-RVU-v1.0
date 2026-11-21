import { prefersReduced } from './motion'

/**
 * The theme switch's ink, made reusable. Same family of shapes as viewInk.ts
 * (anisotropic lobes, a slow boil of harmonics, capillary tendrils, a final
 * sweep that guarantees full cover) but parameterised for any box size, so a
 * card, a sheet or the whole page can soak through the same way.
 */

export interface Pt {
  x: number
  y: number
}

export interface BleedOpts {
  /** Polygon vertices. 160 for full screen, ~72 is plenty for a card. */
  verts?: number
  /** Keyframes. More = smoother curve between steps. */
  frames?: number
  /** Tendril reach. 0 = a plain wet blob. */
  tendrils?: number
  seed?: number
}

function rand(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

/** clip-path polygon keyframes for an ink drop landing at `c` inside a `w`×`h` box. */
export function bleedFrames(c: Pt, w: number, h: number, o: BleedOpts = {}): string[] {
  const VERTS = o.verts ?? 72
  const FRAMES = o.frames ?? 36
  const reach = o.tendrils ?? 1
  const far = Math.max(Math.hypot(c.x, c.y), Math.hypot(w - c.x, c.y), Math.hypot(c.x, h - c.y), Math.hypot(w - c.x, h - c.y))
  const r = rand(o.seed ?? (Math.random() * 1e9) | 0)

  const seedRot = r() * Math.PI * 2
  const l1 = { p: r() * 6.283, a: 0.2 }
  const l2 = { p: r() * 6.283, a: 0.1 }
  const harmonics = Array.from({ length: 4 }, (_, i) => ({ k: i + 2 + Math.floor(r() * 3), a: 0.04 + r() * 0.06, p: r() * 6.283, speed: (r() - 0.5) * 1.6 }))
  const tendrils = Array.from({ length: 8 + Math.floor(r() * 5) }, () => ({
    angle: r() * Math.PI * 2,
    width: 0.05 + r() * 0.09,
    length: (0.2 + r() * 0.4) * reach,
    curl: (r() - 0.5) * 0.6,
    lag: r() * 0.25,
  }))
  const raw = Array.from({ length: VERTS }, () => (r() - 0.5) * 0.03)
  const fibres = raw.map((_, i) => (raw[(i + VERTS - 1) % VERTS] + 2 * raw[i] + raw[(i + 1) % VERTS]) / 4)

  const frames: string[] = []
  for (let f = 0; f <= FRAMES; f++) {
    const lin = f / FRAMES
    const t = smoother(lin)
    const tGrow = Math.sin(Math.min(1, lin * 1.2) * Math.PI)
    const ramp = Math.max(0, (lin - 0.45) / 0.55)
    const sweep = Math.max(0, (lin - 0.85) / 0.15)
    const cleanup = ramp * ramp * far * 0.4 + sweep * sweep * far * 0.7
    const pts: string[] = []
    for (let i = 0; i < VERTS; i++) {
      const th = (i / VERTS) * Math.PI * 2
      const d = th + seedRot
      let blob = 1 + Math.sin(d * 2 + l1.p) * l1.a + Math.sin(d * 3 + l2.p) * l2.a
      for (const hm of harmonics) blob += hm.a * Math.sin(hm.k * th + hm.p + lin * hm.speed)
      blob += 0.014 * Math.sin(11 * th - lin * 4)
      let fil = 0
      for (const td of tendrils) {
        let dd = Math.abs(th - (td.angle + td.curl * t))
        dd = Math.min(dd, Math.PI * 2 - dd)
        if (dd < td.width) {
          const s = 1 - dd / td.width
          const g = Math.max(0, Math.min(1, (lin - td.lag) / 0.5))
          fil = Math.max(fil, td.length * g * g * (3 - 2 * g) * s * s * (3 - 2 * s))
        }
      }
      const rad = far * 0.7 * t * (blob + fibres[i] + fil * tGrow * 0.55) + cleanup
      pts.push(`${(c.x + Math.cos(th) * rad).toFixed(1)}px ${(c.y + Math.sin(th) * rad).toFixed(1)}px`)
    }
    frames.push(`polygon(${pts.join(',')})`)
  }
  return frames
}

/**
 * Soak an element (usually an absolutely-positioned tint layer) with ink from
 * a point in viewport coordinates. Returns the Animation so callers can
 * reverse it on pointer leave: the ink drains back to where it came in.
 */
export function soak(el: HTMLElement, from: Pt, duration = 900, opts?: BleedOpts): Animation | null {
  const box = el.getBoundingClientRect()
  if (!box.width || !box.height) return null
  const c = { x: from.x - box.left, y: from.y - box.top }
  if (prefersReduced() || !el.animate) {
    el.style.clipPath = 'none'
    return null
  }
  return el.animate({ clipPath: bleedFrames(c, box.width, box.height, opts) }, { duration, easing: 'linear', fill: 'both' })
}

type VT = { finished: Promise<void>; ready: Promise<void>; skipTransition(): void }

/**
 * Run a DOM update behind a full-page ink reveal, exactly like the theme switch:
 * the new page bleeds over the old one from `at`. Falls back to a plain update.
 */
export function inkReveal(at: Pt, update: () => void, duration = 1400): void {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => VT }
  if (!doc.startViewTransition || prefersReduced()) return update()
  const root = document.documentElement
  try {
    root.style.setProperty('--ink-x', `${at.x}px`)
    root.style.setProperty('--ink-y', `${at.y}px`)
    root.classList.add('ink-vt')
    const vt = doc.startViewTransition(update)
    vt.ready
      .then(() =>
        root.animate(
          { clipPath: bleedFrames(at, innerWidth, innerHeight, { verts: 140, frames: 70 }) },
          { duration, easing: 'linear', pseudoElement: '::view-transition-new(root)', fill: 'both' },
        ),
      )
      .catch(() => undefined)
    vt.finished.finally(() => root.classList.remove('ink-vt'))
  } catch {
    root.classList.remove('ink-vt')
    update()
  }
}
