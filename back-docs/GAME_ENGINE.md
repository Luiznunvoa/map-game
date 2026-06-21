# ⚙️ Game Engine Architecture

This document describes the simulation architecture of *The Map Game*, the engine responsible for processing the passage of time, the economy, troop movement, and emitting the current game state to connected players.

## 1. Philosophy: In-Memory Engine (RAM-First)

To support multiple simultaneous matches performantly and avoid database flooding (blocking I/O), the simulation of an active match occurs entirely in **RAM**. The server acts as a *State-Based Authoritative* system.

*   The database (SQLite) is used strictly to load the initial game and to persist progress in *Auto-Saves* or when the match is *Paused/Saved*.
*   During the match, calculations (Ticks, Positions, Economy) happen in Engine `structs`, avoiding continuous SQL queries to keep the simulation running in milliseconds.

## 2. The Base Structure (`internal/engine`)

The `internal/engine` package manages active sessions independently of the transport layer (WebSockets).

### `GameManager`
It is a *Singleton* instantiated at the start of the application. It acts as the central registry for active games on the server.
*   Maintains a `map[string]*GameSession` indexed by the room's UUID.
*   It is protected by a `sync.RWMutex` to ensure safe access when creating, pausing, or destroying matches originating from multiple requests.

### `GameSession`
Represents an isolated match running in memory. Each instance contains:
*   **Transient State:** Total Ticks elapsed, current Speed (`Speed`), Scenario Start Date.
*   **Concurrency Control:** An internal `sync.RWMutex` and a `quitChan` channel to safely interrupt and shut down the Goroutine.
*   **Communication Bridge:** A Broadcast channel (e.g., `chan<- []byte`) passed by the WebSockets infrastructure, being the pathway through which the engine continuously fires the simulation's *State Deltas* (time, economy, movement) to connected clients.

## 3. The Central Clock (Game Loop & Ticks)

Time in *The Map Game* is modular and subdivided into "Ticks". 

### Time Math (O(1) Complexity)
The primordial simulation unit is the **Tick**.
*   **1 in-game Day = 4 Ticks**
*   **Periods:** `0` (Late Night/Morning), `1` (Afternoon), `2` (Night), `3` (Late Night).

Instead of manipulating heavy operations based on date strings, the server passively accumulates a single integer variable (`TotalTicks`). 
The conversion relies on simple division:
*   **Elapsed Days:** `TotalTicks / 4`
*   **Current Period:** `TotalTicks % 4`

The absolute calendar date in-game at any given moment is resolved only at the time of visual emission, adding the `Elapsed Days` to the `StartDate` (e.g., Jan 1, 1836) configured in the initial room.

### The Loop Goroutine
Whenever a match receives the "Play" command, the server launches an **isolated Goroutine** instantiating a `time.Ticker`. The firing frequency (game speed) is defined by the Room's `Speed` attribute:
*   *Practical example:* `Speed 1` could mean 1 tick every real second. (1 in-game day takes 4 seconds).
*   *Practical example:* `Speed 5` (very fast) could mean 1 tick every 100ms. (1 in-game day takes 0.4 seconds).

Whenever the *Ticker* hits the loop channel, the Engine increments the counters, recalculates necessary secondary logic for that day, formats and serializes a JSON payload in O(1), and dispatches it to the *Broadcast Channel*.

### The Pause State and Manual Commands
The architecture dictates that the game is pauseable without destroying the in-memory simulation.
*   When a Pause command is fired by the HOST, an internal `IsPaused` flag in `GameSession` is activated.
*   The Loop Goroutine **is not terminated**. It keeps listening to its active channels but intentionally skips the routine that increments the passage of time and the recalculation of Tick logic.
*   **The benefit:** In *Industrial Era* games, players spend a lot of time with the game paused issuing commands (building factories, managing diplomacy, and delegating orders to armies). The architecture separates the temporal simulation from these punctual events: while the clock Goroutine suspends the passage of Ticks, the players' immediate actions travel asynchronously through the State WebSocket (independent), updating memory and being processed without depending on the time simulation iterating.

## 4. Phase-Based WebSocket Architecture (Triple-WebSocket Design)

To cleanly separate the "Pre-Game" lobby logic from the intensive "In-Game" simulation, *The Map Game* employs a **Triple-WebSocket Architecture**, split into two entirely separate Go packages: `room_ws` and `game_ws`. This ensures that game engine resources are only instantiated when a match officially starts, and that lobby communication remains strictly isolated from heavy simulation traffic.

### Phase 1: The Lobby (Pre-Game) via `room_ws`
When players join a room, they connect **only** to the **Lobby WebSocket (`/ws/rooms/:uuid/lobby`)**. The simulation engine is completely unaware of these connections.
*   **Responsibilities:** 
    *   Chat, Player Lists, and enforcing the Room's `MaxPlayers` limit.
    *   **Country Selection & Ready System:** Players claim their `country_id`. Doing so automatically toggles their "Ready" status to `true`.
    *   **Game Start:** The HOST can only trigger the "Start Game" command when all connected guests are "Ready" and have selected a country.
*   **Events Mapped:**
    *   *Inbound:* `select_country`, `start_game`.
    *   *Outbound:* `players_update`, `room_closed`, `game_started`.
