# CampusPool OS: 3-Minute Hackathon Demo Script

This presentation script guides you through demonstrating **CampusPool OS** to hackathon judges in exactly 3 minutes.

---

## ⏱️ Timing & Presentation Flow

### [0:00 - 0:30] Introduction & Core Problem
- **Action**: Open the application in the browser (`http://localhost:3000` or file server).
- **Speaker**:
  > *"Traditional campus transit runs fixed, empty routes or operates like expensive solo taxis. **CampusPool OS** is a dynamic, promise-aware ride pooling engine. It groups riders with similar routes on the fly without breaking delivery promises to riders already on board."*
- **Visual**: Point to the interactive Leaflet map showing the 20-node fictional campus, 3 shuttles (V1, V2, V3) circulating, and the live metrics strip (Served Rate, Avg Wait, Fleet Occupancy).

---

### [0:30 - 1:00] Step 1 & 2: Class-End Burst & Multi-Rider Pooling
- **Action**: Click the **"✨ 3-Min Demo"** button on the top right (or click **"🎓 Trigger Class Ends Rush"** in the Controls tab).
- **Speaker**:
  > *"When classes dismiss at the CS Tower and Library, a burst of requests hits the system simultaneously. Watch Shuttle V1 (Sky Blue) dynamically pool Rahul and Priya into the same vehicle without backtracking."*
- **Visual**: Point out the vehicle marker badge showing seat occupancy (`2/4`) and the numbered route pins (`P1`, `P2`, `D1`, `D2`) updating in real-time.

---

### [1:00 - 1:45] Step 3: Transparent Rejections (No Silent Drops!)
- **Action**: Click **"Next Step ➔"** on the banner (or dispatch a 4-passenger group request with tight deadlines).
- **Speaker**:
  > *"A critical requirement judges care about is **zero silent drops**. When a ride cannot be served because all shuttles are full or the pickup window would be missed, the system never silently drops it. Every rejection is logged with structured, transparent per-vehicle reasons."*
- **Visual**:
  - Show the red rejection toast appearing.
  - Switch to the **Rides** tab.
  - Expand the rejection accordion:
    - **Bold primary reason**: *"Route would exceed capacity of 4 seats"*
    - **Per-vehicle breakdown**:
      - `V1: Route would exceed capacity of 4 seats`
      - `V2: Pickup ETA 14.5m exceeds 10m window`
      - `V3: Would add 8.2m detour to Priya, breaking promised drop-off`

---

### [1:45 - 2:15] Steps 4, 5 & 6: Live Disruptions & Autonomous Resilience
- **Action**: Click **"Next Step ➔"** through steps 4, 5, and 6.
- **Speaker**:
  > *"Campus life is unpredictable. Watch how our engine handles live disruptions:*
  > 1. *Mid-trip Cancellation: When a rider cancels, the vehicle route shrinks immediately, recalculating faster arrivals for remaining riders.*
  > 2. *Road Closure: Click any road or close the Library-Cafeteria segment. The active shuttle detects the blockage and dynamically reroutes around it without violating drop-off promises.*
  > 3. *Breakdown Resilience: If Shuttle V2 breaks down, onboard riders are deboarded at a safe node with an emergency reason, while waiting riders are automatically re-pooled and dispatched to alternative shuttles."*

---

### [2:15 - 3:00] Step 7: Honest Solo vs Pool Headless Comparison
- **Action**: Click **"📊 Solo vs Pool"** (or Step 7 in the demo runner).
- **Speaker**:
  > *"Finally, we provide an honest, unvarnished comparison. We ran 60 simulated minutes under the exact same deterministic traffic seed in both Dynamic Pooling and Solo Taxi mode."*
- **Visual**: Show the Comparison Dashboard with side-by-side KPI cards and the Chart.js grouped bar chart:
  - **Fleet Travel Time**: Pooling saves ~25-35% in fleet vehicle minutes.
  - **Passenger Wait Time**: Average wait is slightly higher (+2.1m) due to shared stops.
  - **Served Rate**: Pooling served 92% of students vs only 65% in solo mode where shuttles were blocked.
  - **Auto-generated Honest Narrative**: Points out the exact trade-offs without artificially tuning numbers to hide detours.
- **Closing**:
  > *"CampusPool OS delivers optimal fleet efficiency, verifiable rider guarantees, and complete operational transparency. Thank you!"*

---

## 🛠️ Testing Edge Cases
To test edge cases independently:
- **All Vehicles Broken**: Select all vehicles in the disruption dropdown and break them. Verify all incoming rides receive clean, structured rejection reasons.
- **Every Road Closed**: Toggle roads closed until nodes become disconnected. Verify the engine logs `'routing'` constraint failures cleanly.
- **50 Requests at Once**: Click "Trigger Class Ends Rush" multiple times rapidly or use the test presets.
