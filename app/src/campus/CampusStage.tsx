import { Map as MLMap, setWorkerUrl, type ExpressionSpecification, type StyleSpecification } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

// MapLibre 6 ships its worker as a separate module; Vite bundles it and hands back the URL.
setWorkerUrl(workerUrl)
import { useEffect, useRef } from 'react'
import { BRAND, mix, TONE } from '../lib/brand'
import { type Place } from './venues'

/** Centroid of the RVU-owned blocks (A, B, C, F, Admin). The camera frames these, not the shared campus. */
const RVU_CENTRE: [number, number] = [77.50169, 12.92254]

/**
 * The landing page's one persistent object: RV University at night, in 3D.
 * Built from static OpenStreetMap GeoJSON (no tiles, no keys, no network beyond our own files).
 * It is scenery, not a tool: no pointer interaction, no labels on the canvas.
 *
 * - `focus` flies the camera to a building or ground and lights it gold.
 * - With no focus the camera orbits the campus slowly, unless `paused`.
 * - Reduced motion: no orbit, cuts instead of flights.
 * - Stops rendering when the tab is hidden (efficient-background-processing).
 */

const { black: K, gold: G, slate: S, teal: T, ochre: O, white: W } = BRAND

/** Brand-derived tones only (lib/brand.ts): paper and ochre by day, slate and black by night. */
const LIGHT_PALETTE = {
  ground: mix(W, O, 0.2),
  context: mix(W, O, 0.25),
  contextTop: mix(W, O, 0.36),
  road: mix(W, O, 0.4),
  campusRoad: mix(W, S, 0.32),
  path: mix(W, S, 0.25),
  green: mix(W, T, 0.2),
  building: mix(W, S, 0.17),
  rvu: O,
  gold: G,
  sky: TONE.lightStage,
  fog: mix(W, O, 0.2),
  horizon: mix(W, O, 0.3),
  lightColor: mix(W, G, 0.12),
  lightIntensity: 0.42,
}

const DARK_PALETTE = {
  ground: mix(S, K, 0.85),
  context: mix(S, K, 0.72),
  contextTop: mix(S, K, 0.62),
  road: mix(S, K, 0.55),
  campusRoad: mix(S, K, 0.35),
  path: mix(S, K, 0.22),
  green: mix(T, K, 0.8),
  building: mix(S, K, 0.45),
  rvu: S,
  gold: G,
  sky: K,
  fog: mix(S, K, 0.85),
  horizon: TONE.surface,
  lightColor: mix(W, G, 0.4),
  lightIntensity: 0.55,
}

const height = (fallback: number) =>
  ['*', ['coalesce', ['get', 'levels'], fallback], 3.6] as unknown as ExpressionSpecification

function style(dark: boolean): StyleSpecification {
  const c = dark ? DARK_PALETTE : LIGHT_PALETTE
  const src = (name: string) => ({ type: 'geojson' as const, data: `${import.meta.env.BASE_URL}atlas/${name}.geojson` })
  return {
    version: 8,
    sources: {
      context: src('context'),
      green: src('green_spaces'),
      roads: src('roads'),
      paths: src('pathways'),
      boundary: src('boundary'),
      buildings: src('buildings'),
    },
    sky: {
      'sky-color': c.sky,
      'horizon-color': c.horizon,
      'fog-color': c.fog,
      'sky-horizon-blend': 0.7,
      'horizon-fog-blend': 0.6,
      'fog-ground-blend': 0.35,
    },
    light: { anchor: 'map', color: c.lightColor, intensity: c.lightIntensity, position: [1.3, 200, 35] },
    layers: [
      { id: 'ground', type: 'background', paint: { 'background-color': c.ground } },
      { id: 'ctx-road', type: 'line', source: 'context', filter: ['==', ['get', 'kind'], 'road'], paint: { 'line-opacity': 0.45, 'line-color': c.road, 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 1, 18, 6] } },
      { id: 'green', type: 'fill', source: 'green', paint: { 'fill-color': c.green, 'fill-opacity': dark ? 0.6 : 0.85 } },
      { id: 'road', type: 'line', source: 'roads', layout: { 'line-cap': 'butt' }, paint: { 'line-color': c.campusRoad, 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 1.5, 18, 9] } },
      { id: 'path', type: 'line', source: 'paths', paint: { 'line-color': c.path, 'line-width': ['interpolate', ['linear'], ['zoom'], 15, 0.5, 18, 2.5], 'line-dasharray': [2, 1.5] } },
      { id: 'boundary', type: 'line', source: 'boundary', paint: { 'line-color': c.gold, 'line-opacity': 0.45, 'line-width': 1.2, 'line-dasharray': [3, 2] } },
      { id: 'ground-on', type: 'fill', source: 'green', filter: ['==', ['get', 'id'], ''], paint: { 'fill-color': c.gold, 'fill-opacity': 0.42 } },
      { id: 'ground-on-edge', type: 'line', source: 'green', filter: ['==', ['get', 'id'], ''], paint: { 'line-color': c.gold, 'line-width': 2 } },
      {
        id: 'ctx-building',
        type: 'fill-extrusion',
        source: 'context',
        filter: ['==', ['get', 'kind'], 'building'],
        paint: { 'fill-extrusion-color': c.context, 'fill-extrusion-height': height(2), 'fill-extrusion-opacity': dark ? 0.6 : 0.4 },
      },
      {
        id: 'building',
        type: 'fill-extrusion',
        source: 'buildings',
        paint: {
          'fill-extrusion-color': ['case', ['==', ['get', 'owner'], 'rvu'], c.rvu, c.building],
          'fill-extrusion-height': ['case', ['==', ['get', 'owner'], 'rvu'], ['+', height(3), 3], height(3)],
          'fill-extrusion-opacity': 0.96,
        },
      },
      {
        id: 'building-on',
        type: 'fill-extrusion',
        source: 'buildings',
        filter: ['==', ['get', 'id'], ''],
        paint: { 'fill-extrusion-color': c.gold, 'fill-extrusion-height': ['+', height(3), 1.5], 'fill-extrusion-opacity': 1 },
      },
    ],
  }
}

