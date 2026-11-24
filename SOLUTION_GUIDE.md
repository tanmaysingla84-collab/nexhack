# Comprehensive Solution: Dynamic Campus Ride Pooling (NexHack 2.0)

## Problem Background & Core Challenge
Campus travel demand fluctuates dramatically as classes break, library sessions end, and hostel students commute to academic blocks. Static routes waste seat capacity during quiet hours and cause massive student queues during peaks. However, continuously altering routes for new bookings can inconvenience passengers already on board.

This system provides an **autonomous dynamic pooling orchestrator** that solves all 6 competition challenges:

---

### Challenge 1: Match Requests Dynamically
- **Mechanism:** Implements an algorithmic **Greedy Insertion Heuristic with Marginal Cost Optimization**:
  $$\text{Marginal Cost} = \Delta \text{Vehicle Distance} + 0.5 \times \Delta \text{Passenger Wait Time}$$
- Incoming bookings try every valid insertion position ($i$ for pickup, $j \ge i$ for dropoff) across all active shuttles.
- Ensures requests arriving within class-dismissal bursts are grouped together without exceeding vehicle capacity ($4$ seats).

### Challenge 2: Protect Existing Commitments
- **Feasibility Invariant:** For EVERY passenger already assigned or currently onboard:
  $$\text{Actual Ride Time} \le \text{Direct Travel Time} \times \text{MaxDetourFactor (1.5x)}$$
- Onboard passengers are **never** dropped unplanned or subjected to detour times exceeding their mathematical bound.
- If an insertion would delay an onboard rider past their limit, the candidate insertion is rejected.

### Challenge 3: Respond to Disruptions Live
- **Rider Cancellation:** The vehicle stops sequence is pruned, re-optimized, and freed capacity is made available to pending rides.
- **Vehicle Out-of-Service / Breakdown:** Onboard riders are safely deboarded at the nearest station with an explicit explanation; unpicked passengers are returned to the pool and re-dispatched to other shuttles.
- **Road Closures:** Dijkstra matrix immediately updates; vehicles re-route around the closed road or log explicit unservable explanations if disconnected.

### Challenge 4: Explain Unmet Demand (Zero Silent Drops)
- Every rejected ride receives an explicit structured error code:
  - `CAPACITY_EXCEEDED`: Peak seat load along route would exceed limit.
  - `PICKUP_WINDOW_INFEASIBLE`: Shuttle ETA exceeds promised pickup window.
  - `DETOUR_LIMIT_BREACH`: Would add delay to an existing onboard passenger exceeding their bound.
  - `NO_ROUTE_AVAILABLE`: Road closed, no reachable graph path.
  - `NO_VEHICLE_AVAILABLE`: All shuttles offline or broken.
- **Near-Miss Auditing:** Captures the closest shuttle and the exact constraint failure (e.g., *"Shuttle V1 had 2 free seats but would delay Rider R14 by 7.2 min, breaching their 6.0 min detour limit"*).

### Challenge 5: Visualize the Service
- High-performance Leaflet map with OpenStreetMap tiles (100% free, zero watermarks).
- Displays animated shuttle markers with live seat occupancy badges (`2/4`), route polylines, numbered pickup/dropoff stops, and pulsing waiting riders.
- Interactive vehicle manifest popups displaying passenger lists and real-time ETAs.

### Challenge 6: Compare Travel Outcomes (Shared vs. Solo)
- Headless comparative simulation executing identical request streams across `pool` and `solo` modes.
- Evaluates:
  1. Fleet distance traveled (minutes)
  2. Average and $p95$ passenger wait times
  3. Number of missed/rejected pickups
  4. Seat utilization percentage
  5. Service coverage percentage
