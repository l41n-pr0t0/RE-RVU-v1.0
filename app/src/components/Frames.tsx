import type { Photo } from '../data/types'
import { Num } from './ui'

/**
 * Past-event photographs laid out as a film contact sheet. Seeded events carry
 * captioned frames without image files (we do not have the clubs' photos);
 * hosts upload real ones from the dashboard and they appear in the same grid.
 */
export function ContactSheet({ photos, compact = false, onRemove }: { photos: Photo[]; compact?: boolean; onRemove?: (id: string) => void }) {
  if (!photos.length) return <p className="border border-dashed border-line p-4 text-sm text-mute">No photographs yet. The host can add them from their dashboard.</p>
  return (
    <ol className={`grid gap-2 ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {photos.map((p, i) => (
        <li key={p.id} className="group relative">
          <figure className="relative aspect-[4/3] overflow-hidden border border-line-strong bg-black">
            {p.src ? (
              <img src={p.src} alt={p.caption} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            ) : (
              <div aria-hidden className="frame-placeholder absolute inset-0" style={{ ['--seed' as string]: (i * 37) % 100 }} />
            )}
            <span className="absolute top-1.5 left-2 font-[Montserrat] text-[0.6rem] tracking-[0.18em] text-gold">
              <Num>{String(i + 1).padStart(2, '0')}</Num>A
            </span>
            {!compact && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pt-6 pb-1.5 text-xs text-[#F2EDE3]">{p.caption}</figcaption>}
          </figure>
          {onRemove && (
            <button onClick={() => onRemove(p.id)} className="btn btn-sm mt-1 w-full">
              Remove
            </button>
          )}
        </li>
      ))}
    </ol>
  )
}
