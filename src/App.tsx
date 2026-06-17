import { Router, Route } from '@solidjs/router';
import { HomePage } from './components/pages/home';
import { LobbyPage } from './components/pages/looby';
import { RoomPage } from './components/pages/game';
import { AuthProvider } from './components/providers/AuthProvider';

export function App() {
  return (
    <Router root={AuthProvider}>
      <Route path="/" component={HomePage} />
      <Route path="/lobby" component={LobbyPage} />
      <Route path="/room/:id" component={RoomPage} />
    </Router>
  );
}
