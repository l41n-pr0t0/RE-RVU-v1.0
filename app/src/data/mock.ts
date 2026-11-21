import { defaultLook } from '../lib/clubThemes'
import type { Ask, BoardPost, CampusEvent, Club, ClubPage, Notice, Photo, Project, Student } from './types'

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
  opts: Partial<Pick<CampusEvent, 'seats' | 'registered' | 'free' | 'registrationOpen' | 'campus' | 'waitlist' | 'photos' | 'recap'>> = {},
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
    waitlist: opts.waitlist ?? 0,
    photos: opts.photos,
    recap: opts.recap,
  }
}

export const events: CampusEvent[] = [
  ev('ai-build-night', 'AI Build Night', 'iterium', at(0, 18), 5, 'Innovation Lab, Block B', 'Five hours, one brief, small teams. Bring a laptop; mentors and dinner provided.', { seats: 80, registered: 78 }),
  ev('ctf-101', 'Capture the Flag 101', 'cybersec', at(1, 16), 2, 'Seminar Hall 2', 'A beginner-friendly CTF. No prior security experience needed.', { seats: 60, registered: 22 }),
  ev('open-mic', 'Open Mic Friday', 'open-mike', at(2, 17, 30), 2, 'Central Lawn', 'Five-minute slots. Sign up on arrival or just come to listen.', { seats: 200, registered: 64 }),
  ev('recruitment-fair', 'Club Recruitment Fair', 'School of Liberal Arts and Sciences', at(3, 10), 6, 'Main Quadrangle', 'Every recruiting club in one place. Meet the core teams and sign up on the spot.', { seats: 1500, registered: 412 }),
  ev('pitch-clinic', 'Pitch Clinic with Founders', 'ecell', at(3, 15), 2, 'Board Room, Block A', 'Bring a two-minute pitch and leave with direct feedback from three founders.', { seats: 30, registered: 30, waitlist: 4 }),
  ev('night-sky', 'Night Sky Watch', 'vyoma', at(4, 19), 3, 'Rooftop, Block C', 'Telescopes on the roof. Saturn should be visible if the clouds behave.', { seats: 40, registered: 18 }),
  ev('aws-cert', 'Cloud Practitioner Study Circle', 'aws', at(5, 11), 2, 'Lab 4, Block B', 'Week 3 of 6: storage and databases. Newcomers welcome. Notes are shared.', { seats: 50, registered: 27 }),
  ev('screening', 'Screening: Student Shorts', 'thesis', at(6, 18), 2, 'Auditorium', 'Six short films by RV University students, followed by a Q&A with the directors.', { seats: 300, registered: 96 }),
  ev('demo-day', 'Design Demo Day', 'School of Design and Innovation', at(8, 14), 4, 'Design Studio 1', 'Final-year studios open their doors. Prototypes, process walls and conversations.', { seats: 250, registered: 88 }),
  ev('fixtures', 'Inter-college Five-a-side', 'underdawgs', at(9, 7), 4, 'Sports Ground', 'Group stage fixtures. Supporters very welcome.', { seats: 400, registered: 120 }),
  ev('mun', 'RVU Model UN: Committee Allocations', 'representatives', at(11, 16), 1, 'Seminar Hall 1', 'Delegate briefing and committee allocations for the winter conference.', { seats: 120, registered: 60 }),
  ev('hardware-jam', 'Hardware Jam', 'chiptech', at(12, 10), 6, 'Electronics Lab', 'Microcontrollers, sensors and a box of parts. Build anything. Kits are provided.', { seats: 36, registered: 12, free: false }),
]

/** Past events stay visible on a club page (fixes "events disappear"). */
const frames = (prefix: string, captions: string[]): Photo[] => captions.map((caption, i) => ({ id: `${prefix}-${i}`, caption }))

