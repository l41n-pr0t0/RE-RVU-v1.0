import { EventDrawerProvider } from './components/EventBits'
import { Onboarding } from './components/Onboarding'
import { Shell } from './components/Shell'
import { EmptyState } from './components/ui'
import { href, useRoute, type Route } from './lib/router'
import { StoreProvider, useStore } from './lib/store'
import { Home } from './pages/Home'
import { Landing } from './pages/Landing'

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <Home />
    default:
      // Pages still being built in this preview
      return (
        <div className="py-20">
          <EmptyState
            title="This page is next on our list"
            body="Today and the event drawer are ready to try. The rest of the app lands in the next build."
            action={
              <a className="btn btn-gold" href={href('home')}>
                Back to Today
              </a>
            }
          />
        </div>
      )
  }
}

function Routed() {
  const route = useRoute()
  const { profile } = useStore()
  if (route.name === 'landing') return <Landing />
  if (!profile) return <Onboarding onDone={() => undefined} />
  return (
    <Shell route={route}>
      <Page route={route} />
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
