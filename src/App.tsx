import { Router, Route } from '@solidjs/router';
import { MenuPage } from '@/pages/MenuPage';
import { LobbyPage } from '@/pages/LobbyPage';
import { RoomPage } from '@/pages/RoomPage';

export function App() {
  return (
    <Router>
      <Route path="/" component={MenuPage} />
      <Route path="/lobby" component={LobbyPage} />
      <Route path="/room/:id" component={RoomPage} />
    </Router>
  );
}