export const pastEvents: CampusEvent[] = [
  ev('past-iterium-1', 'Automation Teardown', 'iterium', at(-12, 17), 2, 'Seminar Hall 2', 'We took apart three campus workflows and rebuilt them with agents.', {
    registrationOpen: false, seats: 90, registered: 84,
    recap: 'Three teams rebuilt the room-booking, lost-and-found and attendance flows. The room-booking agent is now a club project.',
    photos: frames('pi1', ['Teams pick a workflow', 'Whiteboard teardown', 'Demo of the booking agent', 'Judges’ questions', 'The winning team']),
  }),
  ev('past-cybersec-1', 'Phishing in the Wild', 'cybersec', at(-9, 16), 1, 'Seminar Hall 1', 'Real phishing emails sent to students, and how to spot them.', {
    registrationOpen: false, seats: 120, registered: 97,
    recap: 'Forty real emails, anonymised. Most of the room fell for the fee-receipt one.',
    photos: frames('pc1', ['The fee-receipt email', 'Spot the sender', 'Q&A']),
  }),
  ev('past-rudra-1', 'Monsoon Jam', 'rudra', at(-20, 18), 3, 'Amphitheatre', 'Seven bands, one very loud evening.', {
    registrationOpen: false, seats: 400, registered: 380,
    recap: 'Seven bands, one power cut, and an acoustic set by phone light.',
    photos: frames('pr1', ['Soundcheck', 'Band four', 'The power cut', 'Phone-light encore', 'Crowd at the front', 'Packing up']),
  }),
  ev('past-chiptech-1', 'Solder Saturday', 'chiptech', at(-15, 10), 4, 'Electronics Lab', 'Learn to solder by building a small LED badge.', {
    registrationOpen: false, seats: 30, registered: 30,
    recap: 'Thirty badges built, two burnt fingers, zero fires.',
    photos: frames('pch1', ['Kits on the bench', 'First joints', 'Finished badges']),
  }),
  ev('past-ecell-1', 'Founders’ Fireside', 'ecell', at(-6, 17), 2, 'Board Room, Block A', 'Two alumni founders on their first year.', {
    registrationOpen: false, seats: 40, registered: 40,
    recap: 'Notes from the talk are on the ECell page.',
    photos: frames('pe1', ['Fireside chairs', 'Questions from the floor']),
  }),
]

const P = 'School of Computer Science and Engineering' as const

