# Phase 1: Campus Map Blueprint Analysis & Road Network Extraction

**Project:** CampusPool — Autonomous Dynamic Campus Ride-Pooling Platform  
**Target Site:** Geeta University ("Proposed Plan" Master Architectural Layout)  
**Image Resolution:** 768 × 1024 px  
**Date:** November 2026

---

## 1. Map Image Inspection & Spatial Architecture

The source document is an architectural blueprint titled **`* Proposed Plan`** depicting the complete master campus site layout.

### Orientation & Layout Geometry
- **North-South Axis:** Oriented vertically with the primary North Entrance Gate at $(x: 310, y: 155)$ and South-East Main Entrance Gate & Grand Rotary at $(x: 605, y: 805)$.
- **Legend & Building Classification:**
  - 🟩 **Existing Building Blocks (Olive-Green):** Academic blocks, Admin block, Girls hostel & mess, West Academic blocks, Staff Housing.
  - 🟦 **Proposed Building Blocks (Dark Slate-Blue):** Gateway Building Complex (Multi-story administration, Central Library, Auditorium, Incubation center), Academic Complex, New Hostel extensions.
  - 🔷 **Water Channel (Light Blue Line):** Stormwater / decorative water channel running parallel along University Plaza boulevard to the Grand Roundabout.
  - 🟢 **Green / Landscape Areas:** Central sports oval, landscape buffer along north fence, courtyards between academic wings, and University Plaza garden lawns.

---

## 2. Scale Calibration & Spatial Metric Derivation

To convert pixel measurements to real-world meters and calculate vehicle travel times realistically:
- **Reference Landmark 1:** Standard Cricket Ground / Sports Oval at $(x: 180, y: 430)$. Standard cricket ground boundary diameter is $\approx 125\text{ m}$. In image: $112\text{ px}$.
  $$\text{Scale 1} \approx \frac{125\text{ m}}{112\text{ px}} \approx 1.116\text{ m/px}$$
- **Reference Landmark 2:** Standard 2-lane internal campus road width: $\approx 7.0\text{ m}$. In image: $\approx 6.5\text{ px}$.
  $$\text{Scale 2} \approx \frac{7.0\text{ m}}{6.5\text{ px}} \approx 1.076\text{ m/px}$$
- **Reference Landmark 3:** University Plaza Grand Roundabout outer circle: $\approx 45\text{ m}$. In image: $40\text{ px}$.
  $$\text{Scale 3} \approx \frac{45\text{ m}}{40\text{ px}} \approx 1.125\text{ m/px}$$

**Calibrated Global Scale Constant:**
$$\mathbf{1.10\text{ metres per pixel}} \quad (1\text{ px} = 1.10\text{ m})$$
- Campus Width: $768\text{ px} \times 1.10\text{ m} \approx 845\text{ m}$
- Campus Height: $1024\text{ px} \times 1.10\text{ m} \approx 1126\text{ m}$
- Total Campus Footprint: $\approx 0.95\text{ km}^2$ ($\approx 95\text{ hectares}$)

---

## 3. Road Network Graph Topology

### Speed Profiles by Road Class
- **Avenue / Boulevard (University Plaza, Central Academic Boulevard):** $25\text{ km/h} \approx 6.94\text{ m/s}$ ($6.31\text{ px/s}$)
- **Internal Loop / Service Roads:** $18\text{ km/h} \approx 5.00\text{ m/s}$ ($4.55\text{ px/s}$)
- **Hostel / Pedestrian-Adjacent Zones:** $12\text{ km/h} \approx 3.33\text{ m/s}$ ($3.03\text{ px/s}$)

### Node Inventory (22 Extraction Nodes & 16 Named Stops)

