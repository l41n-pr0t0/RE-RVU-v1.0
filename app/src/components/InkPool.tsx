import { useEffect, useRef } from 'react'
import { prefersReduced } from '../ink/motion'

/**
 * A live pool of ink: metaballs on a coarse grid, warped by a slow water
 * wobble, with a bright meniscus at the edge and a tide line inside, the
 * marks ink leaves as it soaks into paper. The cursor is a drop that merges
 * with the pool; a click lets a fresh drop fall and ripple out.
 *
 * Cheap by construction: the field is computed at 1/CELL resolution and
 * upscaled with bilinear smoothing, it stops when off screen or in a hidden
 * tab, and it paints a single still frame under reduced motion.
 */

type RGB = [number, number, number]
type Tone = 'all' | 'gold' | 'teal'

const PALETTES: Record<'dark' | 'light', Record<'gold' | 'teal' | 'deep' | 'ink', RGB>> = {
  dark: { gold: [215, 172, 84], teal: [61, 143, 155], deep: [0, 92, 104], ink: [52, 70, 82] },
  light: { gold: [200, 154, 62], teal: [0, 72, 84], deep: [35, 48, 57], ink: [17, 24, 29] },
}

interface Blob {
  x: number
  y: number
  r: number
  /** Lissajous drift: home position, amplitude, speed, phase */
  hx: number
  hy: number
  ax: number
  ay: number
  sx: number
  sy: number
  ph: number
  c: keyof (typeof PALETTES)['dark']
}

interface Drop {
  x: number
  y: number
  t0: number
}

const CELL = 4

function seedBlobs(tone: Tone): Blob[] {
  const all: Blob['c'][] = tone === 'gold' ? ['gold', 'gold', 'ink', 'gold', 'deep'] : tone === 'teal' ? ['teal', 'deep', 'teal', 'ink', 'teal'] : ['gold', 'teal', 'deep', 'gold', 'teal', 'ink', 'gold']
  return all.map((c, i) => ({
    x: 0,
    y: 0,
    r: 0.11 + ((i * 37) % 9) / 100,
    hx: 0.45 + ((i * 53) % 50) / 100,
    hy: 0.2 + ((i * 29) % 60) / 100,
    ax: 0.06 + ((i * 17) % 10) / 100,
    ay: 0.08 + ((i * 23) % 12) / 100,
    sx: 0.00011 + ((i * 7) % 5) * 0.00003,
    sy: 0.00013 + ((i * 11) % 5) * 0.00003,
    ph: i * 1.7,
    c,
  }))
}