export const projects: Project[] = [
  {
    id: 'p-greenhouse', name: 'Greenhouse sensor mesh', category: 'Technology', school: P, status: 'Building',
    description: 'Soil-moisture and temperature sensors across the campus garden, reporting to a small dashboard so the Green Alliance waters only what needs it.',
    stack: ['ESP32', 'LoRa', 'C++', 'React', 'InfluxDB'],
    github: 'https://github.com/rvu-greenhouse/mesh', demo: '',
    team: [{ name: 'Nikhil Varma', role: 'Lead, firmware', studentId: 's-nikhil' }, { name: 'Sara Thomas', role: 'Dashboard', studentId: 's-sara' }],
    openings: [{ role: 'Embedded systems developer', skills: ['C++', 'ESP32', 'Low-power design'], commitment: '4 hours a week' }, { role: 'PCB designer', skills: ['KiCad', 'Soldering'], commitment: '3 hours a week' }],
    closes: at(6, 23, 59), stars: 128, topics: ['iot', 'sustainability', 'campus-garden', 'hardware'], updated: at(-1, 20),
  },
  {
    id: 'p-mess', name: 'Mess menu that learns', category: 'Technology', school: P, status: 'Building',
    description: 'Predicts tomorrow’s attendance at the mess from three weeks of footfall data, so the kitchen cooks closer to what gets eaten.',
    stack: ['Python', 'scikit-learn', 'FastAPI', 'TypeScript'],
    github: 'https://github.com/ananya-r/mess-forecast', demo: 'https://mess-forecast.example.app',
    team: [{ name: 'Ananya Rao', role: 'Lead, modelling', studentId: 's-ananya' }, { name: 'Dev Malhotra', role: 'Backend' }, { name: 'Pooja Iyer', role: 'Data collection' }],
    openings: [{ role: 'Data analyst', skills: ['Python', 'Pandas', 'Statistics'], commitment: '4 hours a week' }, { role: 'Frontend developer', skills: ['React', 'TypeScript'], commitment: '3 hours a week' }],
    closes: at(4, 23, 59), stars: 94, topics: ['forecasting', 'food-waste', 'machine-learning'], updated: at(-2, 18),
  },
  {
    id: 'p-wayfind', name: 'Campus wayfinding signage', category: 'Design', school: 'School of Design and Innovation', status: 'Building',
    description: 'New students get lost in Block B. A redesigned signage system, prototyped in card and tested during orientation week.',
    stack: ['Figma', 'Illustrator', 'Field testing'],
    github: '', demo: 'https://www.figma.com/proto/wayfinding-demo',
    team: [{ name: 'Kabir Sethi', role: 'Lead, wayfinding', studentId: 's-kabir' }, { name: 'Tara Nair', role: 'Research' }],
    openings: [{ role: 'Visual designer', skills: ['Typography', 'Illustrator'], commitment: '3 hours a week' }],
    closes: at(9, 23, 59), stars: 163, topics: ['wayfinding', 'signage', 'user-research', 'orientation'], updated: at(-3, 12),
  },
  {
    id: 'p-podcast', name: 'Hallway: a student podcast', category: 'Media', school: 'School of Film, Media and Creative Arts', status: 'Building',
    description: 'Ten-minute episodes with the people who keep the campus running. The pilot with the night guard is recorded.',
    stack: ['Audition', 'Riverside', 'Notion'],
    github: '', demo: 'https://hallway.example.fm',
    team: [{ name: 'Meera Krishnan', role: 'Host, producer', studentId: 's-meera' }, { name: 'Aarav Shetty', role: 'Recording' }],
    openings: [{ role: 'Sound editor', skills: ['Audition', 'Mixing'], commitment: '2 hours a week' }],
    closes: at(5, 23, 59), stars: 71, topics: ['podcast', 'oral-history', 'audio'], updated: at(-1, 9),
  },
  {
    id: 'p-booking', name: 'Room booking agent', category: 'Technology', school: P, status: 'Completed',
    description: 'Ask in plain words for a room, a time and a projector; the agent checks the timetable and books it. Born at Iterium’s Automation Teardown.',
    stack: ['TypeScript', 'Node.js', 'Claude API', 'Google Calendar API'],
    github: 'https://github.com/iterium-rvu/room-agent', demo: 'https://room-agent.example.app',
    team: [{ name: 'Harsh Gupta', role: 'Lead', studentId: 's-harsh' }, { name: 'Ananya Rao', role: 'Prompting and evals', studentId: 's-ananya' }, { name: 'Leo D’Souza', role: 'Calendar integration' }],
    openings: [], stars: 212, topics: ['llm-agents', 'automation', 'iterium'], updated: at(-8, 16),
  },
  {
    id: 'p-policy', name: 'Bus routes, by the numbers', category: 'Business', school: 'School of Economics and Public Policy', status: 'Building',
    description: 'A commuter survey and a model for a better shuttle timetable, to propose to the transport office before next term.',
    stack: ['Google Forms', 'R', 'QGIS'],
    github: 'https://github.com/ishita-v/shuttle-model', demo: '',
    team: [{ name: 'Ishita Verma', role: 'Lead', studentId: 's-ishita' }, { name: 'Neel Joshi', role: 'Survey' }],
    openings: [{ role: 'Survey designer', skills: ['Questionnaire design'], commitment: '3 hours a week' }, { role: 'GIS analyst', skills: ['QGIS', 'R'], commitment: '3 hours a week' }],
    closes: at(2, 23, 59), stars: 57, topics: ['public-policy', 'transport', 'survey', 'gis'], updated: at(-1, 14),
  },
  {
    id: 'p-thrift', name: 'Hostel thrift exchange', category: 'Social impact', school: 'School of Business', status: 'Completed',
    description: 'A swap shelf in each hostel and a listing board, so books and coats move on instead of being thrown out. 212 items swapped in the first month.',
    stack: ['Glide', 'Google Sheets'],
    github: '', demo: 'https://thrift.example.app',
    team: [{ name: 'Rohan Patel', role: 'Operations', studentId: 's-rohan' }, { name: 'Diya Menon', role: 'Outreach' }],
    openings: [], stars: 139, topics: ['circular-economy', 'hostels', 'operations'], updated: at(-14, 11),
  },
  {
    id: 'p-legal', name: 'Know your tenancy rights', category: 'Social impact', school: 'School of Law', status: 'Building',
    description: 'Plain-language guides for students renting near campus, reviewed by School of Law faculty.',
    stack: ['Markdown', 'Astro'],
    github: 'https://github.com/arjun-m/tenancy-guide', demo: '',
    team: [{ name: 'Arjun Mehta', role: 'Lead writer', studentId: 's-arjun' }],
    openings: [{ role: 'Illustrator', skills: ['Illustration', 'Procreate'], commitment: '2 hours a week' }, { role: 'Web developer', skills: ['Astro', 'HTML', 'CSS'], commitment: '2 hours a week' }],
    closes: at(10, 23, 59), stars: 88, topics: ['tenancy', 'plain-language', 'legal-aid'], updated: at(-4, 10),
  },
  {
    id: 'p-shorts', name: 'Eight minutes in Block C', category: 'Media', school: 'School of Film, Media and Creative Arts', status: 'Completed',
    description: 'A short documentary following the last lab of the night, shot on one phone over a fortnight. Screened at Thesis Student Shorts.',
    stack: ['DaVinci Resolve', 'Cinematography', 'Sound design'],
    github: '', demo: 'https://vimeo.com/example-blockc',
    team: [{ name: 'Riya Kapoor', role: 'Director' }, { name: 'Meera Krishnan', role: 'Sound', studentId: 's-meera' }],
    openings: [], stars: 176, topics: ['documentary', 'short-film', 'campus-life'], updated: at(-6, 21),
  },
  {
    id: 'p-zine', name: 'Margins: a poetry zine', category: 'Culture', school: 'School of Liberal Arts and Sciences', status: 'Building',
    description: 'A printed zine of student poetry in four languages, risograph-printed each term and left in the library. Issue 02 is open for submissions.',
    stack: ['Editing', 'Translation', 'InDesign', 'Risograph'],
    github: '', demo: '',
    team: [{ name: 'Priya Natarajan', role: 'Editor', studentId: 's-priya' }, { name: 'Sana Iqbal', role: 'Translation' }],
    openings: [{ role: 'Translator (Kannada or Hindi)', skills: ['Translation', 'Editing'], commitment: '2 hours a week' }, { role: 'Layout designer', skills: ['InDesign', 'Typography'], commitment: '3 hours a week' }],
    closes: at(12, 23, 59), stars: 64, topics: ['poetry', 'print', 'multilingual'], updated: at(-2, 11),
  },
  {
    id: 'p-moot', name: 'Moot court bundle builder', category: 'Social impact', school: 'School of Law', status: 'Building',
    description: 'A checklist and template pack that turns a moot problem into a filed bundle: memorial, list of authorities, compendium. Used by two teams this term.',
    stack: ['Legal research', 'Google Docs', 'Templates'],
    github: '', demo: '',
    team: [{ name: 'Arjun Mehta', role: 'Lead', studentId: 's-arjun' }, { name: 'Kavya Rao', role: 'Research' }],
    openings: [{ role: 'Research assistant', skills: ['Legal research', 'Research'], commitment: '2 hours a week' }],
    closes: at(8, 23, 59), stars: 41, topics: ['moot-court', 'legal-writing', 'templates'], updated: at(-5, 15),
  },
]