type Props = { focus: Place | null; paused: boolean; onReady?: () => void }

export default function CampusStage({ focus, paused, onReady }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const centres = useRef(new Map<string, [number, number]>())
  const state = useRef({ focus, paused, reduce: false, flying: false })
  state.current.focus = focus
  state.current.paused = paused

  useEffect(() => {
    const el = box.current
    if (!el) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    state.current.reduce = reduce
    const narrow = el.clientWidth < 768

    const isDark = () => (typeof document !== 'undefined' ? document.documentElement.dataset.theme !== 'light' : true)

    const map = new MLMap({
      container: el,
      style: style(isDark()),
      center: RVU_CENTRE,
      zoom: narrow ? 16.6 : 17.1,
      pitch: narrow ? 52 : 58,
      bearing: -20,
      maxPitch: 70,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.25),
      canvasContextAttributes: { antialias: true, powerPreference: 'low-power' },
    })
    mapRef.current = map

    // Open framed on the RVU blocks, pushed clear of the headline.
    map.easeTo({ center: RVU_CENTRE, offset: narrow ? [0, -el.clientHeight * 0.22] : [el.clientWidth * 0.22, 0], duration: 0 })

    // Centres for camera targets, from the same files the map draws.
    const base = import.meta.env.BASE_URL
    Promise.all(['buildings', 'green_spaces'].map((n) => fetch(`${base}atlas/${n}.geojson`).then((r) => r.json())))
      .then((sets: { features: { geometry: { type: string; coordinates: any }; properties?: { id?: string } }[] }[]) => {
        for (const fc of sets)
          for (const f of fc.features) {
            const g = f.geometry
            const ring = g.type === 'Polygon' ? g.coordinates[0] : g.type === 'MultiPolygon' ? g.coordinates[0][0] : null
            if (!ring) continue
            const n = ring.length
            const c = (ring as number[][]).reduce((a: number[], p: number[]) => [a[0] + p[0] / n, a[1] + p[1] / n], [0, 0])
            centres.current.set(String(f.properties?.id), [c[0], c[1]])
          }
        if (state.current.focus) aim(state.current.focus)
      })
      .catch(() => {})

    map.once('idle', () => onReady?.())

    // Pause orbit during user scroll to eliminate stutter/lag
    let isScrolling = false
    let scrollTimer = 0
    const handleScroll = () => {
      isScrolling = true
      clearTimeout(scrollTimer)
      scrollTimer = window.setTimeout(() => {
        isScrolling = false
      }, 350)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Smooth idle orbit when stationary
    let raf = 0
    let last = performance.now()
    const tick = (t: number) => {
      const dt = Math.min(64, t - last)
      last = t
      const s = state.current
      if (!s.paused && !s.reduce && !s.focus && !s.flying && !isScrolling && !document.hidden) {
        map.setBearing(map.getBearing() + dt * 0.0022)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(el)

    const onTheme = (e: CustomEvent) => {
      const dark = e.detail !== 'light'
      map.setStyle(style(dark))
    }
    window.addEventListener('rvu-theme', onTheme as EventListener)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('rvu-theme', onTheme as EventListener)
      clearTimeout(scrollTimer)
      cancelAnimationFrame(raf)
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const aim = (p: Place | null) => {
    const map = mapRef.current
    if (!map) return
    const el = box.current!
    const narrow = el.clientWidth < 768
    const id = p?.id ?? ''
    const apply = () => {
      map.setFilter('building-on', ['==', ['get', 'id'], p?.kind === 'building' ? id : ''])
      map.setFilter('ground-on', ['==', ['get', 'id'], p?.kind === 'ground' ? id : ''])
      map.setFilter('ground-on-edge', ['==', ['get', 'id'], p?.kind === 'ground' ? id : ''])
    }
    if (map.isStyleLoaded()) apply()
    else map.once('load', apply)

    const centre = p ? centres.current.get(id) : RVU_CENTRE
    if (!centre) return
    // Keep the lit building clear of the text: right of centre on wide screens, above it on phones.
    const offset: [number, number] = p ? (narrow ? [0, -el.clientHeight * 0.18] : [el.clientWidth * 0.2, 0]) : narrow ? [0, -el.clientHeight * 0.22] : [el.clientWidth * 0.22, 0]
    const camera = {
      center: centre,
      zoom: p ? (narrow ? 17.3 : 17.6) : narrow ? 16.6 : 17.1,
      pitch: p ? (narrow ? 54 : 60) : narrow ? 52 : 58,
      bearing: p ? (hash(id) % 120) - 60 : map.getBearing(),
      offset,
    }
    if (state.current.reduce) {
      map.jumpTo(camera)
      return
    }
    state.current.flying = true
    map.stop()
    map.easeTo({
      ...camera,
      duration: 850,
      easing: (t) => t * (2 - t),
      essential: true,
    })
    map.once('moveend', () => (state.current.flying = false))
  }

  useEffect(() => {
    aim(focus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.id])

  // MapLibre's stylesheet makes its container position:relative, so the map fills a positioned box.
  return (
    <div className="absolute inset-0" aria-hidden>
      <div ref={box} className="h-full w-full" />
    </div>
  )
}

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