| Node ID | Stop Name | Type | Pixel (X, Y) | Description & Key Amenities |
| :--- | :--- | :--- | :--- | :--- |
| **N01** | North Entrance Gate | `gate` | $(312, 162)$ | North campus barrier gate & external highway link |
| **N02** | North Parking & Security Post | `parking` | $(355, 185)$ | North faculty & visitor parking lot |
| **N03** | North Academic Block (Block A) | `building` | $(305, 245)$ | Classrooms, lecture halls, faculty offices |
| **N04** | Central Administrative Block | `admin` | $(365, 235)$ | Registrar, Dean's Office, Admissions, Finance |
| **N05** | Academic Plaza North Junction | `junction` | $(332, 285)$ | Main 4-way intersection connecting North & Central wings |
| **N06** | West Academic Wing (Block B) | `building` | $(288, 335)$ | Computer Labs, Robotics Center, AI Hub |
| **N07** | Girls Hostel Block & Dining Mess | `hostel` | $(358, 385)$ | Residence halls, dining hall, indoor common room |
| **N08** | Academic Plaza Central Crossing | `junction` | $(332, 422)$ | Major campus crossroad dividing north and south zones |
| **N09** | Sports Complex & Cricket Pavilion | `sports` | $(178, 432)$ | Cricket ground, tennis courts, gym, athletics track |
| **N10** | Service Road West Bypass | `junction` | $(275, 428)$ | West utility transit corridor and delivery access |
| **N11** | Boys Hostel Strip (Tagore & Raman) | `hostel` | $(495, 388)$ | Senior student residences & hostel recreation ground |
| **N12** | East Hostel & Playground Hub | `hostel` | $(505, 260)$ | Junior student hostels and adjacent sports field |
| **N13** | Staff & Faculty Housing | `building` | $(578, 460)$ | Residential quarters for professors and campus staff |
| **N14** | Central Academic Megablock | `building` | $(380, 475)$ | Central auditorium, conference halls, main lecture theatres |
| **N15** | Academic Plaza South Junction | `junction` | $(332, 515)$ | Entrance junction to Student Center and Gateway Plaza |
| **N16** | Student Center & Cafeteria | `building` | $(305, 572)$ | Multi-cuisine food court, hobby center, student council |
| **N17** | Gateway Landmark Building (Library) | `landmark` | $(365, 595)$ | Iconic high-rise tower: Central Library, MDP, Research, Incubation |
| **N18** | South Academic Complex | `building` | $(465, 565)$ | Pharmacy, Law School, Allied Sciences departments |
| **N19** | South Parking & Field Loop | `parking` | $(395, 665)$ | Student parking, open grounds access, field pickup |
| **N20** | University Plaza Boulevard Junction | `junction` | $(435, 630)$ | Northern nexus of the grand University Plaza avenue |
| **N21** | Grand Rotary & Water Channel Circle | `junction` | $(550, 780)$ | Landscaped circulatory roundabout with water fountain |
| **N22** | South-East Main Entrance Gate | `gate` | $(605, 805)$ | Primary campus ceremonial entrance connecting to NH highway |

---

## 4. Designated Named Stops Schema & Connectivity

The 22 nodes form an un-partitioned, strongly connected planar graph with **28 bidirectional drivable edges**.
All 16 passenger stops are directly co-located on drivable nodes with designated physical passenger pickup bays and zero deadhead dead-ends.

```
       [N01: North Gate]
              │
       [N02: Parking]
       ┌──────┴──────┐
 [N03: Acad A]  [N04: Admin]
       └──────┬──────┘
       [N05: Plaza N] ─────────────── [N12: East Hostels]
       ┌──────┴──────┐                       │
 [N06: Acad B]  [N07: Girls Hostel]   [N11: Boys Hostels]
       └──────┬──────┘                       │
[N09: Sports]─[N08: Plaza Central]───────────┼───────[N13: Staff Housing]
              │                              │
[N10: Bypass]─[N15: Plaza South]             │
       ┌──────┴──────┐                       │
 [N16: Food]    [N17: Gateway / Library] ────┘
       └──────┬──────┘
        [N20: Plaza Ave]
       ┌──────┴──────┐
 [N19: Parking] [N18: South Acad]
       └──────┬──────┘
       [N21: Grand Rotary]
              │
       [N22: SE Main Gate]
```

---

## 5. Ambiguities & Items for User Confirmation

Before finalizing the routing graph, the following specific details from the blueprint are flagged for your review and confirmation:

1. **Service Road West (Node N10):**
   The road along the western edge of the Student Center is marked as `"SERVICE ROAD"`.
   - *Assumed Configuration:* Permitted for campus electric shuttles to avoid pedestrian foot-traffic in the central quad.
   - *Alternative:* Restrict to emergency and service vehicles only.

2. **Northeast Playground Loop (Node N12 to N11):**
   The road connecting the upper hostel blocks to the lower hostel blocks runs alongside the playground.
   - *Assumed Configuration:* Two-way paved internal road with a $12\text{ km/h}$ speed limit.

3. **University Plaza Median & Water Channel:**
   University Plaza is a wide boulevard divided by a water channel and landscaped trees.
   - *Assumed Configuration:* Dual carriageway (one lane southbound towards the rotary, one lane northbound towards the Gateway Building). Shuttles can circulate cleanly around the central rotary island (Node N21).

4. **External Arterials outside N01 and N22:**
   The roads outside the campus fence are national/state highways.
   - *Assumed Configuration:* CampusPool shuttles circulate strictly within the internal campus gates (between N01 and N22), turning around at the gate loops without venturing into external traffic.