/** The student directory. People choose to be listed. */
export const students: Student[] = [
  { id: 's-nikhil', name: 'Nikhil Varma', school: P, year: 3, skills: ['C++', 'ESP32', 'LoRa', 'KiCad'], interests: ['Technology', 'Social impact'], bio: 'Building a sensor mesh for the campus garden. Happy to help anyone stuck on firmware.', openToCollaborate: true, links: { github: 'https://github.com/nikhilvarma' }, clubs: ['chiptech', 'green-alliance'] },
  { id: 's-sara', name: 'Sara Thomas', school: P, year: 2, skills: ['React', 'TypeScript', 'D3'], interests: ['Technology', 'Design'], bio: 'Dashboards and data visualisation.', openToCollaborate: true, links: { github: 'https://github.com/sarathomas', linkedin: 'https://www.linkedin.com/in/sarathomas' }, clubs: ['devsphere'] },
  { id: 's-ananya', name: 'Ananya Rao', school: P, year: 3, skills: ['Python', 'Machine learning', 'FastAPI', 'Pandas'], interests: ['Technology'], bio: 'Forecasting things nobody asked me to forecast.', openToCollaborate: true, links: { github: 'https://github.com/ananya-r' }, clubs: ['iterium', 'agentblazer'] },
  { id: 's-kabir', name: 'Kabir Sethi', school: 'School of Design and Innovation', year: 4, skills: ['Wayfinding', 'Typography', 'Figma', 'User research'], interests: ['Design'], bio: 'Signs, systems and the people who get lost between them.', openToCollaborate: true, links: { portfolio: 'https://kabirsethi.design' }, clubs: ['artora'] },
  { id: 's-meera', name: 'Meera Krishnan', school: 'School of Film, Media and Creative Arts', year: 2, skills: ['Audio production', 'Interviewing', 'Audition'], interests: ['Media', 'Culture'], bio: 'Host of Hallway. Always looking for the next guest.', openToCollaborate: true, links: { linkedin: 'https://www.linkedin.com/in/meerak' }, clubs: ['presscorps', 'thesis'] },
  { id: 's-harsh', name: 'Harsh Gupta', school: P, year: 4, skills: ['TypeScript', 'Node.js', 'LLM agents'], interests: ['Technology', 'Business'], bio: 'Shipped the room-booking agent. Now mentoring at Iterium.', openToCollaborate: false, links: { github: 'https://github.com/harshg' }, clubs: ['iterium'] },
  { id: 's-ishita', name: 'Ishita Verma', school: 'School of Economics and Public Policy', year: 3, skills: ['R', 'QGIS', 'Survey design'], interests: ['Business', 'Social impact'], bio: 'Trying to fix the 7:40 shuttle with a spreadsheet.', openToCollaborate: true, links: { linkedin: 'https://www.linkedin.com/in/ishitaverma' }, clubs: ['representatives'] },
  { id: 's-rohan', name: 'Rohan Patel', school: 'School of Business', year: 4, skills: ['Operations', 'Marketing', 'Glide'], interests: ['Business', 'Social impact'], bio: 'Ran the hostel thrift exchange. Ask me about logistics.', openToCollaborate: false, links: { linkedin: 'https://www.linkedin.com/in/rohanpatel' }, clubs: ['ecell'] },
  { id: 's-arjun', name: 'Arjun Mehta', school: 'School of Law', year: 3, skills: ['Legal writing', 'Research', 'Markdown'], interests: ['Social impact'], bio: 'Writing tenancy guides students will actually read.', openToCollaborate: true, links: {}, clubs: ['representatives'] },
  { id: 's-zoya', name: 'Zoya Khan', school: P, year: 2, skills: ['Embedded C', 'STM32', 'PCB design', 'KiCad'], interests: ['Technology'], bio: 'Formula student electronics at RVOLT. Free on weekends.', openToCollaborate: true, links: { github: 'https://github.com/zoyakhan' }, clubs: ['rvolt', 'chiptech'] },
  { id: 's-vivek', name: 'Vivek Bhat', school: 'School of Design and Innovation', year: 2, skills: ['Illustration', 'Procreate', 'Motion design'], interests: ['Design', 'Media'], bio: 'Illustrator. Will draw your explainer.', openToCollaborate: true, links: { portfolio: 'https://vivekbhat.art' }, clubs: ['artora', 'presscorps'] },
  { id: 's-priya', name: 'Priya Natarajan', school: 'School of Liberal Arts and Sciences', year: 1, skills: ['Writing', 'Editing', 'Photography'], interests: ['Culture', 'Media'], bio: 'First year, writing for Presscorps.', openToCollaborate: true, links: {}, clubs: ['presscorps', 'poethra'] },
  { id: 's-aditya', name: 'Aditya Rao', school: P, year: 1, skills: ['Python', 'Arduino', 'React'], interests: ['Technology', 'Sport'], bio: 'Looking for a first project to join.', openToCollaborate: true, links: { github: 'https://github.com/adityarao' }, clubs: ['cybersec'] },
  { id: 's-fatima', name: 'Fatima Sheikh', school: 'School of Business', year: 2, skills: ['Finance', 'Excel', 'Pitching'], interests: ['Business'], bio: 'ECell core. Ask me about pitch decks.', openToCollaborate: true, links: { linkedin: 'https://www.linkedin.com/in/fatimasheikh' }, clubs: ['ecell'] },
]
export const studentById = (id: string) => students.find((s) => s.id === id)

