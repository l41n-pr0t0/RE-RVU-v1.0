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
  /** Places held for people after the room fills */
  waitlist: number
  photos?: Photo[]
  recap?: string
  /** Created from the host dashboard in this browser */
  hosted?: boolean
}

export interface Member {
  name: string
  role: string
  /** Student directory id, when the person is on RVU Connect */
  studentId?: string
}

export interface Opening {
  role: string
  skills: string[]
  commitment: string
}

export type ProjectStatus = 'Building' | 'Completed'

/** Student project showcase entry */
export interface Project {
  id: string
  name: string
  description: string
  stack: string[]
  github: string
  demo: string
  team: Member[]
  status: ProjectStatus
  /** Empty when the team is not looking for anyone */
  openings: Opening[]
  school: School
  category: Category
  /** Applications close; only meaningful when there are openings */
  closes?: Date
  updated: Date
  /** Published by the signed-in student in this browser */
  mine?: boolean
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

export interface Links {
  github: string
  linkedin: string
  portfolio: string
}

export interface Profile {
  name: string
  /** Empty for a guest looking around */
  email: string
  year: 1 | 2 | 3 | 4
  school: School
  role: Role
  interests: Category[]
  links: Links
  /** Shown in the student directory and used for collaborator matches */
  skills: string[]
  openToCollaborate: boolean
  bio: string
}

export interface Student {
  id: string
  name: string
  school: School
  year: 1 | 2 | 3 | 4
  skills: string[]
  interests: Category[]
  bio: string
  openToCollaborate: boolean
  links: Partial<Links>
  clubs: string[]
}

export type QuestionKind = 'short' | 'long' | 'choice'
export interface Question {
  id: string
  label: string
  kind: QuestionKind
  required: boolean
  options?: string[]
}

export type ClubSection = 'about' | 'recruitment' | 'upcoming' | 'leadership' | 'archive' | 'contact'
export const CLUB_SECTIONS: { id: ClubSection; label: string }[] = [
  { id: 'about', label: 'About and objectives' },
  { id: 'recruitment', label: 'Recruitment' },
  { id: 'upcoming', label: 'Upcoming events' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'archive', label: 'Previous activities' },
  { id: 'contact', label: 'Contact' },
]

export type CoverTone = 'gold' | 'teal' | 'slate'

/** Everything a club core can change about its own page */
export interface ClubPage {
  tagline: string
  about: string
  objectives: string[]
  leadership: Member[]
  recruitment: { open: boolean; message: string; roles: string[]; closes?: string }
  questions: Question[]
  asks: Ask[]
  contact: { email: string; instagram: string; whatsapp: string; website: string }
  sections: ClubSection[]
  hidden: ClubSection[]
  tone: CoverTone
  founded: number
}

/** A club event's archive frame: host-uploaded photo or a placeholder */
export interface Photo {
  id: string
  src?: string
  caption: string
}

/** What a club asks for in a join request */
export type Ask = 'GitHub' | 'LinkedIn' | 'Portfolio'
