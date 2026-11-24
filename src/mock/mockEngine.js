/**
 * mockEngine.js
 * High-fidelity Mock Simulation Engine for Member 2 UI development.
 * Strictly adheres to the Interface Contract.
 * Swappable with /src/engine/index.js via /src/ui/engineAdapter.js.
 */

// Mulberry32 deterministic seeded PRNG
export function createRNG(seed = 42) {
  let s = Math.floor(seed) >>> 0;
  return function next() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MOCK_CAMPUS = {
  nodes: [
    { id: 'main_gate', name: 'Main Campus Gate', type: 'gate', lat: 37.4290, lng: -122.1700 },
    { id: 'north_gate', name: 'North Gate', type: 'gate', lat: 37.4335, lng: -122.1660 },
    { id: 'south_gate', name: 'South Gate', type: 'gate', lat: 37.4220, lng: -122.1720 },
    { id: 'library', name: 'Central Library', type: 'academic', lat: 37.4275, lng: -122.1685 },
    { id: 'admin_block', name: 'Admin Complex', type: 'admin', lat: 37.4282, lng: -122.1710 },
    { id: 'tech_tower', name: 'Computer Science Tower', type: 'academic', lat: 37.4298, lng: -122.1665 },
    { id: 'science_lab', name: 'Science & Bio Labs', type: 'academic', lat: 37.4310, lng: -122.1645 },
    { id: 'mech_workshop', name: 'Engineering Workshop', type: 'academic', lat: 37.4260, lng: -122.1650 },
    { id: 'canteen_central', name: 'Central Cafeteria', type: 'dining', lat: 37.4270, lng: -122.1670 },
    { id: 'canteen_north', name: 'North Food Court', type: 'dining', lat: 37.4320, lng: -122.1675 },
    { id: 'auditorium', name: 'Grand Auditorium', type: 'amenity', lat: 37.4265, lng: -122.1715 },
    { id: 'sports_complex', name: 'Sports Complex & Gym', type: 'sports', lat: 37.4240, lng: -122.1655 },
    { id: 'swimming_pool', name: 'Aquatic Center', type: 'sports', lat: 37.4230, lng: -122.1640 },
    { id: 'health_center', name: 'Health & Wellness Center', type: 'health', lat: 37.4250, lng: -122.1690 },
    { id: 'hostel_a', name: 'Hostel A - Raman Hall', type: 'hostel', lat: 37.4305, lng: -122.1730 },
    { id: 'hostel_b', name: 'Hostel B - Curie Hall', type: 'hostel', lat: 37.4325, lng: -122.1710 },
    { id: 'hostel_c', name: 'Hostel C - Newton Hall', type: 'hostel', lat: 37.4235, lng: -122.1745 },
    { id: 'hostel_d', name: 'Hostel D - Aryabhata Hall', type: 'hostel', lat: 37.4215, lng: -122.1700 },
    { id: 'pg_residence', name: 'Postgrad Residence', type: 'hostel', lat: 37.4225, lng: -122.1670 },
    { id: 'innovation_hub', name: 'Student Innovation Hub', type: 'academic', lat: 37.4290, lng: -122.1640 }
  ],
  edges: [
    { id: 'e1', from: 'main_gate', to: 'admin_block', minutes: 2, closed: false },
    { id: 'e2', from: 'main_gate', to: 'library', minutes: 3, closed: false },
    { id: 'e3', from: 'main_gate', to: 'hostel_a', minutes: 3, closed: false },
    { id: 'e4', from: 'admin_block', to: 'auditorium', minutes: 2, closed: false },
    { id: 'e5', from: 'admin_block', to: 'health_center', minutes: 3, closed: false },
    { id: 'e6', from: 'library', to: 'canteen_central', minutes: 2, closed: false },
    { id: 'e7', from: 'library', to: 'tech_tower', minutes: 3, closed: false },
    { id: 'e8', from: 'library', to: 'mech_workshop', minutes: 3, closed: false },
    { id: 'e9', from: 'tech_tower', to: 'science_lab', minutes: 2, closed: false },
    { id: 'e10', from: 'tech_tower', to: 'innovation_hub', minutes: 2, closed: false },
    { id: 'e11', from: 'tech_tower', to: 'canteen_north', minutes: 3, closed: false },
    { id: 'e12', from: 'science_lab', to: 'innovation_hub', minutes: 2, closed: false },
    { id: 'e13', from: 'science_lab', to: 'north_gate', minutes: 3, closed: false },
    { id: 'e14', from: 'canteen_north', to: 'north_gate', minutes: 3, closed: false },
    { id: 'e15', from: 'canteen_north', to: 'hostel_b', minutes: 3, closed: false },
    { id: 'e16', from: 'hostel_b', to: 'hostel_a', minutes: 3, closed: false },
    { id: 'e17', from: 'hostel_a', to: 'canteen_central', minutes: 4, closed: false },
    { id: 'e18', from: 'auditorium', to: 'health_center', minutes: 2, closed: false },
    { id: 'e19', from: 'auditorium', to: 'south_gate', minutes: 3, closed: false },
    { id: 'e20', from: 'health_center', to: 'hostel_c', minutes: 3, closed: false },
    { id: 'e21', from: 'health_center', to: 'canteen_central', minutes: 3, closed: false },
    { id: 'e22', from: 'canteen_central', to: 'sports_complex', minutes: 3, closed: false },
    { id: 'e23', from: 'sports_complex', to: 'swimming_pool', minutes: 2, closed: false },
    { id: 'e24', from: 'sports_complex', to: 'pg_residence', minutes: 2, closed: false },
    { id: 'e25', from: 'sports_complex', to: 'mech_workshop', minutes: 3, closed: false },
    { id: 'e26', from: 'mech_workshop', to: 'innovation_hub', minutes: 3, closed: false },
    { id: 'e27', from: 'hostel_c', to: 'south_gate', minutes: 2, closed: false },
    { id: 'e28', from: 'hostel_c', to: 'hostel_d', minutes: 2, closed: false },
    { id: 'e29', from: 'south_gate', to: 'hostel_d', minutes: 3, closed: false },
    { id: 'e30', from: 'hostel_d', to: 'pg_residence', minutes: 2, closed: false },
    { id: 'e31', from: 'pg_residence', to: 'swimming_pool', minutes: 2, closed: false }
  ]
};

// Dijkstra Shortest Path Precomputation
export class CampusGraph {
  constructor(nodes, edges) {
    this.nodes = nodes;
    this.edges = edges;
    this.nodeMap = new Map(nodes.map(n => [n.id, n]));
    this.computeAllPairs();
  }

  computeAllPairs() {
    this.adj = new Map();
    for (const node of this.nodes) {
      this.adj.set(node.id, []);
    }
    for (const edge of this.edges) {
      if (edge.closed) continue;
      this.adj.get(edge.from)?.push({ to: edge.to, minutes: edge.minutes, edgeId: edge.id });
      this.adj.get(edge.to)?.push({ to: edge.from, minutes: edge.minutes, edgeId: edge.id });
    }

    this.dist = new Map();
    this.paths = new Map();

    for (const startNode of this.nodes) {
      this.dijkstraFrom(startNode.id);
    }
  }

  dijkstraFrom(startId) {
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set(this.nodes.map(n => n.id));

    for (const node of this.nodes) {
      distances.set(node.id, Infinity);
    }
    distances.set(startId, 0);

    while (unvisited.size > 0) {
      let currentId = null;
      let minDistance = Infinity;
      for (const id of unvisited) {
        const d = distances.get(id);
        if (d < minDistance) {
          minDistance = d;
          currentId = id;
        }
      }

      if (currentId === null || minDistance === Infinity) break;
      unvisited.delete(currentId);

      const neighbors = this.adj.get(currentId) || [];
      for (const edge of neighbors) {
        if (!unvisited.has(edge.to)) continue;
        const newDist = distances.get(currentId) + edge.minutes;
        if (newDist < distances.get(edge.to)) {
          distances.set(edge.to, newDist);
          previous.set(edge.to, currentId);
        }
      }
    }

    for (const node of this.nodes) {
      const targetId = node.id;
      const key = `${startId}->${targetId}`;
      const d = distances.get(targetId);
      this.dist.set(key, d);

      if (d === Infinity) {
        this.paths.set(key, null);
      } else {
        const path = [];
        let curr = targetId;
        while (curr !== undefined) {
          path.unshift(curr);
          curr = previous.get(curr);
        }
        this.paths.set(key, path);
      }
    }
  }

  getShortestPath(fromId, toId) {
    if (fromId === toId) return { minutes: 0, path: [fromId] };
    const key = `${fromId}->${toId}`;
    const minutes = this.dist.get(key) ?? Infinity;
    const path = this.paths.get(key) ?? null;
    return { minutes, path };
  }
}

/**
 * Creates an active simulation instance.
 */
export function createSimulation({
  campus = MOCK_CAMPUS,
  seed = 42,
  mode = 'pool',
  vehicleCount = 3,
  capacity = 4
} = {}) {
  const rng = createRNG(seed);
  const clonedNodes = JSON.parse(JSON.stringify(campus.nodes));
  const clonedEdges = JSON.parse(JSON.stringify(campus.edges));
  const graph = new CampusGraph(clonedNodes, clonedEdges);

  // Distinct colorblind-safe palettes (Tol/Okabe-Ito inspired)
  const vehicleColors = ['#0284c7', '#d97706', '#7c3aed', '#059669', '#e11d48'];

  let time = 0; // simulated minutes (each tick = 10 sec = 1/6 min)
  let requestSeq = 1;
  const events = [];
  const listeners = new Set();

  function logEvent(type, message, refs = {}) {
    events.push({
      time: parseFloat(time.toFixed(1)),
      type,
      message,
      refs
    });
  }

  // Initial vehicles placed at sensible campus hubs
  const initialNodes = ['main_gate', 'library', 'sports_complex', 'tech_tower', 'hostel_b'];
  const vehicles = [];
  for (let i = 0; i < vehicleCount; i++) {
    const startNodeId = initialNodes[i % initialNodes.length];
    const nodeObj = clonedNodes.find(n => n.id === startNodeId) || clonedNodes[0];
    vehicles.push({
      id: `V${i + 1}`,
      capacity,
      occupancy: 0,
      status: 'idle', // idle | moving | broken
      position: { lat: nodeObj.lat, lng: nodeObj.lng },
      currentNode: startNodeId,
      targetNode: null,
      progressFraction: 0,
      route: [], // upcoming node sequence
      stops: [], // [{ type: 'pickup'|'dropoff', node, requestId, plannedArrival }]
      onboard: [], // [requestIds]
      color: vehicleColors[i % vehicleColors.length],
      // Metrics tracking
      totalDistanceMin: 0
    });
  }

  const requests = [];

  function notify() {
    for (const fn of listeners) {
      try {
        fn(getState());
      } catch (err) {
        console.error('Error in sim subscriber:', err);
      }
    }
  }

  /**
   * Evaluates candidate arrival times for a vehicle given current time and stops.
   */
  function calculateStopsArrivals(vehicle, candidateStops) {
    let currTime = time;
    let currNode = vehicle.currentNode;
    const arrivals = [];

    for (const stop of candidateStops) {
      const sp = graph.getShortestPath(currNode, stop.node);
      if (!sp.path || sp.minutes === Infinity) {
        return null; // unreachable
      }
      currTime += sp.minutes;
      arrivals.push(currTime);
      currNode = stop.node;
    }
    return arrivals;
  }

  /**
   * Adds a new student ride request.
   */
  function addRequest({
    pickup,
    dropoff,
    passengers = 1,
    windowMin = 10,
    maxDetourMin = 6
  }) {
    const requestId = `R${requestSeq++}`;
    const directPath = graph.getShortestPath(pickup, dropoff);
    const directMinutes = directPath.minutes;

    if (!directPath.path || directMinutes === Infinity) {
      const rejection = {
        vehicleId: null,
        type: 'routing',
        message: 'No active route between pickup and dropoff due to road closures'
      };
      const reqObj = {
        id: requestId,
        pickup,
        dropoff,
        passengers,
        status: 'rejected',
        vehicleId: null,
        rejectionReason: rejection.message,
        reasons: [rejection],
        createdAt: parseFloat(time.toFixed(1)),
        pickedUpAt: null,
        completedAt: null,
        promisedLatestDropoff: null
      };
      requests.push(reqObj);
      logEvent('rejection', `Request ${requestId} (${pickup} -> ${dropoff}) rejected: No route available.`, { requestId });
      notify();
      return { requestId, status: 'rejected', reasons: [rejection] };
    }

    const earliestPickup = time;
    const latestPickup = time + windowMin;
    // Configurable promise: direct + 8 min, or direct * 1.5 + detour
    const promisedLatestDropoff = time + windowMin + directMinutes + maxDetourMin;

    const reasons = [];
    let bestCandidate = null;

    for (const vehicle of vehicles) {
      if (vehicle.status === 'broken') {
        reasons.push({
          vehicleId: vehicle.id,
          type: 'vehicle_unavailable',
          message: `${vehicle.id} is broken down and taking no rides`
        });
        continue;
      }

      if (mode === 'solo' && (vehicle.onboard.length > 0 || vehicle.stops.length > 0)) {
        reasons.push({
          vehicleId: vehicle.id,
          type: 'capacity',
          message: `${vehicle.id} is in solo-ride mode and already booked`
        });
        continue;
      }

      // Check current capacity
      const existingStops = [...vehicle.stops];
      let firstFailure = null;

      // Try every insertion index i for pickup, and j >= i for dropoff
      let minAddedTime = Infinity;
      let bestPair = null;

      const n = existingStops.length;
      for (let i = 0; i <= n; i++) {
        for (let j = i; j <= n; j++) {
          const testStops = [...existingStops];
          const pickupStop = { type: 'pickup', node: pickup, requestId, plannedArrival: 0 };
          const dropoffStop = { type: 'dropoff', node: dropoff, requestId, plannedArrival: 0 };

          testStops.splice(i, 0, pickupStop);
          testStops.splice(j + 1, 0, dropoffStop);

          // (a) Capacity constraint check at every point along the route
          let occ = vehicle.occupancy;
          let capacityExceeded = false;
          for (const s of testStops) {
            const req = (s.requestId === requestId)
              ? { passengers }
              : requests.find(r => r.id === s.requestId);
            const pCount = req ? (req.passengers || 1) : 1;

            if (s.type === 'pickup') occ += pCount;
            else if (s.type === 'dropoff') occ -= pCount;

            if (occ > vehicle.capacity) {
              capacityExceeded = true;
              break;
            }
          }

          if (capacityExceeded) {
            if (!firstFailure) {
              firstFailure = {
                vehicleId: vehicle.id,
                type: 'capacity',
                message: `${vehicle.id}: Route would exceed capacity of ${vehicle.capacity} seats`
              };
            }
            continue;
          }

          // Compute planned arrivals
          const arrivals = calculateStopsArrivals(vehicle, testStops);
          if (!arrivals) {
            if (!firstFailure) {
              firstFailure = {
                vehicleId: vehicle.id,
                type: 'routing',
                message: `${vehicle.id}: Segment unreachable due to closed road`
              };
            }
            continue;
          }

          // Check timing for new pickup
          const pickupArrival = arrivals[i];
          if (pickupArrival > latestPickup) {
            if (!firstFailure) {
              firstFailure = {
                vehicleId: vehicle.id,
                type: 'timing',
                message: `${vehicle.id}: Pickup ETA ${(pickupArrival - time).toFixed(1)}m exceeds ${windowMin}m window`
              };
            }
            continue;
          }

          // Check timing for new dropoff
          const dropoffArrival = arrivals[j + 1];
          if (dropoffArrival > promisedLatestDropoff) {
            if (!firstFailure) {
              firstFailure = {
                vehicleId: vehicle.id,
                type: 'detour',
                message: `${vehicle.id}: Dropoff detour would exceed max allowed detour (+${maxDetourMin}m)`
              };
            }
            continue;
          }

          // (c) Check that EVERY existing passenger's promise still holds
          let promiseBroken = false;
          let brokenReason = null;
          for (let k = 0; k < testStops.length; k++) {
            const st = testStops[k];
            if (st.requestId === requestId) continue;
            const exReq = requests.find(r => r.id === st.requestId);
            if (!exReq) continue;

            const stArrival = arrivals[k];
            if (st.type === 'pickup' && stArrival > exReq.createdAt + (exReq.windowMin || 10)) {
              promiseBroken = true;
              brokenReason = `${vehicle.id}: Would delay pickup for ${exReq.id} past promise window`;
              break;
            }
            if (st.type === 'dropoff' && exReq.promisedLatestDropoff && stArrival > exReq.promisedLatestDropoff) {
              promiseBroken = true;
              brokenReason = `${vehicle.id}: Would add ${(stArrival - exReq.promisedLatestDropoff).toFixed(1)}m detour to ${exReq.id}, breaking promised drop-off`;
              break;
            }
          }

          if (promiseBroken) {
            if (!firstFailure) {
              firstFailure = {
                vehicleId: vehicle.id,
                type: 'detour',
                message: brokenReason
              };
            }
            continue;
          }

          // Valid insertion! Total added time:
          const totalRouteTime = arrivals[arrivals.length - 1] - time;
          if (totalRouteTime < minAddedTime) {
            minAddedTime = totalRouteTime;
            for (let idx = 0; idx < testStops.length; idx++) {
              testStops[idx].plannedArrival = parseFloat(arrivals[idx].toFixed(1));
            }
            bestPair = {
              vehicle,
              testStops,
              addedTime: minAddedTime
            };
          }
        }
      }

      if (bestPair) {
        if (!bestCandidate || bestPair.addedTime < bestCandidate.addedTime) {
          bestCandidate = bestPair;
        }
      } else {
        reasons.push(firstFailure || {
          vehicleId: vehicle.id,
          type: 'timing',
          message: `${vehicle.id}: No feasible stop slot found within constraints`
        });
      }
    }

    if (!bestCandidate) {
      // Rejection: choose most relevant reason
      const primaryReason = reasons[0]?.message || 'All vehicles busy or constraints exceeded';
      const reqObj = {
        id: requestId,
        pickup,
        dropoff,
        passengers,
        windowMin,
        maxDetourMin,
        status: 'rejected',
        vehicleId: null,
        rejectionReason: primaryReason,
        reasons,
        createdAt: parseFloat(time.toFixed(1)),
        pickedUpAt: null,
        completedAt: null,
        promisedLatestDropoff: parseFloat(promisedLatestDropoff.toFixed(1))
      };
      requests.push(reqObj);
      logEvent('rejection', `Request ${requestId} (${pickup} -> ${dropoff}) rejected: ${primaryReason}`, { requestId, reasons });
      notify();
      return { requestId, status: 'rejected', reasons };
    }

    // Success! Assign to best vehicle
    const chosenVehicle = bestCandidate.vehicle;
    chosenVehicle.stops = bestCandidate.testStops;
    updateVehicleRoute(chosenVehicle);

    const reqObj = {
      id: requestId,
      pickup,
      dropoff,
      passengers,
      windowMin,
      maxDetourMin,
      status: 'assigned',
      vehicleId: chosenVehicle.id,
      rejectionReason: null,
      reasons: [],
      createdAt: parseFloat(time.toFixed(1)),
      pickedUpAt: null,
      completedAt: null,
      promisedLatestDropoff: parseFloat(promisedLatestDropoff.toFixed(1))
    };
    requests.push(reqObj);

    logEvent('assignment', `Request ${requestId} assigned to ${chosenVehicle.id} (${pickup} -> ${dropoff}). Planned dropoff: t=${chosenVehicle.stops[chosenVehicle.stops.length - 1].plannedArrival}`, {
      requestId,
      vehicleId: chosenVehicle.id
    });

    notify();
    return { requestId, status: 'assigned', vehicleId: chosenVehicle.id };
  }

  function updateVehicleRoute(vehicle) {
    if (vehicle.stops.length === 0) {
      vehicle.route = [];
      if (vehicle.status !== 'broken') vehicle.status = 'idle';
      return;
    }

    if (vehicle.status !== 'broken') vehicle.status = 'moving';

    const fullRoute = [];
    let start = vehicle.currentNode;
    for (const stop of vehicle.stops) {
      const sp = graph.getShortestPath(start, stop.node);
      if (sp.path && sp.path.length > 1) {
        for (let i = 1; i < sp.path.length; i++) {
          fullRoute.push(sp.path[i]);
        }
      } else if (start !== stop.node) {
        fullRoute.push(stop.node);
      }
      start = stop.node;
    }
    vehicle.route = fullRoute;
  }

  /**
   * Cancel an active request.
   */
  function cancelRequest(requestId) {
    const req = requests.find(r => r.id === requestId);
    if (!req) return { ok: false, reason: 'Request not found' };

    if (req.status === 'onboard') {
      return { ok: false, reason: 'Rider is already on board; cannot cancel mid-trip without dropping off' };
    }

    if (req.status === 'completed' || req.status === 'cancelled' || req.status === 'rejected') {
      return { ok: false, reason: `Request is already ${req.status}` };
    }

    const vId = req.vehicleId;
    req.status = 'cancelled';

    if (vId) {
      const v = vehicles.find(veh => veh.id === vId);
      if (v) {
        v.stops = v.stops.filter(s => s.requestId !== requestId);
        // Recompute planned arrivals for remaining stops
        const arrivals = calculateStopsArrivals(v, v.stops);
        if (arrivals) {
          v.stops.forEach((s, idx) => {
            s.plannedArrival = parseFloat(arrivals[idx].toFixed(1));
          });
        }
        updateVehicleRoute(v);
      }
    }

    logEvent('cancellation', `Request ${requestId} cancelled. Vehicle route updated.`, { requestId, vehicleId: vId });
    notify();
    return { ok: true };
  }

  /**
   * Disruption: Vehicle breakdown
   */
  function breakVehicle(vehicleId) {
    const v = vehicles.find(veh => veh.id === vehicleId);
    if (!v) return;
    if (v.status === 'broken') return;

    v.status = 'broken';
    logEvent('breakdown', `Vehicle ${v.id} broke down at node ${v.currentNode}!`, { vehicleId });

    // Handle onboard riders: drop at current safe node
    const onboardIds = [...v.onboard];
    v.onboard = [];
    v.occupancy = 0;

    for (const rId of onboardIds) {
      const r = requests.find(req => req.id === rId);
      if (r) {
        r.status = 'rejected';
        r.rejectionReason = `Vehicle ${v.id} broke down. Rider safely deboarded at ${v.currentNode}. Transfer dispatched if feasible.`;
        r.reasons = [{ vehicleId: v.id, type: 'vehicle_unavailable', message: r.rejectionReason }];
        logEvent('disruption', `Onboard rider ${r.id} dropped off at ${v.currentNode} due to breakdown.`, { requestId: r.id, vehicleId: v.id });
      }
    }

    // Unpicked stops: return to pool
    const unpickedStopReqIds = Array.from(new Set(v.stops.filter(s => s.type === 'pickup').map(s => s.requestId)));
    v.stops = [];
    v.route = [];

    for (const rId of unpickedStopReqIds) {
      const r = requests.find(req => req.id === rId);
      if (r && r.status === 'assigned') {
        r.status = 'waiting';
        r.vehicleId = null;
        logEvent('disruption', `Ride ${r.id} re-pooled due to breakdown of ${v.id}.`, { requestId: r.id });
        // Attempt re-dispatch
        addRequest({
          pickup: r.pickup,
          dropoff: r.dropoff,
          passengers: r.passengers,
          windowMin: r.windowMin,
          maxDetourMin: r.maxDetourMin
        });
      }
    }

    notify();
  }

  /**
   * Disruption: Road closures
   */
  function closeRoad(edgeId) {
    const edge = clonedEdges.find(e => e.id === edgeId);
    if (!edge || edge.closed) return;
    edge.closed = true;
    graph.computeAllPairs();
    logEvent('road_closed', `Road closed: ${edge.from} <-> ${edge.to} (${edge.id})`, { edgeId });

    // Re-validate all vehicle routes
    for (const v of vehicles) {
      if (v.status === 'broken') continue;
      const arrivals = calculateStopsArrivals(v, v.stops);
      if (!arrivals) {
        logEvent('reroute_failed', `Vehicle ${v.id} route blocked by road closure. Re-routing or re-pooling unpicked stops...`, { vehicleId: v.id });
        // Try re-routing
        updateVehicleRoute(v);
      } else {
        v.stops.forEach((s, idx) => {
          s.plannedArrival = parseFloat(arrivals[idx].toFixed(1));
        });
        updateVehicleRoute(v);
        logEvent('rerouted', `Vehicle ${v.id} rerouted around closed road ${edge.id}.`, { vehicleId: v.id });
      }
    }

    notify();
  }

  function reopenRoad(edgeId) {
    const edge = clonedEdges.find(e => e.id === edgeId);
    if (!edge || !edge.closed) return;
    edge.closed = false;
    graph.computeAllPairs();
    logEvent('road_reopened', `Road reopened: ${edge.from} <-> ${edge.to} (${edge.id})`, { edgeId });

    // Recompute optimal paths for moving vehicles
    for (const v of vehicles) {
      if (v.status !== 'broken' && v.stops.length > 0) {
        const arrivals = calculateStopsArrivals(v, v.stops);
        if (arrivals) {
          v.stops.forEach((s, idx) => {
            s.plannedArrival = parseFloat(arrivals[idx].toFixed(1));
          });
          updateVehicleRoute(v);
        }
      }
    }

    notify();
  }

  /**
   * Advance simulation by 1 tick (10 simulated seconds = 1/6 min).
   */
  function tick() {
    const dt = 1 / 6; // minutes
    time = parseFloat((time + dt).toFixed(2));

    for (const vehicle of vehicles) {
      if (vehicle.status === 'broken') continue;

      if (vehicle.stops.length === 0) {
        vehicle.status = 'idle';
        vehicle.progressFraction = 0;
        continue;
      }

      vehicle.status = 'moving';

      // Check if we reached or are at the next stop
      const nextStop = vehicle.stops[0];

      if (vehicle.currentNode === nextStop.node && vehicle.progressFraction === 0) {
        // Arrived at stop!
        handleStopArrival(vehicle, nextStop);
        continue;
      }

      // Movement step towards next stop
      if (!vehicle.targetNode) {
        if (vehicle.route.length > 0) {
          vehicle.targetNode = vehicle.route.shift();
        } else {
          vehicle.targetNode = nextStop.node;
        }
      }

      const sp = graph.getShortestPath(vehicle.currentNode, vehicle.targetNode);
      const legDuration = sp.minutes > 0 ? sp.minutes : 1;
      const progressDelta = dt / legDuration;

      vehicle.progressFraction += progressDelta;
      vehicle.totalDistanceMin += dt;

      const currNodeObj = clonedNodes.find(n => n.id === vehicle.currentNode);
      const targetNodeObj = clonedNodes.find(n => n.id === vehicle.targetNode);

      if (currNodeObj && targetNodeObj) {
        const frac = Math.min(1, vehicle.progressFraction);
        vehicle.position = {
          lat: currNodeObj.lat + (targetNodeObj.lat - currNodeObj.lat) * frac,
          lng: currNodeObj.lng + (targetNodeObj.lng - currNodeObj.lng) * frac
        };
      }

      if (vehicle.progressFraction >= 1) {
        // Arrived at targetNode
        vehicle.currentNode = vehicle.targetNode;
        vehicle.targetNode = null;
        vehicle.progressFraction = 0;

        if (currNodeObj && targetNodeObj) {
          vehicle.position = { lat: targetNodeObj.lat, lng: targetNodeObj.lng };
        }

        if (vehicle.currentNode === nextStop.node) {
          handleStopArrival(vehicle, nextStop);
        }
      }
    }

    notify();
  }

  function handleStopArrival(vehicle, stop) {
    const req = requests.find(r => r.id === stop.requestId);

    if (stop.type === 'pickup') {
      if (req && req.status === 'assigned') {
        req.status = 'onboard';
        req.pickedUpAt = parseFloat(time.toFixed(1));
        vehicle.onboard.push(req.id);
        vehicle.occupancy += (req.passengers || 1);
        logEvent('pickup', `Vehicle ${vehicle.id} picked up rider ${req.id} at ${stop.node} (Seats: ${vehicle.occupancy}/${vehicle.capacity})`, {
          vehicleId: vehicle.id,
          requestId: req.id
        });
      }
    } else if (stop.type === 'dropoff') {
      if (req && req.status === 'onboard') {
        req.status = 'completed';
        req.completedAt = parseFloat(time.toFixed(1));
        vehicle.onboard = vehicle.onboard.filter(id => id !== req.id);
        vehicle.occupancy = Math.max(0, vehicle.occupancy - (req.passengers || 1));
        logEvent('dropoff', `Vehicle ${vehicle.id} dropped off rider ${req.id} at ${stop.node}`, {
          vehicleId: vehicle.id,
          requestId: req.id
        });
      }
    }

    vehicle.stops.shift(); // remove fulfilled stop
    updateVehicleRoute(vehicle);
  }

  function run(nTicks = 1) {
    for (let i = 0; i < nTicks; i++) {
      tick();
    }
  }

  function getState() {
    // Calculate live metrics
    const completed = requests.filter(r => r.status === 'completed');
    const waiting = requests.filter(r => r.status === 'waiting' || r.status === 'assigned');
    const rejected = requests.filter(r => r.status === 'rejected');
    const onboard = requests.filter(r => r.status === 'onboard');

    let totalWait = 0;
    for (const r of completed) {
      if (r.pickedUpAt !== null && r.createdAt !== null) {
        totalWait += Math.max(0, r.pickedUpAt - r.createdAt);
      }
    }
    const avgWaitMin = completed.length > 0 ? parseFloat((totalWait / completed.length).toFixed(1)) : 0;
    const servedPct = requests.length > 0 ? parseFloat(((completed.length / requests.length) * 100).toFixed(1)) : 100;
    const totalDistanceMin = parseFloat(vehicles.reduce((acc, v) => acc + (v.totalDistanceMin || 0), 0).toFixed(1));
    const totalOccupancy = vehicles.reduce((acc, v) => acc + v.occupancy, 0);
    const avgOccupancy = vehicles.length > 0 ? parseFloat((totalOccupancy / vehicles.length).toFixed(2)) : 0;

    return {
      time: parseFloat(time.toFixed(1)),
      nodes: clonedNodes,
      edges: clonedEdges,
      vehicles: vehicles.map(v => ({
        id: v.id,
        capacity: v.capacity,
        occupancy: v.occupancy,
        status: v.status,
        position: { ...v.position },
        currentNode: v.currentNode,
        route: [...v.route],
        stops: v.stops.map(s => ({ ...s })),
        onboard: [...v.onboard],
        color: v.color
      })),
      requests: requests.map(r => ({ ...r, reasons: r.reasons ? [...r.reasons] : [] })),
      metrics: {
        totalRequests: requests.length,
        completedCount: completed.length,
        onboardCount: onboard.length,
        waitingCount: waiting.length,
        rejectedCount: rejected.length,
        servedPct,
        avgWaitMin,
        avgOccupancy,
        totalDistanceMin
      }
    };
  }

  function getEvents() {
    return [...events];
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  // Pre-seed a couple of initial realistic requests so the UI feels alive immediately
  addRequest({ pickup: 'hostel_a', dropoff: 'library', passengers: 1, windowMin: 10, maxDetourMin: 6 });
  addRequest({ pickup: 'hostel_b', dropoff: 'canteen_central', passengers: 1, windowMin: 10, maxDetourMin: 6 });

  return {
    tick,
    run,
    addRequest,
    cancelRequest,
    breakVehicle,
    closeRoad,
    reopenRoad,
    getState,
    getEvents,
    subscribe
  };
}

/**
 * Headless scenario comparator:
 * Runs the simulation for `durationMin` minutes in 'pool' and 'solo' mode with identical requests.
 */
export function runScenario({
  campus = MOCK_CAMPUS,
  seed = 42,
  mode = 'pool',
  durationMin = 60
} = {}) {
  const sim = createSimulation({
    campus,
    seed,
    mode,
    vehicleCount: 3,
    capacity: 4
  });

  const rng = createRNG(seed);
  const nodeIds = campus.nodes.map(n => n.id);

  // Generate deterministic requests throughout the scenario duration
  const totalTicks = Math.floor(durationMin * 6); // 1 tick = 10 sec = 1/6 min
  const requestSchedule = new Map();

  // Burst at t=15 and t=40
  const burstTimes = [15, 40];
  for (let m = 2; m < durationMin - 5; m += 3) {
    const isBurst = burstTimes.includes(m);
    const count = isBurst ? 4 : (rng() > 0.4 ? 1 : 0);

    for (let c = 0; c < count; c++) {
      const pIdx = Math.floor(rng() * nodeIds.length);
      let dIdx = Math.floor(rng() * nodeIds.length);
      if (dIdx === pIdx) dIdx = (pIdx + 1) % nodeIds.length;

      const tickIndex = Math.floor(m * 6);
      if (!requestSchedule.has(tickIndex)) requestSchedule.set(tickIndex, []);
      requestSchedule.get(tickIndex).push({
        pickup: nodeIds[pIdx],
        dropoff: nodeIds[dIdx],
        passengers: 1,
        windowMin: 10,
        maxDetourMin: 6
      });
    }
  }

  // Execute ticks
  let occupancySamples = [];

  for (let t = 0; t < totalTicks; t++) {
    if (requestSchedule.has(t)) {
      for (const req of requestSchedule.get(t)) {
        sim.addRequest(req);
      }
    }
    sim.tick();

    const state = sim.getState();
    const curOccupancy = state.vehicles.reduce((acc, v) => acc + v.occupancy, 0) / state.vehicles.length;
    occupancySamples.push(curOccupancy);
  }

  const finalState = sim.getState();
  const completed = finalState.requests.filter(r => r.status === 'completed');
  const rejected = finalState.requests.filter(r => r.status === 'rejected');
  const totalRequests = finalState.requests.length;

  let totalWait = 0;
  for (const r of completed) {
    if (r.pickedUpAt !== null && r.createdAt !== null) {
      totalWait += Math.max(0, r.pickedUpAt - r.createdAt);
    }
  }

  const avgWaitMin = completed.length > 0 ? parseFloat((totalWait / completed.length).toFixed(1)) : 0;
  const servedPct = totalRequests > 0 ? parseFloat(((completed.length / totalRequests) * 100).toFixed(1)) : 0;
  const missedPickups = rejected.length;
  const totalDistanceMin = finalState.metrics.totalDistanceMin;
  const avgOccupancy = occupancySamples.length > 0
    ? parseFloat((occupancySamples.reduce((a, b) => a + b, 0) / occupancySamples.length).toFixed(2))
    : 0;

  const perVehicle = finalState.vehicles.map(v => ({
    id: v.id,
    status: v.status,
    occupancy: v.occupancy
  }));

  return {
    totalDistanceMin,
    avgWaitMin,
    missedPickups,
    servedPct,
    avgOccupancy,
    perVehicle
  };
}