/** The board. Asks read like openings: what, who, how long, and what's in it for you. */
export const posts: BoardPost[] = [
  { id: 'b-firmware', kind: 'seeking', authorId: 's-nikhil', title: 'Firmware hand for a LoRa sensor mesh', body: 'Twelve soil sensors in the campus garden keep dropping off the mesh after a day. I need someone who has fought deep-sleep and radio timing on an ESP32 before. We meet Thursday evenings in the hardware lab, the rest can be remote.', skills: ['C++', 'ESP32', 'LoRa'], category: 'Technology', commitment: 'Two to four weeks', mode: 'Either', rewards: ['Credit on the project', 'Certificate'], spots: 1, posted: at(-1, 19), closes: at(9, 23), projectId: 'p-greenhouse', urgent: true, hands: ['s-zoya'] },
  { id: 'b-illus', kind: 'seeking', authorId: 's-meera', title: 'Illustrator for Hallway episode covers', body: 'Eight episode covers in one visual family, square format. I have a brief and a moodboard ready. Paid from the Presscorps budget.', skills: ['Illustration', 'Procreate'], category: 'Media', commitment: 'A semester', mode: 'Remote', rewards: ['Stipend', 'Credit on the project'], spots: 1, posted: at(-3, 11), closes: at(12, 23), projectId: 'p-podcast', hands: [] },
  { id: 'b-dash', kind: 'seeking', authorId: 's-ishita', title: 'Someone to turn shuttle data into a dashboard', body: 'Three months of boarding counts for the 7:40 shuttle, already cleaned. I want a simple public page the transport office can read without help. React or anything that ships.', skills: ['React', 'D3', 'TypeScript'], category: 'Social impact', commitment: 'Two to four weeks', mode: 'Remote', rewards: ['Co-author', 'Credit on the project'], spots: 2, posted: at(-2, 15), closes: at(6, 23), projectId: 'p-policy', hands: ['s-sara'] },
  { id: 'b-pitch', kind: 'seeking', authorId: 's-rohan', title: 'Pitch partner for the E-Summit finals', body: 'Our thrift exchange made the finals. I have the numbers; I need someone who can make eight slides look like we mean it, and rehearse with me twice.', skills: ['Pitching', 'Figma'], category: 'Business', commitment: 'A weekend', mode: 'On campus', rewards: ['Credit on the project', 'Just for fun'], spots: 1, posted: at(0, 9), closes: at(4, 18), urgent: true, hands: [] },
  { id: 'b-research', kind: 'seeking', authorId: 's-arjun', title: 'Two readers to test tenancy guides', body: 'Read three short guides, tell me where you got lost. Forty minutes each, coffee on me. Ideal if you rent near campus.', skills: ['Writing', 'Editing'], category: 'Social impact', commitment: 'A few hours', mode: 'On campus', rewards: ['Just for fun', 'Co-author'], spots: 2, posted: at(-5, 13), projectId: 'p-legal', hands: ['s-priya'] },
  { id: 'b-ml', kind: 'seeking', authorId: 's-ananya', title: 'Backend dev for the mess menu model', body: 'The forecaster works in a notebook. It needs a small FastAPI service and a cron job so the mess team sees tomorrow\'s numbers at 6 pm.', skills: ['Python', 'FastAPI'], category: 'Technology', commitment: 'Two to four weeks', mode: 'Either', rewards: ['Credit on the project', 'Mentorship'], spots: 1, posted: at(-4, 10), closes: at(10, 23), projectId: 'p-mess', hands: ['s-aditya', 's-harsh'] },
  { id: 'o-pcb', kind: 'offering', authorId: 's-zoya', title: 'I will review your PCB before you order it', body: 'Send me your KiCad files. I check footprints, power paths and the mistakes I have already paid for. Weekends only.', skills: ['KiCad', 'PCB design', 'STM32'], category: 'Technology', commitment: 'A few hours', mode: 'Remote', rewards: ['Skill swap', 'Just for fun'], spots: 1, posted: at(-2, 20), hands: ['s-nikhil'] },
  { id: 'o-draw', kind: 'offering', authorId: 's-vivek', title: 'Explainer illustrations for your project page', body: 'One diagram or a set of three spot illustrations, in a style that matches your page. I would like credit and a line in your README.', skills: ['Illustration', 'Motion design'], category: 'Design', commitment: 'A weekend', mode: 'Remote', rewards: ['Credit on the project'], spots: 1, posted: at(-1, 16), hands: [] },
  { id: 'o-mentor', kind: 'offering', authorId: 's-harsh', title: 'Office hours: LLM agents and TypeScript', body: 'Stuck on tool calling, evals or a flaky agent loop? Thirty-minute slots on Friday afternoons at the Iterium room.', skills: ['LLM agents', 'TypeScript', 'Node.js'], category: 'Technology', commitment: 'A few hours', mode: 'On campus', rewards: ['Mentorship'], spots: 1, posted: at(-6, 12), hands: ['s-aditya'] },
  { id: 'o-deck', kind: 'offering', authorId: 's-fatima', title: 'Pitch deck teardown, free', body: 'I will read your deck and send back ten blunt notes in 48 hours. Startups, club budgets, hackathon pitches.', skills: ['Pitching', 'Finance'], category: 'Business', commitment: 'A few hours', mode: 'Remote', rewards: ['Skill swap', 'Just for fun'], spots: 1, posted: at(-3, 18), hands: [] },
  { id: 'o-wayfind', kind: 'offering', authorId: 's-kabir', title: 'User research for anything with signs or maps', body: 'I run quick hallway tests: five people, one task, a short report. Happy to teach the method while we do it.', skills: ['User research', 'Wayfinding'], category: 'Design', commitment: 'A weekend', mode: 'On campus', rewards: ['Mentorship', 'Skill swap'], spots: 1, posted: at(-7, 14), hands: [] },
]

