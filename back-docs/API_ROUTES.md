# API Routes

This document describes the HTTP endpoints and WebSocket connections available in *The Map Game* backend.

## Error Response Pattern

When the API returns an error, the response body follows the pattern defined by `apperr`:

```json
{
  "error": "Failure description"
}
```

The HTTP code will correspond to the error (400, 401, 404, 409, 500).

---

## Authentication (`/api/auth`)

### Register User
* **Route:** `POST /api/auth/register`
* **Body (JSON):**
  * `name` (string, required)
  * `email` (string, required)
  * `password` (string, min 6 characters)
* **Returns (201 Created):** Returns the `UserResponse`.

### Login
* **Route:** `POST /api/auth/login`
* **Body (JSON):**
  * `email` (string, required)
  * `password` (string, required)
* **Returns (200 OK):** Sets the `auth_token` cookie (HttpOnly).
  * Returns the token in plain text under the `"token"` key and the `"user"`.

### Logout
* **Route:** `POST /api/auth/logout`
* **Body:** Empty.
* **Returns (200 OK):** Invalidates the `auth_token` cookie.

---

## Rooms (`/api/rooms`)

*Requires Authentication (Cookie or Authorization Header).*

### Create Room
* **Route:** `POST /api/rooms`
* **Body (JSON):**
  * `name` (string)
  * `visibility` (string, "PUBLIC" or "PRIVATE")
  * `map_id` (int)
  * `speed` (int)
  * `save_size_limit` (int)
* **Returns (201 Created):** `RoomResponse` containing the room's UUID.

### Leave Room
* **Route:** `DELETE /api/rooms/:uuid`
* **Returns (200 OK):** The user making the request leaves the room. If they are the HOST, the room and all players in it are removed.

---

## Room Map (`/api/rooms/:roomId/map`)

*Requires Authentication (Cookie or Authorization Header).*
*This data forms the initial graphical simulation and is cached in memory on the server.*

### Get Full Map State
* **Route:** `GET /api/rooms/:roomId/map`
* **Returns:** Content packed in **MsgPack** and compressed in **Gzip**. Contains all definitions (Provinces, Terrains, Adjacencies, Regions).

### Static Images
* **Route:** `GET /api/rooms/:roomId/map/provinces.png`
* **Route:** `GET /api/rooms/:roomId/map/terrain.png`
* **Returns:** Binary data (image/png) encoded via gzip.

### JSON Metadata
* **Route:** `GET /api/rooms/:roomId/map/countries.json`
* **Route:** `GET /api/rooms/:roomId/map/definitions.json`
* **Returns:** Static JSON data linked to the room's map.

---

## WebSockets

### Lobby (Global Room Monitor)
* **Route:** `GET /ws/lobby`
* **Description:** Open to everyone. Actively updates the list of rooms waiting for players (Status: `WAITING`).

**Events (Server -> Client):**
* **`rooms_update`**: Broadcasts the paginated list of available waiting rooms.
  ```json
  {
    "event": "rooms_update",
    "data": {
      "page": 1,
      "per_page": 20,
      "total_items": 1,
      "total_pages": 1,
      "rooms": [
        {
          "room_id": "uuid-1234-5678",
          "name": "My Cool Match",
          "visibility": "PUBLIC",
          "status": "WAITING",
          "map_id": 1,
          "speed": 2,
          "save_size_limit": 50,
          "created_at": "2026-06-21T10:00:00Z",
          "player_count": 1
        }
      ]
    }
  }
  ```

### Room Connections (Triple-WebSocket / Phase-Based Architecture)
In-game interactions are divided into two primary connection phases. All connections require the JWT token to be sent via Cookie (`auth_token`). **Explicitly passing tokens in the URL/query-string should never be done for security and integrity reasons.**

#### Phase 1: The Lobby / Pre-Game (`room_ws`)
* **Route:** `GET /ws/rooms/:uuid/lobby`
* **Description:** When the room is in `WAITING` status, this channel acts as the Lobby manager.

**Events (Client -> Server):**
* **`select_country`**: Player claims a country.
  ```json
  {"event": "select_country", "data": {"country_id": "ENG"}}
  ```

* **`start_game` (HOST Exclusive)**: Starts the game if all players are ready.
  ```json
  {"event": "start_game"}
  ```

**Events (Server -> Client):**
* **`players_update`**: Broadcasts the current player list (with country and ready status).
  ```json
  {
    "event": "players_update",
    "data": [
      {
        "user_uuid": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Luiz",
        "role": "HOST",
        "country_id": "ENG",
        "is_ready": true,
        "joined_at": "2026-06-21T10:00:00Z"
      }
    ]
  }
  ```
* **`room_closed`**: Broadcasts if the Host leaves the lobby or deletes the room.
  ```json
  {
    "event": "room_closed",
    "data": {
      "message": "The host has left the room."
    }
  }
  ```
* **`game_started`**: Broadcasts that the room is now `PLAYING`. Frontend should switch to the Game UI.
  ```json
  {
    "event": "game_started"
  }
  ```

#### Phase 2: In-Game Action / State WS
* **Route:** `GET /ws/rooms/:uuid/state`
* **Description:** After `game_started`, this channel is dedicated to manual commands that don't depend on the Engine's clock (e.g., Play/Pause, chat, diplomacy). Operates autonomously even when the simulation is paused.

**Events (Client -> Server):**
* **Action Command (HOST Exclusive):** Used to control the game's time flow.
  ```json
  {
    "event": "action",
    "data": {
      "action": "play",   // or "pause"
      "speed": 2          // Optional, changes game speed (1 to 5)
    }
  }
  ```

**Events (Server -> Client):**
* **`state_action_ack`**: Acknowledges the action command.
  ```json
  {
    "event": "state_action_ack",
    "data": {
      "status": "processed",
      "message": "..."
    }
  }
  ```

#### Phase 3: In-Game Simulation WS (Tick WS)
* **Route:** `GET /ws/rooms/:uuid/tick`
* **Description:** Passively receives the passage of time and continuous state changes (economy, troop movement).
* **Flow:** Unidirectional (Server -> Client). 

**Events (Server -> Client):**
* **`game_tick`**: Fired every iteration of the Engine's clock in RAM.
  ```json
  {
    "event": "game_tick",
    "date": "1836-01-01",
    "period": 0,          // 0: Morning, 1: Afternoon, 2: Night, 3: Late Night
    "speed": 2,
    "paused": false
  }
  ```
