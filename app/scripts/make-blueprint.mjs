// Builds public/motifs/campus.svg: hairline line art of RV University's
// building footprints, paths and boundary, from the OpenStreetMap atlas.
// Run: node scripts/make-blueprint.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const read = (n) => JSON.parse(readFileSync(new URL(`../public/atlas/${n}.geojson`, import.meta.url)))
const layers = { boundary: read('boundary'), buildings: read('buildings'), pathways: read('pathways') }

// Frame on the boundary, padded, so the drawing is the campus, not the city.
const pts = []
const walk = (c, f) => (typeof c[0] === 'number' ? f(c) : c.forEach((x) => walk(x, f)))
for (const f of layers.boundary.features) walk(f.geometry.coordinates, (p) => pts.push(p))
let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity]
for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
const k = Math.cos(((y0 + y1) / 2) * Math.PI / 180)
const pad = 0.12 * Math.max((x1 - x0) * k, y1 - y0)
const W = 1000
const s = W / ((x1 - x0) * k + 2 * pad)
const H = Math.round(((y1 - y0) + 2 * pad) * s)
const P = ([x, y]) => `${(((x - x0) * k + pad) * s).toFixed(1)} ${((y1 - y + pad) * s).toFixed(1)}`
const inView = (ring) => ring.some(([x, y]) => x > x0 - pad / k && x < x1 + pad / k && y > y0 - pad && y < y1 + pad)

const ringPath = (r, close) => 'M' + r.map(P).join('L') + (close ? 'Z' : '')
function d(geom, close) {
  const g = geom.type
  const polys = g === 'Polygon' ? [geom.coordinates] : g === 'MultiPolygon' ? geom.coordinates : g === 'LineString' ? [[geom.coordinates]] : g === 'MultiLineString' ? [geom.coordinates] : []
  return polys.flat().filter(inView).map((r) => ringPath(r, close)).join('')
}
const group = (name, close) => layers[name].features.map((f) => d(f.geometry, close)).join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none" stroke="#000" stroke-linejoin="round" stroke-linecap="round">
<path d="${group('boundary', true)}" stroke-width="1.2" stroke-dasharray="6 5"/>
<path d="${group('pathways', false)}" stroke-width="0.8" opacity="0.55"/>
<path d="${group('buildings', true)}" stroke-width="1.4"/>
</svg>
`
writeFileSync(new URL('../public/motifs/campus.svg', import.meta.url), svg)
console.log(`campus.svg ${W}x${H}, ${(svg.length / 1024).toFixed(1)} KB`)