export const notices: Notice[] = [
  { id: 'n-exam', title: 'End-semester timetable published', from: 'Office of the Controller of Examinations', body: 'The provisional timetable for the end-semester examinations is out. Report clashes before the deadline so they can be resolved.', priority: 'High', posted: at(0, 9), actionLabel: 'Report a clash', due: at(4, 17) },
  { id: 'n-fee', title: 'Hostel fee window closes this week', from: 'Office of Student Affairs', body: 'Second-instalment hostel fees are due. Late payments incur a fine from the following Monday.', priority: 'High', posted: at(-1, 11), actionLabel: 'View fee details', due: at(5, 17) },
  { id: 'n-bus', title: 'Shuttle timings change from Monday', from: 'Transport Office', body: 'The 7:40 shuttle from Kengeri moves to 7:30. Evening services are unchanged.', priority: 'Normal', posted: at(-1, 15) },
  { id: 'n-library', title: 'Library open until midnight during exams', from: 'Library', body: 'Extended hours begin next week and run to the last examination day.', priority: 'Normal', posted: at(-2, 10) },
  { id: 'n-wellbeing', title: 'Drop-in counselling, every Wednesday', from: 'Student Wellbeing Centre', body: 'No appointment needed. 2 pm to 5 pm, Wellbeing Room, Block A.', priority: 'Normal', posted: at(-4, 12) },
]

