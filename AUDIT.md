# Comprehensive Architecture & Gap Audit: CampusPool OS

## 1. Project Overview & Existing Assets
- **Domain:** Campus Solutions: Dynamic Campus Ride Pooling (NexHack 2.0, Problem #10).
- **Current Stack:** 
  - Frontend: React 19 + Vite 8 + Leaflet + Chart.js.
  - Simulation Engine: ES modules in `/src/engine` (`graph.js`, `dispatcher.js`, `engine.js`, `models.js`, `scenario.js`).
  - Topology Data: `/data/campus.json` with 20 real campus blueprint nodes and 31 bidirectional edges.
  - Tests: Node.js test runner in `/tests/engine.test.js`.

---

## 2. Problem Statement Requirements Mapping

| Requirement | Current Status | Analysis & Existing Files | Action for Complete Solution |
| :--- | :---: | :--- | :--- |
| **1. Match requests dynamically** | **Partial** | Greedy insertion implemented in `/src/engine/dispatcher.js`, but ran entirely client-side in the browser. No shared backend server or multi-client sync. | Move and enhance engine into a full backend server with periodic batching option, lowest marginal cost function ($ \Delta\text{distance} + \alpha \Delta\text{wait} $). |
| **2. Protect existing commitments** | **Partial** | Checks pickup window and promised dropoff, but lacks explicit parameterized $ \text{direct} \times \text{maxDetourFactor} $ calculation and per-rider detour monitoring. | Formalize exact detour factor constraint ($ \text{rideTime} \le \text{directTime} \times \text{maxDetourFactor} $). Ensure onboard passengers never get worsened beyond limit. |
| **3. Respond to disruptions** | **Partial** | Basic cancellation and vehicle break exist, but lack reassignment of remaining legs of onboard passengers to other vehicles, or structured `NO_ROUTE_AVAILABLE` fallback. | Implement full disruption handlers: vehicle out-of-service reassigns partial journeys; road closures reroute or re-pool affected rides with audit log reasons. |
| **4. Explain unmet demand** | **Partial** | Reasons captured, but need exact standardized codes: `CAPACITY_EXCEEDED`, `PICKUP_WINDOW_INFEASIBLE`, `DETOUR_LIMIT_BREACH`, `NO_ROUTE_AVAILABLE`, `NO_VEHICLE_AVAILABLE`, plus nearest near-miss delta recording. | Implement strict reason codes and structured near-miss candidate analysis (which vehicle, seat load, extra minutes exceeded). |
| **5. Visualize the service** | **Partial** | Leaflet map displays nodes and markers, but lacks animated passenger journey highlights, vehicle manifest inspection modals, and live WebSocket streaming. | Implement full Leaflet layer with polyline routes, stop badges, passenger manifest popups, and WebSocket real-time updates. |
| **6. Compare travel outcomes** | **Partial** | Client-side comparison existed in modal, but needs p95 wait time, seat utilization, full live side-by-side feed, and headless comparative execution. | Standardize headless `solo` vs `pool` comparison computing total distance, avg & p95 wait, missed pickups, seat utilization, and served %. |

---

## 3. Technology Stack Choice & Justification
- **Decision:** Keep and upgrade the existing **Node.js (Backend) + Express + WebSocket (`ws`) + React (Frontend with Vite) + Leaflet**.
- **Justification:** Node.js runs the deterministic simulation engine natively for both headless CLI test suites and the live HTTP/WebSocket backend server. React provides reactive state bindings for the 7 Admin Portal views and Rider app without unnecessary framework rewrites.

---

## 4. Reused vs Replaced Components

### Reused:
- **Campus Topology (`/data/campus.json`):** 20 blueprint nodes and 31 edges accurately representing the campus layout.
- **Graph Mathematics (`/src/engine/graph.js`):** Dijkstra all-pairs shortest path and edge toggling algorithm.
- **Mulberry32 PRNG (`/src/engine/models.js`):** Deterministic random generation.
- **Styling Foundation (`/styles/main.css`, `/styles/rapido.css`, `/styles/login.css`):** Geeta University Saffron & Deep Blue color scheme.

### Replaced / Rebuilt:
- **Backend Architecture:** Build a dedicated Express + WebSocket server (`/server/index.js`, `/server/engine.js`, `/server/routes.js`) providing real REST endpoints and instant push broadcasts.
- **Engine Dispatcher:** Refactor constraint checks into exact mathematical formulas ($ \text{rideTime} \le \text{directTime} \times \text{maxDetourFactor} $) with structured constraint telemetry.
- **Admin Portal:** Expand into 7 distinct functional views (Live operations, Fleet management, Requests table, Disruption controls, Configuration, Analytics, Audit log) plus Rider booking view.
- **Automated Integration Tests:** Comprehensive headless test suite asserting zero commitment violations and zero silent drops.
