import type { CampusEvent, Club, Notice, Project } from './types'

/**
 * Prototype data. Club names are the 26 approved clubs listed on the live
 * RVU Connect; taglines, events, projects and notices are illustrative.
 * Dates are generated relative to "now" so the demo never goes stale.
 */

const at = (dayOffset: number, h: number, m = 0) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(h, m)
  return d
}
const plusH = (d: Date, h: number) => new Date(d.getTime() + h * 3_600_000)

export const clubs: Club[] = [
  { id: 'iterium', name: 'Iterium', category: 'Technology', tagline: 'AI automation and product development. We ship things.', members: 142, recruiting: true, mono: 'It' },
  { id: 'vyoma', name: 'Vyoma', category: 'Technology', tagline: 'Space, rockets and the occasional night-sky watch.', members: 88, recruiting: true, mono: 'Vy' },
  { id: 'poethra', name: 'Poéthra', category: 'Culture', tagline: 'Poetry, open readings and slow afternoons with words.', members: 64, recruiting: false, mono: 'Po' },
  { id: 'agentblazer', name: 'AgentBlazer Club', category: 'Technology', tagline: 'Building with AI agents, one weekend at a time.', members: 97, recruiting: true, mono: 'Ab' },
  { id: 'antara', name: 'ANTARA', category: 'Culture', tagline: 'Classical and folk dance from across India.', members: 71, recruiting: false, mono: 'An' },
  { id: 'art-of-travel', name: 'Art of Travel', category: 'Culture', tagline: 'Short trips, long stories, shared photographs.', members: 53, recruiting: true, mono: 'At' },
  { id: 'artora', name: 'Artora', category: 'Design', tagline: 'Studio sessions in paint, ink and print.', members: 60, recruiting: false, mono: 'Ar' },
  { id: 'atleta', name: 'ATLETA', category: 'Sport', tagline: 'Track, field and early mornings.', members: 115, recruiting: true, mono: 'Al' },
  { id: 'aws', name: 'AWS Student Builder Group', category: 'Technology', tagline: 'Cloud workshops and certification study circles.', members: 130, recruiting: true, mono: 'Aw' },
  { id: 'chess', name: 'Chess Arena', category: 'Sport', tagline: 'Weekly blitz, monthly rated tournament.', members: 79, recruiting: false, mono: 'Ch' },
  { id: 'chiptech', name: 'Chiptech', category: 'Technology', tagline: 'Hardware, embedded systems and soldering irons.', members: 46, recruiting: true, mono: 'Ct' },
  { id: 'cybersec', name: 'CyberSec', category: 'Technology', tagline: 'Capture-the-flag nights and security talks.', members: 102, recruiting: true, mono: 'Cs' },
  { id: 'devsphere', name: 'Devsphere', category: 'Technology', tagline: 'Web and app developers helping each other ship.', members: 156, recruiting: false, mono: 'Ds' },
  { id: 'ecell', name: 'ECell', category: 'Business', tagline: 'The entrepreneurship cell: pitches, founders, demo days.', members: 120, recruiting: true, mono: 'Ec' },
  { id: 'expressions', name: 'Expressions', category: 'Culture', tagline: 'Theatre, improv and the annual production.', members: 68, recruiting: true, mono: 'Ex' },
  { id: 'happytails', name: 'Happytails', category: 'Social impact', tagline: 'Caring for the campus dogs and cats.', members: 92, recruiting: true, mono: 'Ht' },
  { id: 'legacy', name: 'Legacy club', category: 'Social impact', tagline: 'Alumni stories and mentoring circles.', members: 38, recruiting: false, mono: 'Lc' },
  { id: 'presscorps', name: 'Presscorps', category: 'Media', tagline: 'The student newsroom. Reporting, editing, photography.', members: 57, recruiting: true, mono: 'Pc' },
  { id: 'psico', name: 'PSICO', category: 'Social impact', tagline: 'Psychology, wellbeing and peer listening.', members: 74, recruiting: false, mono: 'Ps' },
  { id: 'rudra', name: 'RUDRA', category: 'Culture', tagline: 'Music: bands, jams and the spring concert.', members: 110, recruiting: true, mono: 'Ru' },
  { id: 'rvolt', name: 'RVOLT', category: 'Technology', tagline: 'Electric vehicles and the formula student build.', members: 49, recruiting: true, mono: 'Rv' },
  { id: 'green-alliance', name: 'The Green Alliance', category: 'Social impact', tagline: 'Sustainability drives and a campus garden.', members: 83, recruiting: false, mono: 'Ga' },
  { id: 'open-mike', name: 'The Open Mike', category: 'Culture', tagline: 'Stand-up, spoken word and open-mic Fridays.', members: 66, recruiting: true, mono: 'Om' },
  { id: 'representatives', name: 'The Representatives', category: 'Business', tagline: 'Model UN and parliamentary debate.', members: 72, recruiting: false, mono: 'Re' },
  { id: 'underdawgs', name: 'THE UNDERDAWGS', category: 'Sport', tagline: 'Football, five-a-side and inter-college fixtures.', members: 95, recruiting: true, mono: 'Ud' },
  { id: 'thesis', name: 'Thesis', category: 'Media', tagline: 'Film club: screenings, shorts and critique.', members: 61, recruiting: false, mono: 'Th' },
]

