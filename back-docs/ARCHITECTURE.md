# Backend Architecture

> **Language Policy:** All documentation for this project must be written and maintained in **English**.

The backend of *The Map Game* is designed with a focus on severe concurrency (WebSockets), low coupling, and resilience (propagated contexts and strong database control).

## 1. Design Patterns (Clean/Layered Architecture)

The application is segmented by functional domain (also known as *Package by Feature*). The rules for each block are located in folders under `internal/` (e.g., `auth`, `room`, `map`, `room_ws`).

Each module strictly follows a unidirectional flow:
**Controller -> Service -> Repository**

*   **Controller:** Responsible for interacting with the transport layer (HTTP/Gin or WebSocket Connection). Handles *JSON bindings*, cookies, URL parameters, and fires formatted responses (`apperr`).
*   **Service:** The heart of the domain. Isolates pure business rules (e.g., password validation, map parser orchestration). This layer should not care about which database driver is running.
*   **Repository:** Actually executes SQL commands and queries using the standard `database/sql` package to communicate with the database.

## 2. Context Propagation and Database

To avoid zombie resource consumption in timeout events, connection loss, or frontend aborts, the entire flow of SQL queries and transactions receives the **Request Context**.

*   *Repositories* require `ctx context.Context` in execution methods (`QueryRowContext`, `ExecContext`, `BeginTx`).
*   Handlers intercept `c.Request.Context()` and inject it at the top of the hierarchy, allowing safe cancellations even for dense ongoing transactions.

**Database Stack:**
*   The application uses `github.com/glebarez/go-sqlite` (pure SQLite in Go, without CGO), which allows for easy cross-compilation and execution without the need to instantiate separate databases.
*   The database is initialized by explicitly enabling **WAL** (Write-Ahead Logging) for massive parallel performance gains, and the *Foreign Keys* PRAGMA is always enabled locally in each newly instantiated connection.

## 3. Map Structure and Parsing Pipeline

Cartographic manipulation in *The Map Game* is not in real-time for the graphics; the graphics are processed asynchronously by the Client. The server acts as an emitter, analyzer, and source of truth. The core of this logic is located in the `backend/internal/parser` package.

### 3.1. Input Formats and Pipeline Flow
The parsing pipeline begins with a compressed archive (typically Zstd stored in SQLite) or a local directory (like `backend/data/map`) containing the raw map files. The `parser.RunPipeline` function extracts and processes these files. The engine is heavily inspired by Grand Strategy (Paradox-style) mapping structures and expects the following formats:

*   **`provinces.bmp` (or `.png`)**: A flat, uncompressed 24-bit bitmap where every unique pixel color represents a different province. While the backend reads the uncompressed `.bmp` (which is ideal for pixel-perfect 1:1 reading), serving a massive `.bmp` over the web to a Three.js client is terrible for bandwidth. Therefore, the parser **automatically converts the `.bmp` buffer into a highly compressed `.png`** during the pipeline. It is this generated `.png` that is exposed to the frontend via the API.
*   **`definitions.json` (or `definition.csv`)**: Maps the exact RGB colors found in the `provinces` image to their respective Province IDs, along with province names, terrain types, and adjacency lists. The parser supports both JSON and the legacy Paradox `.csv` format.
*   **`terrain.bmp` & `terrain.json`**: An indexed color image where each palette index maps to a specific terrain category (mountains, plains, ocean). Similar to provinces, it's converted to `.png` for the web client. The `.json` file dictates the palette override logic.
*   **`default.map`**: A plain text configuration file (often holding `max_provinces`, `sea_starts`, and pointers to the file names).
*   **`regions.json` & `continents.json`**: Optional configurations mapping arrays of province IDs into macro-groupings.

### 3.2. Output Format and Handlers
Once the pipeline finishes reading the images and JSONs, it generates a comprehensive `ParsedMapData` struct. 
During this process, the engine iterates through every pixel of the `provinces.png` to build an **`IdBuffer`** (a flattened binary array of `uint16` mapping each pixel to a Province ID). It also calculates statistics like bounding boxes (`minX, minY, maxX, maxY`) and center points (`sumX, sumY`) for each province.

