# CampusPool OS - Dynamic Campus Ride Pooling
**NexHack 2.0 Hackathon Solution (Problem #10: Campus Solutions)**

An intelligent, autonomous campus ride-pooling service that algorithmically pools changing passenger requests into shared trips while strictly enforcing seat capacity limits, promised pickup windows, passenger detour limits, and zero silent drops.

---

## 1. Quick Start (3 Commands or Fewer)

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Start Frontend & Backend Concurrently
npm run start
```
* **Frontend UI & Map:** [http://localhost:3000](http://localhost:3000)
* **Backend REST API & WebSockets:** [http://localhost:3001](http://localhost:3001)

---

## 2. Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                            CLIENT LAYER (React 19 + Vite)                         |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Modern Login Page  |  | Rapido Ride Booker   |  | Interactive Leaflet Map   |  |
|  | (Student/Admin/Cap)|  | & GPS Tracker        |  | (OSM Tiles, Manifests)    |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|                         +-----------------------------------+                     |
|                         | 7-Tab Admin Operations Portal     |                     |
|                         +-----------------------------------+                     |
+------------------------------------------^----------------------------------------+
                                           | WebSocket (ws://) & REST (/api)
+------------------------------------------v----------------------------------------+
|                          BACKEND SERVER (Express + WS)                            |
|  +---------------------+  +------------------------+  +------------------------+  |
|  | /api/requests       |  | /api/vehicles/:id/break|  | /api/roads/:id/toggle  |  |
|  | /api/simulation     |  | /api/comparison        |  | WebSocket Broadcast   |  |
|  +---------------------+  +------------------------+  +------------------------+  |
+------------------------------------------^----------------------------------------+
                                           |
+------------------------------------------v----------------------------------------+
|                      CORE DISPATCH & SIMULATION ENGINE                            |
|  +---------------------+  +------------------------+  +------------------------+  |
|  | Campus Graph (20    |  | Greedy Marginal Cost   |  | Live Disruptions       |  |
|  | Blueprint Nodes, 31 |  | Dispatcher             |  | (Reroute, Deboard,     |  |
|  | Weighted Edges)     |  | (Detour & Cap Guards)  |  | Reassign, Redispatch)  |  |
|  +---------------------+  +------------------------+  +------------------------+  |
|  +---------------------+  +------------------------+  +------------------------+  |
|  | Mulberry32 PRNG     |  | Zero Silent Drops      |  | Headless Solo vs Pool  |  |
|  | Deterministic Seed  |  | Reason Explainer       |  | Comparator             |  |
|  +---------------------+  +------------------------+  +------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Algorithm & Constraints Enforced

### Dynamic Greedy Insertion Heuristic
For every incoming request, the dispatcher tests inserting the pickup at stop index $i$ and dropoff at index $j \ge i$ across all active shuttles. The candidate with the **lowest marginal cost** is selected:
$$\text{Cost} = \Delta \text{Distance} + 0.5 \times \text{Added Passenger Wait}$$

### Invariant Constraints:
1. **Seat Capacity Limit:** At no point along the route may seat occupancy exceed vehicle capacity ($4$ seats).
2. **Promised Pickup Window:** Vehicle pickup arrival must occur within $[t_\text{request}, t_\text{request} + \text{windowMin}]$.
3. **Commitment Protection:** For every passenger already assigned or onboard, their dropoff arrival time must respect:
   $$\text{RideTime} \le \text{DirectTime} \times \text{MaxDetourFactor}$$
   Onboard passengers are **never** dropped or delayed past their detour limit.
4. **Road Connectivity:** Routes traverse only open roads; closed road segments are completely excluded.

### Explainable Rejections (Zero Silent Drops):
When a ride cannot be placed, an explicit structured reason code is generated:
* `CAPACITY_EXCEEDED`: Peak route load would surpass seating limit.
* `PICKUP_WINDOW_INFEASIBLE`: Shuttle ETA arrives past promised window.
* `DETOUR_LIMIT_BREACH`: Inserting the stop would delay an existing rider past their detour allowance.
* `NO_ROUTE_AVAILABLE`: Destination cut off due to road closures.
* `NO_VEHICLE_AVAILABLE`: All shuttles are broken or offline.

---

## 4. Demo Login Credentials

| Role | Username / ID | Password / Access | Description |
| :--- | :--- | :--- | :--- |
| **Student (Tagore Hall)** | `GU24-CSE-1042` | Any / 1-Click Fast Access | Student Rider booking trips across campus. |
| **Student (Gargi Hall)** | `GU24-PHARM-203` | Any / 1-Click Fast Access | Pharmacy Student profile. |
| **Shuttle Captain** | `GU-V1-DRIVER` | Any / 1-Click Fast Access | Driver view of active route manifests and stops. |
| **Transport Admin** | `GU-ADMIN-01` | Any / 1-Click Fast Access | Full 7-tab operations, disruptions, and analytics. |

---

## 5. Scripted 7-Step Demo Runner

Click **"✨ Run Demo"** in the top header to run through the presentation sequence:
1. **Morning Baseline:** Shuttles V1, V2, and V3 circulating between hubs with zero rider load.
2. **Class-Ends Pooling:** Multiple student bookings arrive simultaneously; Shuttle V1 pools them together.
3. **Detour Breach Protection:** Demonstrates an unservable booking being rejected with exact delay minutes to protect onboard riders.
4. **Capacity Rejection:** Group booking of 4 seats rejected when seats are full.
5. **Mid-Trip Cancellation:** Rider cancels; vehicle route instantly shrinks and downstream ETAs update.
6. **Live Road Closure & Breakdown:** Road closes and Shuttle V2 breaks down; passengers are safely deboarded and rerouted.
7. **Head-to-Head Report:** Modal displays honest side-by-side metrics ($p95$ wait, distance, missed pickups, seat utilization).
