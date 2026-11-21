import { lazy, Suspense, useMemo, useState } from 'react'
import { CAMPUS_VENUES, type Place } from '../campus/venues'
import { useOpenEvent } from '../components/EventBits'
import { EmptyState, Icon, Num, PageHeader, SectionTitle } from '../components/ui'
import { useCatalog } from '../lib/catalog'
import { href } from '../lib/router'

const CampusStage = lazy(() => import('../campus/CampusStage'))

type VenueCategory = 'All' | 'Academic' | 'Labs & Studios' | 'Administration' | 'Outdoors'
const CATEGORIES: VenueCategory[] = ['All', 'Academic', 'Labs & Studios', 'Administration', 'Outdoors']

export default function MapPage({ id }: { id?: string }) {
  const { events, clubs } = useCatalog()
  const openEvent = useOpenEvent()
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(() => {
    if (id) {
      const match = CAMPUS_VENUES.find((v) => v.place.id === id || v.place.name.toLowerCase().includes(id.toLowerCase()))
      if (match) return match.place
    }
    return CAMPUS_VENUES[0].place
  })
  const [cat, setCat] = useState<VenueCategory>('All')
  const [paused, setPaused] = useState(false)
  const [search, setSearch] = useState('')

  const list = useMemo(() => {
    const s = search.trim().toLowerCase()
    return CAMPUS_VENUES.filter((v) => {
      if (cat !== 'All' && v.category !== cat) return false
      if (s && !`${v.place.name} ${v.description} ${v.category}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [cat, search])

  const selectedVenueInfo = useMemo(() => {
    if (!selectedPlace) return null
    return CAMPUS_VENUES.find((v) => v.place.id === selectedPlace.id) ?? null
  }, [selectedPlace])

  // Events happening at this venue
  const venueEvents = useMemo(() => {
    if (!selectedPlace) return []
    return events.filter((e) => e.venue.toLowerCase().includes(selectedPlace.name.toLowerCase().replace('rvu ', '')))
  }, [selectedPlace, events])

  return (
    <div className="pb-16">
      <PageHeader
        scene="11"
        eyebrow="Campus Wayfinding"
        title={<>Explore the <span className="italic text-gold">campus</span>.</>}
        aside={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setSelectedPlace(null)}
            >
              Reset overview
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Resume orbit' : 'Pause orbit'}
            >
              <Icon name={paused ? 'play' : 'pause'} className="h-4 w-4" />
            </button>
          </div>
        }
      >
        <p>Interactive 3D model of RV University, Bengaluru. Select any building to locate venues, clubs, and scheduled events.</p>
      </PageHeader>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start">
        {/* Right: 3D Campus Stage (ordered first on mobile for immediate visual wayfinding) */}
        <div className="order-first lg:order-last sticky top-18 lg:top-24 h-[38vh] min-h-[15rem] lg:h-[75vh] lg:min-h-[28rem] border border-line bg-ink overflow-hidden relative">
          <div className="absolute inset-0 z-0">
            <Suspense
              fallback={
                <div className="h-full w-full flex items-center justify-center text-sm text-mute">
                  Loading 3D Campus Stage...
                </div>
              }
            >
              <CampusStage focus={selectedPlace} paused={paused} />
            </Suspense>
          </div>
          {/* Subtle frame corner brackets */}
          <div className="pointer-events-none absolute top-3 left-3 text-[0.62rem] font-mono text-mute/80 bg-ink/80 px-2 py-0.5 backdrop-blur-sm border border-line">
            LAT 12.9225° N · LON 77.5017° E
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 text-[0.62rem] font-mono text-mute/80 bg-ink/80 px-2 py-0.5 backdrop-blur-sm border border-line">
            RVU ATLAS v1.0
          </div>
        </div>

        {/* Left: Venue List & Details */}
        <div className="space-y-5 lg:space-y-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
            <label className="relative flex-1 min-w-[12rem]">
              <span className="sr-only">Search venues</span>
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mute" />
              <input
                type="search"
                className="field !h-9 !pl-9 text-xs"
                placeholder="Find a block or lab..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`px-2.5 py-1 text-xs border transition-colors ${
                    cat === c ? 'border-gold bg-gold text-ink font-semibold' : 'border-line text-mute hover-gold'
                  }`}
                  onClick={() => setCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Active selection summary card */}
          {selectedVenueInfo && (
            <section className="border border-gold bg-slate-2 p-5 text-sm" aria-labelledby="active-venue">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="tag tag-gold !text-[0.62rem]">{selectedVenueInfo.category}</span>
                  <h2 id="active-venue" className="mt-1.5 font-display text-2xl text-paper">
                    {selectedVenueInfo.place.name}
                  </h2>
                </div>
                <span className="text-xs font-mono text-mute">Way {selectedVenueInfo.place.id.replace('way/', '')}</span>
              </div>
              <p className="mt-2 text-mute leading-relaxed">{selectedVenueInfo.description}</p>

              {venueEvents.length > 0 ? (
                <div className="mt-4 border-t border-line pt-3">
                  <span className="eyebrow !text-[0.6rem] text-gold">Events scheduled here</span>
                  <ul className="mt-2 space-y-2">
                    {venueEvents.map((e) => (
                      <li key={e.id} className="flex items-center justify-between text-xs">
                        <span className="font-semibold truncate text-paper">{e.title}</span>
                        <button
                          type="button"
                          className="hover-gold text-gold underline ml-2 shrink-0"
                          onClick={() => openEvent(e.id)}
                        >
                          View details →
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 text-xs text-mute/80 border-t border-line pt-2">No public events scheduled here this week.</p>
              )}
            </section>
          )}

          {/* Building Directory */}
          <div className="space-y-1">
            <span className="eyebrow !text-[0.6rem] text-mute">All Locations ({list.length})</span>
            <ul className="divide-y divide-line border-y border-line" role="listbox">
              {list.map((v) => {
                const active = selectedPlace?.id === v.place.id
                return (
                  <li key={v.place.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`row-hover flex w-full items-center justify-between gap-3 p-3.5 text-left transition-colors ${
                        active ? 'bg-line/40 border-l-2 border-gold pl-3' : ''
                      }`}
                      onClick={() => setSelectedPlace(v.place)}
                    >
                      <div className="min-w-0">
                        <span className={`block font-semibold text-sm ${active ? 'text-gold' : 'text-paper'}`}>
                          {v.place.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-mute">{v.description}</span>
                      </div>
                      <span className="tag text-[0.6rem] shrink-0">{v.category}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
