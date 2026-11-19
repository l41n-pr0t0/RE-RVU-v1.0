import { lazy, Suspense, useEffect } from 'react'
import { EventDrawerProvider } from './components/EventBits'
import { Shell } from './components/Shell'
import { ListSkeleton } from './components/ui'
import { go, useRoute, type Route } from './lib/router'
import { StoreProvider, useStore } from './lib/store'
import Landing from './pages/Landing'
import { pendingIdentity } from './components/SignIn'
import Home from './pages/Home'

// Landing and Today ship in the first bundle; the rest load on first visit.
const Welcome = lazy(() => import('./pages/Welcome'))
const Events = lazy(() => import('./pages/Events'))
const Clubs = lazy(() => import('./pages/Clubs'))
const Projects = lazy(() => import('./pages/Projects'))
const Notices = lazy(() => import('./pages/Notices'))
const Profile = lazy(() => import('./pages/Profile'))

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'events':
      return <Events id={route.id} />
    case 'clubs':
      return <Clubs key={route.id ?? 'index'} id={route.id} />
    case 'projects':
      return <Projects key={route.id ?? 'index'} id={route.id} />
    case 'notices':
      return <Notices />
    case 'profile':
      return <Profile />
    default:
      return <Home />
  }
}

const Fallback = () => (
  <div className="py-16">
    <ListSkeleton rows={4} />
  </div>
)

function Routed() {
  const route = useRoute()
  const { profile } = useStore()
  const needsProfile = route.name !== 'landing' && !profile && !(route.name === 'welcome' && pendingIdentity())

  // Every app page needs a profile (guest counts). Without one, start at the landing screen.
  useEffect(() => {
    if (needsProfile) go('')
  }, [needsProfile])

  if (route.name === 'landing' || needsProfile) return <Landing />
  if (route.name === 'welcome')
    return (
      <Suspense fallback={null}>
        <Welcome />
      </Suspense>
    )
  return (
    <Shell route={route}>
      <Suspense fallback={<Fallback />}>
        <Page route={route} />
      </Suspense>
    </Shell>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <EventDrawerProvider>
        <Routed />
      </EventDrawerProvider>
    </StoreProvider>
  )
}