const club = (id: string) => clubs.find((c) => c.id === id)!

function ev(
  id: string,
  title: string,
  hostId: string,
  start: Date,
  hours: number,
  venue: string,
  summary: string,
  opts: Partial<Pick<CampusEvent, 'seats' | 'registered' | 'free' | 'registrationOpen' | 'campus'>> = {},
): CampusEvent {
  const c = clubs.find((x) => x.id === hostId)
  return {
    id,
    title,
    hostId,
    hostName: c ? c.name : hostId,
    kind: c ? 'Club event' : 'School event',
    category: c ? c.category : 'Business',
    start,
    end: plusH(start, hours),
    venue,
    campus: opts.campus ?? 'Bengaluru Campus',
    summary,
    seats: opts.seats ?? 120,
    registered: opts.registered ?? 40,
    free: opts.free ?? true,
    registrationOpen: opts.registrationOpen ?? true,
  }
}

export const events: CampusEvent[] = [
  ev('ai-build-night', 'AI Build Night', 'iterium', at(0, 18), 5, 'Innovation Lab, Block B', 'Five hours, one brief, small teams. Bring a laptop; mentors and dinner provided.', { seats: 80, registered: 71 }),
  ev('ctf-101', 'Capture the Flag 101', 'cybersec', at(1, 16), 2, 'Seminar Hall 2', 'A beginner-friendly CTF. No prior security experience needed.', { seats: 60, registered: 22 }),
  ev('open-mic', 'Open Mic Friday', 'open-mike', at(2, 17, 30), 2, 'Central Lawn', 'Five-minute slots. Sign up on arrival or just come to listen.', { seats: 200, registered: 64 }),
  ev('recruitment-fair', 'Club Recruitment Fair', 'School of Liberal Arts and Sciences', at(3, 10), 6, 'Main Quadrangle', 'Every recruiting club in one place. Meet the core teams and sign up on the spot.', { seats: 1500, registered: 412 }),
  ev('pitch-clinic', 'Pitch Clinic with Founders', 'ecell', at(3, 15), 2, 'Board Room, Block A', 'Bring a two-minute pitch and leave with direct feedback from three founders.', { seats: 30, registered: 30, registrationOpen: false }),
  ev('night-sky', 'Night Sky Watch', 'vyoma', at(4, 19), 3, 'Rooftop, Block C', 'Telescopes on the roof. Saturn should be visible if the clouds behave.', { seats: 40, registered: 18 }),
  ev('aws-cert', 'Cloud Practitioner Study Circle', 'aws', at(5, 11), 2, 'Lab 4, Block B', 'Week 3 of 6: storage and databases. Newcomers welcome. Notes are shared.', { seats: 50, registered: 27 }),
  ev('screening', 'Screening: Student Shorts', 'thesis', at(6, 18), 2, 'Auditorium', 'Six short films by RV University students, followed by a Q&A with the directors.', { seats: 300, registered: 96 }),
  ev('demo-day', 'Design Demo Day', 'School of Design and Innovation', at(8, 14), 4, 'Design Studio 1', 'Final-year studios open their doors. Prototypes, process walls and conversations.', { seats: 250, registered: 88 }),
  ev('fixtures', 'Inter-college Five-a-side', 'underdawgs', at(9, 7), 4, 'Sports Ground', 'Group stage fixtures. Supporters very welcome.', { seats: 400, registered: 120 }),
  ev('mun', 'RVU Model UN: Committee Allocations', 'representatives', at(11, 16), 1, 'Seminar Hall 1', 'Delegate briefing and committee allocations for the winter conference.', { seats: 120, registered: 60 }),
  ev('hardware-jam', 'Hardware Jam', 'chiptech', at(12, 10), 6, 'Electronics Lab', 'Microcontrollers, sensors and a box of parts. Build anything. Kits are provided.', { seats: 36, registered: 12, free: false }),
]

