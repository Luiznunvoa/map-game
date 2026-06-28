import { Route,Router } from '@solidjs/router'

import { RoomPage } from './components/pages/game'
import { HomePage } from './components/pages/home'
import { AuthProvider } from './components/providers/AuthProvider'

export function App() {
  return (
    <Router root={AuthProvider}>
      <Route path="/" component={HomePage} />
      <Route path="/game" component={RoomPage} />
    </Router>
  )
}
