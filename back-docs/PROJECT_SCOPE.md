 🗺️ The Map Game - Game Design & Project Scope

This document consolidates all the agreed-upon architectural design definitions and decisions. It serves as the fundamental guide for the game's development.

> **Additional Documentation:**
> * See **[API_ROUTES.md](./API_ROUTES.md)** for REST endpoint contracts and WebSocket routes.
> * See **[ARCHITECTURE.md](./ARCHITECTURE.md)** to understand the server layers, SQLite database flow, and concurrency architecture.

---

## 1. Overview
* **Working Title:** The Map Game
* **Era/Theme:** Industrial / Victorian Era (1836 - 1936).
* **Pitch:** "Lead your nation through industrialization and expansion in a real-time game of online diplomacy, warfare, and economic disputes."
* **Match Scope:** 
  * Short/medium sessions (between 1.5 to 3 hours).
  * Public/private lobbies for 1 to 20 simultaneous players.
  * Time will be modular: the room can set different duration scenarios (e.g., short 20-year campaigns or full 100-year campaigns) and game speeds.
* **Victory Condition:** Accumulation of Score based on 3 pillars: **Industrial Power, Military Power, and Prestige**, tallied at the end of the stipulated scenario time.

## 2. Core Mechanics (Core Loop)

### Populations (Pops) and Economy
* Heavily inspired by *Victoria 2*, but optimized for shorter sessions.
* **Pops:** Each province has populations grouped by two keys for server optimization: `[Profession, Culture]`. (Religion was removed from the initial scope to simplify logic in short matches).
* **Global Market and Social Mobility:** There is a resource market affected by supply/demand and with stockpiles per country. The transition of a Pop's profession (e.g., Farmer to Craftsman) occurs on the **Economic/Monthly Tick**, primarily influenced by factory needs, profitability, and wages.

### Research and Technology
* Unlike the classic "tech tree", the player **does not manually research technologies**.
* Players invest in **National Focuses**.
* Each cycle, there is a "dice roll" based on the amount of intellectuals/focused Pops. If successful, a random technology from that Focus scope is discovered, and players receive a Notification (Pop-up/Newspaper), which can strongly impact the country's progress.

### War and Combat
* The map is divided into Provinces (via Bitmap image and Parsing in Go).
* Army movement is not instantaneous. Armies take multiple *ticks* to cross provinces, depending on size, terrain, and unit composition.
* **Combats:** Last for multiple continuous ticks. While combat is happening, players on both sides can send and receive reinforcements from adjacent provinces until one side retreats or is mathematically defeated.
* **Fog of War:** Limited vision. A country only sees what is within the radius of its units/provinces. This vision is **shared among members of the same Alliance**.

### Diplomacy
* Initially encompasses: Alliances (which grant shared map vision and military cooperation), Wars, Trade Agreements, Vassal States, and Granting Military Access.

## 3. Technical and Server Architecture

The architecture uses the **State-Based Authoritative Server** philosophy.

### Tech Stack
* **Frontend:** TypeScript, Vite, DOM-based UI, and Graphics Engine using **Three.js**.
* **Backend:** Go (Golang) running as the Central Game State Server, WebSocket, and Map Logic Parser.

### Graphical vs Server Responsibility
* The Server (Go) **never calculates 3D coordinates**. It works with integers, provinces, and relative distances in percentages (`e.g., Army_A from province 10 to 15, progress: 50%`).
* The Client (Three.js) is responsible for reading this data and **visually interpolating**, moving and animating the 3D model in the UI.

### Networking System and Deltas
* To prevent network flooding, the Go Backend will send the Full State only when the user connects. From then on, it will emit **only the Deltas** (the changes).
* **Fog of War Filter:** Go calculates Alliance-Based Vision and emits customized Deltas for each player. *(Technical note: Calculating graph adjacencies per player on a Go server has negligible overhead. It is entirely viable for a scope of up to 20 to 50 simultaneous players).*

### The Server Loop (Multi-Tick)
The main loop (Game Loop) in Go will be divided to support performance and simulation:
1. **Movement/War Tick:** Frequent (e.g., 2 to 10 times per real-time second). Responsible for army progress on the map and damage calculations.
2. **Economic/Monthly Tick:** Infrequent (e.g., every 30~60 real-time seconds). Responsible for recalculating Populations, processing the Global supply/demand Market, and triggering Technology discovery checks.

## 4. Minimum Viable Product (MVP)

The first structural foundation (immediate development focus) will cover the core layer upon which everything else will flourish:
1. **Passage of Time and Session:** Server setup where time passes (from 1836 to 1936) via a central clock.
2. **Lobby System:** Players connecting to a WebSocket room, synchronized country selection.
3. **Core Sync loop:** Go <-> TypeScript connection exchanging basic State JSON payloads.
4. **Base Event Broadcast:** The server pushing vital time-advance information to the front-end and receiving connection acknowledgments.

From this stable MVP, we will stack the map graphical modules, troop movement, and the Pops Market engine.

## 5. Backlog and Future Optimizations

* **~~Preventing Cache Stampede (Dogpile Effect) in Map Parsing:~~ (COMPLETED)** 
  * *Previous Status:* On-demand map parser loading had a vulnerability of triggering heavy processing dozens of times if several players opened the room on the exact same millisecond.
  * *Implemented Solution:* Use of a **Mutex-protected Memory Cache** in the `MapService`. Now the brutal parsing of graphical files and transformations only occurs on the first entry (then saved in zstd, packed in msgpack, compressed in gzip), shielding the server CPU and RAM against twin spikes of simultaneous requests.

---
*This document is a living guide and will be complemented with specific API or struct documentation as the code advances.*