export function InkPool({ tone = 'all', className = '', interactive = true }: { tone?: Tone; className?: string; interactive?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return
    const small = document.createElement('canvas')
    const sctx = small.getContext('2d', { alpha: true })
    if (!sctx) return

    const blobs = seedBlobs(tone)
    const drops: Drop[] = []
    const pointer = { x: -1, y: -1, tx: -1, ty: -1, on: 0, target: 0 }
    let pal = PALETTES[document.documentElement.dataset.theme === 'light' ? 'light' : 'dark']
    let W = 0
    let H = 0
    let gw = 0
    let gh = 0
    let img: ImageData | null = null
    let raf = 0
    let visible = true
    const reduce = prefersReduced()

    const resize = () => {
      const b = canvas.getBoundingClientRect()
      W = Math.max(1, Math.round(b.width))
      H = Math.max(1, Math.round(b.height))
      canvas.width = W
      canvas.height = H
      gw = Math.ceil(W / CELL)
      gh = Math.ceil(H / CELL)
      small.width = gw
      small.height = gh
      img = sctx.createImageData(gw, gh)
    }

    const frame = (now: number) => {
      if (!img) return
      const t = now
      const unit = Math.min(W, H * 2.2)
      // Move the pool
      for (const b of blobs) {
        b.x = (b.hx + Math.sin(t * b.sx + b.ph) * b.ax) * W
        b.y = (b.hy + Math.cos(t * b.sy + b.ph * 1.3) * b.ay) * H
      }
      pointer.x += (pointer.tx - pointer.x) * 0.08
      pointer.y += (pointer.ty - pointer.y) * 0.08
      pointer.on += (pointer.target - pointer.on) * 0.06
      for (let i = drops.length - 1; i >= 0; i--) if (t - drops[i].t0 > 2600) drops.splice(i, 1)

      // Field sources in grid space: [x, y, r², colour]
      const src: [number, number, number, RGB][] = blobs.map((b) => [b.x / CELL, b.y / CELL, ((b.r * unit) / CELL) ** 2, pal[b.c]])
      if (pointer.on > 0.01) src.push([pointer.x / CELL, pointer.y / CELL, ((0.07 * unit * pointer.on) / CELL) ** 2, pal.gold])
      for (const d of drops) {
        const k = (t - d.t0) / 2600
        const swell = Math.sin(Math.min(1, k * 1.6) * Math.PI) * (1 - k * 0.4)
        src.push([d.x / CELL, d.y / CELL, ((0.09 * unit * swell) / CELL) ** 2, pal.teal])
      }

      const data = img.data
      const tw = t * 0.0011
      const n = src.length
      for (let gy = 0; gy < gh; gy++) {
        const wy = Math.sin(gy * 0.09 + tw) * 1.6
        for (let gx = 0; gx < gw; gx++) {
          // Water wobble: sample the field slightly off the grid
          const x = gx + wy + Math.sin(gy * 0.05 - tw * 0.7) * 1.2
          const y = gy + Math.cos(gx * 0.07 + tw * 0.8) * 1.6
          let f = 0
          let cr = 0
          let cg = 0
          let cb = 0
          for (let i = 0; i < n; i++) {
            const s = src[i]
            const dx = x - s[0]
            const dy = y - s[1]
            const v = s[2] / (dx * dx + dy * dy + 1)
            f += v
            cr += s[3][0] * v
            cg += s[3][1] * v
            cb += s[3][2] * v
          }
          const o = (gy * gw + gx) * 4
          // Threshold at f = 1 with a soft, wet edge
          const a = f < 0.82 ? 0 : f > 1.08 ? 1 : (f - 0.82) / 0.26
          if (a === 0) {
            data[o + 3] = 0
            continue
          }
          let r = cr / f
          let g = cg / f
          let b = cb / f
          // Meniscus: a bright rim just inside the edge
          const rim = Math.max(0, 1 - Math.abs(f - 1.18) / 0.16)
          // Tide line: a fainter ring deeper in the pool
          const tide = Math.max(0, 1 - Math.abs(f - 2.4) / 0.12) * 0.6
          const lift = (rim * 0.55 + tide) * 255
          r += (lift - r * (rim + tide) * 0.4) * 0.35
          g += (lift - g * (rim + tide) * 0.4) * 0.35
          b += (lift - b * (rim + tide) * 0.4) * 0.35
          // Deep ink sits darker in the middle, like a pool
          const depth = Math.min(1, (f - 1) / 6)
          data[o] = r * (1 - depth * 0.25)
          data[o + 1] = g * (1 - depth * 0.25)
          data[o + 2] = b * (1 - depth * 0.25)
          data[o + 3] = a * (200 + rim * 55)
        }
      }
      sctx.putImageData(img, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(small, 0, 0, gw * CELL, gh * CELL)

      // Ripples where drops landed
      for (const d of drops) {
        const k = (t - d.t0) / 2600
        for (let j = 0; j < 3; j++) {
          const kk = k - j * 0.12
          if (kk <= 0) continue
          ctx.beginPath()
          ctx.ellipse(d.x, d.y, kk * unit * 0.32, kk * unit * 0.22, 0, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${pal.gold.join(',')},${Math.max(0, 0.5 * (1 - kk))})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }

    const loop = (now: number) => {
      frame(now)
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0
    }
    const start = () => {
      if (!raf && !reduce) raf = requestAnimationFrame(loop)
    }

    resize()
    frame(performance.now())
    start()

    const ro = new ResizeObserver(() => {
      resize()
      frame(performance.now())
    })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) start()
    })
    io.observe(canvas)
    const onVis = () => !document.hidden && start()
    document.addEventListener('visibilitychange', onVis)
    const onTheme = (e: Event) => {
      pal = PALETTES[(e as CustomEvent).detail === 'light' ? 'light' : 'dark']
      frame(performance.now())
    }
    window.addEventListener('rvu-theme', onTheme)

    // Listen on the parent so the pool reacts even under overlaid text.
    const host = canvas.parentElement
    const local = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect()
      return { x: e.clientX - b.left, y: e.clientY - b.top }
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const p = local(e)
      if (pointer.x < 0) {
        pointer.x = p.x
        pointer.y = p.y
      }
      pointer.tx = p.x
      pointer.ty = p.y
      pointer.target = 1
    }
    const onLeave = () => (pointer.target = 0)
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('a,button,input,select,textarea')) return
      const p = local(e)
      drops.push({ ...p, t0: performance.now() })
      if (drops.length > 4) drops.shift()
      if (reduce) frame(performance.now())
    }
    if (interactive && host) {
      host.addEventListener('pointermove', onMove)
      host.addEventListener('pointerleave', onLeave)
      host.addEventListener('pointerdown', onDown)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('rvu-theme', onTheme)
      if (host) {
        host.removeEventListener('pointermove', onMove)
        host.removeEventListener('pointerleave', onLeave)
        host.removeEventListener('pointerdown', onDown)
      }
    }
  }, [tone, interactive])

  return <canvas ref={ref} aria-hidden className={`pointer-events-none block h-full w-full ${className}`} />
}
