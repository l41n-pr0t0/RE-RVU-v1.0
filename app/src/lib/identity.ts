import type { School } from '../data/types'

/**
 * RV University addresses look like `harshulkalabtech25@rvu.edu.in`:
 * first name + surname + programme + batch year, with no separator.
 * We read what we can from it so a new student types nothing twice.
 */

const PROGRAMMES: Record<string, School> = {
  btech: 'School of Computer Science and Engineering',
  mtech: 'School of Computer Science and Engineering',
  bca: 'School of Computer Science and Engineering',
  mca: 'School of Computer Science and Engineering',
  bdes: 'School of Design and Innovation',
  mdes: 'School of Design and Innovation',
  bba: 'School of Business',
  mba: 'School of Business',
  bcom: 'School of Business',
  ballb: 'School of Law',
  bballb: 'School of Law',
  llb: 'School of Law',
  llm: 'School of Law',
  bsc: 'School of Liberal Arts and Sciences',
  msc: 'School of Liberal Arts and Sciences',
  ba: 'School of Liberal Arts and Sciences',
  ma: 'School of Liberal Arts and Sciences',
  bfa: 'School of Film, Media and Creative Arts',
  bajmc: 'School of Film, Media and Creative Arts',
  beco: 'School of Economics and Public Policy',
}

// Common surnames, used only to find where a joined-up first name ends.
const SURNAMES = [
  'kala', 'sharma', 'verma', 'gupta', 'singh', 'kumar', 'kumari', 'reddy', 'rao', 'nair', 'iyer', 'iyengar',
  'shetty', 'gowda', 'patel', 'shah', 'jain', 'mehta', 'das', 'bose', 'ghosh', 'khan', 'joshi', 'kulkarni',
  'desai', 'pillai', 'menon', 'agarwal', 'aggarwal', 'bansal', 'mishra', 'pandey', 'yadav', 'chauhan', 'naidu',
  'hegde', 'bhat', 'bhatt', 'kamath', 'pai', 'prasad', 'krishnan', 'sinha', 'saxena', 'kapoor', 'malhotra',
  'chopra', 'arora', 'sethi', 'banerjee', 'mukherjee', 'chatterjee', 'roy', 'dutta', 'sen', 'thomas', 'george',
  'varghese', 'fernandes', 'dsouza', 'murthy', 'swamy', 'gandhi', 'tiwari', 'dubey', 'trivedi', 'thakur',
  'rathore', 'chandra', 'srinivasan', 'raman', 'subramanian', 'venkatesh', 'acharya', 'shenoy', 'kini',
  'nayak', 'patil', 'jadhav', 'pawar', 'deshpande', 'goyal', 'mittal', 'garg', 'khanna', 'bhatia', 'ahmed',
]

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

export const RVU_DOMAIN = '@rvu.edu.in'
export const isRvuEmail = (email: string) => /^[a-z0-9._%+-]+@rvu\.edu\.in$/i.test(email.trim())

export interface Identity {
  name: string
  school?: School
  year?: 1 | 2 | 3 | 4
  programme?: string
}

/** The academic year starts in August. A 2025 batch is in year 2 in November 2026. */
function yearOfStudy(batch: number, now = new Date()) {
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  const y = startYear - batch + 1
  return (y >= 1 && y <= 4 ? y : undefined) as Identity['year']
}

export function identityFromEmail(email: string, now = new Date()): Identity {
  const local = email.trim().toLowerCase().split('@')[0] ?? ''
  const digits = local.match(/(\d{2,4})$/)?.[1]
  let rest = local.replace(/\d+$/, '')
  let programme: string | undefined
  let school: School | undefined

  // Separated forms: first.last, first_last
  const parts = rest.split(/[._-]+/).filter(Boolean)
  if (parts.length > 1) {
    const kept = parts.filter((p) => {
      if (PROGRAMMES[p]) {
        programme = p
        school = PROGRAMMES[p]
        return false
      }
      return true
    })
    return { name: kept.map(cap).join(' '), school, programme, year: digits ? yearOfStudy(2000 + (+digits % 100), now) : undefined }
  }

  // Joined form: strip the longest programme code at the end
  const code = Object.keys(PROGRAMMES)
    .sort((a, b) => b.length - a.length)
    .find((c) => rest.endsWith(c) && rest.length - c.length >= 4)
  if (code) {
    programme = code
    school = PROGRAMMES[code]
    rest = rest.slice(0, -code.length)
  }

  const surname = SURNAMES.filter((s) => rest.endsWith(s) && rest.length - s.length >= 3).sort((a, b) => b.length - a.length)[0]
  const name = surname ? `${cap(rest.slice(0, -surname.length))} ${cap(surname)}` : cap(rest)

  return { name, school, programme, year: digits ? yearOfStudy(2000 + (+digits % 100), now) : undefined }
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