export const clubById = club

/** What each club asks for in a join request. Your profile links fill these in. */
export const asksFor = (c: Club): Ask[] => {
  switch (c.category) {
    case 'Technology':
      return ['GitHub', 'LinkedIn']
    case 'Design':
    case 'Media':
      return ['Portfolio', 'LinkedIn']
    case 'Business':
      return ['LinkedIn']
    default:
      return []
  }
}

export const allEvents = [...events, ...pastEvents]
export const eventById = (id: string) => allEvents.find((e) => e.id === id)


const LEADS: Record<string, [string, string][]> = {
  iterium: [['Harsh Gupta', 'President'], ['Ananya Rao', 'Vice-president'], ['Leo D’Souza', 'Events lead']],
  cybersec: [['Aditi Kulkarni', 'President'], ['Rahul Shenoy', 'CTF lead']],
  chiptech: [['Nikhil Varma', 'President'], ['Zoya Khan', 'Workshop lead']],
  ecell: [['Fatima Sheikh', 'President'], ['Rohan Patel', 'Partnerships']],
  rudra: [['Siddharth Rao', 'President'], ['Anika Das', 'Music director']],
}
const GIVEN = ['Aditi', 'Rahul', 'Sneha', 'Varun', 'Kavya', 'Manav', 'Riya', 'Omkar', 'Tanvi', 'Yash']
const FAMILY = ['Kulkarni', 'Shenoy', 'Hegde', 'Pillai', 'Reddy', 'Menon', 'Bose', 'Kamath', 'Desai', 'Sharma']