To deliver this massive object to the handlers (and subsequently the frontend) without destroying the network or JSON encoders, the output is serialized into **MsgPack** (a highly efficient binary format) and then compressed using **Gzip**.

### 3.3. Frontend Consumption
The frontend needs these files entirely upon connecting to the room for several critical reasons:
*   **Static Images (`provinces.png`, `terrain.png`)**: Required by the Three.js/WebGL engine to draw the visual map, shaders, and terrain textures.
*   **The Parsed MsgPack Payload**: The frontend relies on the `IdBuffer` to enable pixel-perfect interaction (knowing exactly which province the user clicked or hovered over on the 3D canvas). Furthermore, it needs the `stats` (bounding boxes and centroids) to accurately position 3D models (armies, cities) and text labels on the map without having to do the heavy mathematical calculations on the browser thread.

To combat massive bottlenecks (the infamous Dogpile Effect) when multiple users join simultaneously, the `MapService` handles data parsing behind a **Mutex-Based Global Cache**. The map is translated once and cached globally per **Map ID** (rather than per Room). Since the maps are static and each compressed MapCache uses less than 10MB of RAM, sharing the same `IdBuffer` and static files (`provinces.png`) across all rooms playing the same map is highly efficient. The parsed result then lives in the server's RAM as a *Static Cache* for the application's lifetime, drastically reducing CPU overhead and I/O.

## 4. The Heart of WebSockets (Triple-Package Architecture)

The application uses asynchronous Go channels connected to *Hubs* and *Managers*. The main communication between Client and Engine in the rooms happens through three distinct domain packages, strictly isolating the lifecycle phases of a player:

*   **Global Lobby (`lobby_ws`)**: Responsible for orchestrating the global game list (`/ws/lobby`). Operates autonomously, doing background sweeps to show which rooms are available to join without tying up the main thread.
*   **Pre-Game Room Lobby (`room_ws`)**: Responsible for the pre-game phase (`/ws/rooms/:uuid/lobby`). Connects directly to the relational database to allow players to claim countries and set their ready status before the engine is booted.
*   **Game Engine (`game_ws`)**: Booted only when the game starts. It exposes a **Dual-WebSocket** pattern for the running simulation:
    *   **Actions / State WebSocket (`/state`)**: Dedicated to continuous bidirectional interaction (e.g., player commands, chat, diplomacy, pause). Operates independently of the clock, processing interactions even with the simulation suspended in memory.
    *   **Simulation / Tick WebSocket (`/tick`)**: Dedicated to events tied to the advancement of time (high frequency). Emits unidirectionally to the clients the transformations dependent on the clock (economy, pop, movement). It goes dormant when the game is paused.

## 5. Security & Authentication

*The Map Game* adopts a strict zero-trust approach for all private routes and game sessions, driven by standard JSON Web Tokens (JWT) but secured through modern transport rules.

### 5.1. Stateless JWT & HttpOnly Cookies
Authentication is entirely stateless. Upon a successful login (`/api/auth/login`), the server generates a JWT containing the user's basic claims (ID, email). 
Crucially, this token is injected directly into the client's browser as an **`HttpOnly` Cookie** named `auth_token`.

*   **Why HttpOnly:** By forbidding JavaScript (`document.cookie`) from reading the token, the application is fundamentally protected against Cross-Site Scripting (XSS) attacks aiming to steal credentials.
*   **Standard Headers Fallback:** For server-to-server or non-browser API interactions, the standard `Authorization: Bearer <token>` header is also fully supported by the authentication middleware.

### 5.2. WebSocket Security Commitments
Historically, WebSockets cannot accept custom HTTP Headers (like `Authorization`) during the native browser `Upgrade` handshake. A common, yet insecure, workaround is passing the token via the URL query string (e.g., `ws://...?token=123`).

**This practice is strictly prohibited in this architecture.**
*   Tokens in URLs are actively leaked in server access logs (Nginx/Traefik), browser histories, and proxy caches.
*   Instead, the native browser behavior automatically includes Cookies during the WebSocket handshake. The backend controllers for `tick_ws` and `state_ws` are designed to mandatorily intercept the request, read the `auth_token` cookie, and validate the signature *before* upgrading the connection. If the cookie is missing or invalid, the upgrade is rejected with a `401 Unauthorized`.