/** Past events stay visible on a club page (fixes "events disappear"). */
export const pastEvents: CampusEvent[] = [
  ev('past-iterium-1', 'Automation Teardown', 'iterium', at(-12, 17), 2, 'Seminar Hall 2', 'We took apart three campus workflows and rebuilt them with agents.', { registrationOpen: false }),
  ev('past-cybersec-1', 'Phishing in the Wild', 'cybersec', at(-9, 16), 1, 'Seminar Hall 1', 'Real phishing emails sent to students, and how to spot them.', { registrationOpen: false }),
  ev('past-rudra-1', 'Monsoon Jam', 'rudra', at(-20, 18), 3, 'Amphitheatre', 'Seven bands, one very loud evening.', { registrationOpen: false }),
]

export const projects: Project[] = [
  { id: 'p-mess', title: 'Mess menu that learns', owner: 'Ananya R.', school: 'School of Computer Science and Engineering', category: 'Technology', pitch: 'Predict tomorrow’s attendance at the mess to cut food waste. We have three weeks of footfall data.', roles: ['Data analyst', 'Frontend developer'], commitment: '4 hours a week', deadline: at(6, 23, 59), team: 3 },
  { id: 'p-wayfind', title: 'Campus wayfinding signage', owner: 'Kabir S.', school: 'School of Design and Innovation', category: 'Design', pitch: 'New students get lost in Block B. Redesign the signage system and test it during orientation.', roles: ['Visual designer', 'Researcher'], commitment: '3 hours a week', deadline: at(9, 23, 59), team: 2 },
  { id: 'p-podcast', title: 'Hallway: a student podcast', owner: 'Meera K.', school: 'School of Film, Media and Creative Arts', category: 'Media', pitch: 'Ten-minute episodes with the people who keep the campus running. Pilot recorded.', roles: ['Sound editor', 'Host', 'Producer'], commitment: '2 hours a week', deadline: at(4, 23, 59), team: 4 },
  { id: 'p-thrift', title: 'Hostel thrift exchange', owner: 'Rohan P.', school: 'School of Business', category: 'Social impact', pitch: 'A swap shelf and a simple listing board so books and coats move instead of being thrown out.', roles: ['Operations lead', 'Marketing'], commitment: '2 hours a week', deadline: at(13, 23, 59), team: 2 },
  { id: 'p-policy', title: 'Bus routes, by the numbers', owner: 'Ishita V.', school: 'School of Economics and Public Policy', category: 'Business', pitch: 'Survey commuters and model a better shuttle timetable to propose to the transport office.', roles: ['Survey designer', 'Data analyst'], commitment: '3 hours a week', deadline: at(2, 23, 59), team: 3 },
  { id: 'p-legal', title: 'Know your tenancy rights', owner: 'Arjun M.', school: 'School of Law', category: 'Social impact', pitch: 'Plain-language guides for students renting near campus, reviewed by faculty.', roles: ['Writer', 'Illustrator'], commitment: '2 hours a week', deadline: at(10, 23, 59), team: 2 },
]

export const notices: Notice[] = [
  { id: 'n-exam', title: 'End-semester timetable published', from: 'Office of the Controller of Examinations', body: 'The provisional timetable for the end-semester examinations is out. Report clashes before the deadline so they can be resolved.', priority: 'High', posted: at(0, 9), actionLabel: 'Report a clash', due: at(4, 17) },
  { id: 'n-fee', title: 'Hostel fee window closes this week', from: 'Office of Student Affairs', body: 'Second-instalment hostel fees are due. Late payments incur a fine from the following Monday.', priority: 'High', posted: at(-1, 11), actionLabel: 'View fee details', due: at(5, 17) },
  { id: 'n-bus', title: 'Shuttle timings change from Monday', from: 'Transport Office', body: 'The 7:40 shuttle from Kengeri moves to 7:30. Evening services are unchanged.', priority: 'Normal', posted: at(-1, 15) },
  { id: 'n-library', title: 'Library open until midnight during exams', from: 'Library', body: 'Extended hours begin next week and run to the last examination day.', priority: 'Normal', posted: at(-2, 10) },
  { id: 'n-wellbeing', title: 'Drop-in counselling, every Wednesday', from: 'Student Wellbeing Centre', body: 'No appointment needed. 2 pm to 5 pm, Wellbeing Room, Block A.', priority: 'Normal', posted: at(-4, 12) },
]

export const clubById = club
