import type { Category } from '../data/types'

/**
 * Where things happen, on the real campus.
 * Building and ground ids are OpenStreetMap ways from the MNEMOS-ZERO atlas
 * (snapshot 18 November 2026). OSM marks every name as unverified, and so do we:
 * the mapping from a room ("Seminar Hall 2") to a block is our best guess until
 * someone walks the campus and confirms it.
 */
export type Place = { id: string; kind: 'building' | 'ground'; name: string }

export const CAMPUS_CENTRE: [number, number] = [77.5006443, 12.9230968]

const A: Place = { id: 'way/1286468170', kind: 'building', name: 'RVU A Block' }
const B: Place = { id: 'way/1286468169', kind: 'building', name: 'RVU B Block' }
const C: Place = { id: 'way/1313225782', kind: 'building', name: 'RVU C Block' }
const ADMIN: Place = { id: 'way/1467210438', kind: 'building', name: 'Admin Block' }
const INNOVATION: Place = { id: 'way/1286468183', kind: 'building', name: 'Innovation Centre' }
const DESIGN: Place = { id: 'way/1313422269', kind: 'building', name: 'Design Block' }
const ECE: Place = { id: 'way/133052270', kind: 'building', name: 'Electronics Block' }
const GROUND: Place = { id: 'way/1313225783', kind: 'ground', name: 'Football and Cricket Ground' }
const LAWN: Place = { id: 'way/1327820764', kind: 'ground', name: 'Central Lawn' }
const QUAD: Place = { id: 'way/1313422266', kind: 'ground', name: 'Main Quadrangle' }
const AMPHI: Place = { id: 'way/1286468162', kind: 'ground', name: 'Amphitheatre lawn' }

const BY_VENUE: [RegExp, Place][] = [
  [/innovation/i, INNOVATION],
  [/block a|seminar hall/i, A],
  [/block b/i, B],
  [/block c/i, C],
  [/auditorium/i, ADMIN],
  [/design/i, DESIGN],
  [/electronics/i, ECE],
  [/sports|ground/i, GROUND],
  [/lawn/i, LAWN],
  [/quad/i, QUAD],
  [/amphi/i, AMPHI],
]

export const placeFor = (venue: string): Place => BY_VENUE.find(([re]) => re.test(venue))?.[1] ?? A

/** Where a club usually meets, by what it does. A guess for the landing tour, not a booking. */
export const CLUB_HOME: Record<Category, Place> = {
  Technology: INNOVATION,
  Design: DESIGN,
  Business: A,
  Culture: AMPHI,
  Sport: GROUND,
  'Social impact': C,
  Media: B,
}
