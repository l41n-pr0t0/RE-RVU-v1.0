import type { CSSProperties, ReactNode } from 'react'
import type { Club, ClubLook } from '../data/types'
import { themeStyle } from '../lib/clubThemes'

/**
 * A club's own drawn cover, in its own theme: pattern, monogram and name in the
 * type style the core team chose. No photographs needed, and no two clubs alike.
 * `size` only changes scale; the composition stays the club's.
 */
export function ClubCover({
  club,
  look,
  size = 'tile',
  className = '',
  live = false,
  children,
  style,
}: {
  club: Pick<Club, 'name' | 'mono' | 'category'>
  look: ClubLook
  size?: 'mini' | 'tile' | 'hero'
  className?: string
  /** Keep the pattern drifted (used on the active spotlight slide) */
  live?: boolean
  children?: ReactNode
  style?: CSSProperties
}) {
  const mono = size === 'hero' ? 'text-[clamp(7rem,4rem+14vw,17rem)]' : size === 'tile' ? 'text-[clamp(4.5rem,3rem+5vw,7.5rem)]' : 'text-5xl'
  return (
    <div
      aria-hidden={children ? undefined : true}
      data-pattern={look.pattern}
      data-type={look.type}
      className={`club-theme club-cover ${live ? 'is-live' : ''} ${className}`}
      style={{ ...themeStyle(look), ...style }}
    >
      {children ?? (
        <div className="flex h-full flex-col justify-between p-4">
          <span className="eyebrow !text-[0.55rem] !text-gold">{club.category}</span>
          <span className={`club-display self-end leading-[0.8] text-paper ${mono}`}>{club.mono}</span>
        </div>
      )}
    </div>
  )
}
