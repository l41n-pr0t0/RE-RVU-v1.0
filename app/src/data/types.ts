export type Category =
  | 'Technology'
  | 'Design'
  | 'Business'
  | 'Culture'
  | 'Sport'
  | 'Social impact'
  | 'Media'

export const CATEGORIES: Category[] = [
  'Technology',
  'Design',
  'Business',
  'Culture',
  'Sport',
  'Social impact',
  'Media',
]

export type School =
  | 'School of Computer Science and Engineering'
  | 'School of Design and Innovation'
  | 'School of Business'
  | 'School of Liberal Arts and Sciences'
  | 'School of Law'
  | 'School of Economics and Public Policy'
  | 'School of Film, Media and Creative Arts'

export const SCHOOLS: School[] = [
  'School of Computer Science and Engineering',
  'School of Design and Innovation',
  'School of Business',
  'School of Liberal Arts and Sciences',
  'School of Law',
  'School of Economics and Public Policy',
  'School of Film, Media and Creative Arts',
]

export interface Club {
  id: string
  name: string
  category: Category
  tagline: string
  members: number
  recruiting: boolean
  /** Two-letter monogram, drawn — no stock logos */
  mono: string
}

export interface CampusEvent {
  id: string
  title: string
  hostId: string // club id or school key
  hostName: string
  kind: 'Club event' | 'School event'
  category: Category
  start: Date
  end: Date
  venue: string
  campus: 'Bengaluru Campus' | 'Mysuru Campus'
  summary: string
  seats: number
  registered: number
  free: boolean
  registrationOpen: boolean
}

export interface Project {
  id: string
  title: string
  owner: string
  school: School
  category: Category
  pitch: string
  roles: string[]
  commitment: string
  deadline: Date
  team: number
}

export interface Notice {
  id: string
  title: string
  from: string
  body: string
  priority: 'High' | 'Normal'
  posted: Date
  actionLabel?: string
  due?: Date
}

export type Role = 'Student' | 'Club core' | 'School representative'

export interface Profile {
  name: string
  year: 1 | 2 | 3 | 4
  school: School
  role: Role
  interests: Category[]
}