/** Default page for every club. Club cores change it from the host dashboard. */
export function defaultClubPage(c: Club): ClubPage {
  const n = c.id.length + c.name.length
  const leads = LEADS[c.id] ?? [
    [`${GIVEN[n % 10]} ${FAMILY[(n * 3) % 10]}`, 'President'],
    [`${GIVEN[(n + 4) % 10]} ${FAMILY[(n + 7) % 10]}`, 'Secretary'],
  ]
  const slug = c.id.replace(/-/g, '')
  return {
    tagline: c.tagline,
    about: `${c.name} is an approved student club at RV University. ${c.tagline} Open to every school and every year; no experience needed unless a role says so.`,
    objectives:
      c.category === 'Technology'
        ? ['Run hands-on sessions every fortnight', 'Ship at least one project a semester that the campus uses', 'Pair first-years with a senior mentor']
        : ['Meet every week during term', 'Put on one public showcase each semester', 'Make it easy for anyone to try it once'],
    leadership: leads.map(([name, role]) => ({ name, role })),
    recruitment: {
      open: c.recruiting,
      message: c.recruiting ? 'We are taking new members this month. Tell us a little about yourself; we reply within a week.' : '',
      roles: c.recruiting ? (c.category === 'Technology' ? ['Member', 'Workshop volunteer', 'Design and media'] : ['Member', 'Events volunteer']) : [],
      closes: c.recruiting ? at(10, 23, 59).toISOString() : undefined,
    },
    questions: [
      { id: 'q-why', label: `Why do you want to join ${c.name}?`, kind: 'long', required: true },
      { id: 'q-time', label: 'How much time can you give in a week?', kind: 'choice', required: true, options: ['1 to 2 hours', '3 to 5 hours', 'More than 5 hours'] },
    ],
    asks: asksFor(c),
    contact: { email: `${slug}@rvu.edu.in`, instagram: `@${slug}.rvu`, whatsapp: '', website: c.id === 'iterium' ? 'https://iterium.rvu.edu.in' : '' },
    sections: ['about', 'recruitment', 'upcoming', 'leadership', 'archive', 'contact'],
    hidden: [],
    tone: c.category === 'Technology' ? 'teal' : c.category === 'Culture' || c.category === 'Media' ? 'gold' : 'slate',
    look: defaultLook(c),
    founded: 2021 + (n % 4),
  }
}