*   **Abandonment Rules:** If a player disconnects or leaves during this phase, their record is permanently deleted from the room's database, freeing up their slot and their selected country.

### Phase 2: The Simulation (In-Game) via `game_ws`
Once the HOST fires the "Start Game" command, the server updates the room status to `PLAYING`, bootstraps the `GameSession` in RAM, and broadcasts a `game_started` event via the lobby channel. At this point, the frontend **disconnects from the lobby** and connects to the **two Game Engine WebSockets** handled by the `game_ws` package.

#### 4.1. The Actions and State WebSocket (`/ws/rooms/:uuid/state`)
Dedicated to asynchronous interaction, player orders, and diplomacy.
*   **Flow:** Bidirectional (Client <-> Server).
*   **Responsibilities:** Process diplomacy (wars, alliances), static building orders, moving armies, and Pausing/Playing the game.
*   **Events Mapped:**
    *   *Inbound:* `action` (Play/Pause speed controls).
    *   *Outbound:* `state_action_ack`.
*   **Behavior:** Operates completely autonomously in relation to the clock. Players interact intensely with this channel even during "Pause", receiving instantaneous responses.

#### 4.2. The Simulation WebSocket (`/ws/rooms/:uuid/tick`)
Dedicated strictly to events tied to the advancement of time (high frequency).
*   **Flow:** Mostly Unidirectional (Server -> Client).
*   **Responsibilities:** Transmit the match clock (`game_tick`), macroeconomic calculations (pops, industries), and the delta of continuous troop movement across the map.
*   **Events Mapped:**
    *   *Inbound:* None (Read operations are ignored).
    *   *Outbound:* `game_tick` (containing absolute date, period, speed, and pause state).
*   **Behavior:** Goes "dormant" when the room is paused by the HOST. When active, continuously emits the state transformations dependent on flowing time.

### In-Game Abandonment and Reconnection
During Phase 2, the abandonment rules change drastically:
*   If a player disconnects (closes the browser or internet drops), **they are NOT deleted from the database**. 
*   Their `country_id` and progress remain intact. The server broadcasts via `room_ws` that the player is "Offline", and their country either sits idle or is taken over by a fallback AI.
*   When the player reconnects, the server recognizes their `user_id` and `room_id`, restores their session, and immediately synchronizes the current in-memory game state so they can resume playing seamlessly.

## 5. Next Modules (Architectural Vision)

Following this design, future game expansions will attach their math tied to the *Tick* cadence:
*   **Military System (Micro-Ticks):** Since armies take multiple day phases to cross provinces, the `%` movement progress will advance in fractions throughout the Afternoon and Morning of each generated sub-tick.
*   **Pop Economy (Macro-Ticks / Commercial Month):** Extreme rules (international trade, industrial calculation, and class migration flow) are heavy on processing. To shield the Engine, the game adopts the concept of a "Commercial Month" (where every month has exactly 30 days, common in the *Grand Strategy* genre).
    *   Since 1 Month = 30 days = 120 Ticks, the Engine fires the heavy economic closing triggers only on a purely mathematical check: `if (TotalTicks + 1) % 120 == 0`.
    *   This trigger happens exactly in the last phase (Late Night) of the 30th day of each month, operating in the same Game Loop flow. It calculates migrations, sends the robust deltas via WebSocket, and continues continuous execution, abolishing the need for parallel cronjobs or complex checks on native calendar APIs.

## 6. State Export and Save Games

For *The Map Game* matches to be interrupted and continued later, the Engine needs to transcribe its state contained entirely in RAM (TotalTicks, Populations, Economy, Military Positions) back to disk. 

Given the multiplayer nature of the system and the high-performance tools already embedded in the project's ecosystem (like the map parsing pipeline), the chosen architecture for Save Games will be the **Binary Snapshot (MsgPack + Zstd)**.

### The Binary Snapshot Flow
Since the project uses `vmihailenco/msgpack/v5` and `zstd` compression algorithms, saving the state follows the maximum performance route:
1.  **Serialization:** The global `GameSession` *struct* is packed into **MessagePack** (an extremely dense, fast binary format natively supported by Go).
2.  **Compression:** The resulting binary buffer passes through the `zstd` algorithm to shrink the file size to a fraction of the original.
3.  **Persistence:** The resulting BLOB is saved directly into an SQLite database column (e.g., in the `save_data BLOB` column of the `Room` table) or written natively to a `.sav` file on disk.

### Benefits of the Chosen Architecture
*   **Performance (Zero-Lag):** Saving and loading a match with millions of entities (Populations, Soldiers, and Factories) occurs instantly. By avoiding the standard `encoding/json` package, the CPU and RAM don't experience freezing spikes on the server during *Auto-Save* cycles, ensuring game fluidity in advanced stages (*late-game*).
*   **Smart Storage:** The space consumption in the SQLite database (or on disk) is minimal. This is ideal for sustaining the state of dozens of simultaneous rooms on low-cost Cloud servers without filling up the disk.
*   **Integrity and Anti-Cheat:** Unlike plain text saves (JSON), which invite *Save Editing*, the structure encoded in MsgPack and compressed in Zstd makes it almost completely unfeasible for clients to read with the naked eye and cheat by editing their country's attributes.
