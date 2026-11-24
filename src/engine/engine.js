/**
 * /src/engine/engine.js
 * Core Campus Ride Pooling Simulation Engine.
 * Implements Interface Contract with dynamic disruptions, greedy pooling dispatch,
 * deterministic mulberry32 RNG, and event logging.
 */

import { CampusGraph } from './graph.js';
import { createRNG } from './models.js';
import { dispatchRequest, calculateStopsArrivals } from './dispatcher.js';

// Colorblind-safe palettes (Tol/Okabe-Ito inspired)
const VEHICLE_COLORS = ['#0284c7', '#d97706', '#7c3aed', '#059669', '#e11d48', '#0891b2', '#ea580c'];

/**
 * Creates a deterministic campus ride pooling simulation instance.
 * 
 * @param {Object} options
 * @param {Object} options.campus Campus topology {nodes, edges}
 * @param {number} [options.seed=42] Deterministic RNG seed
 * @param {'pool'|'solo'} [options.mode='pool'] Operating mode: dynamic pooling or solo
 * @param {number} [options.vehicleCount=3] Number of shuttles
 * @param {number} [options.capacity=4] Seating capacity per vehicle
 * @returns {Object} Simulation controller conforming to Interface Contract
 */
export function createSimulation({
  campus,
  seed = 42,
  mode = 'pool',
  vehicleCount = 3,
  capacity = 4
} = {}) {
  if (!campus || !campus.nodes || !campus.edges) {
    throw new Error('Campus topology with nodes and edges must be provided.');
  }

  const rng = createRNG(seed);
  const clonedNodes = JSON.parse(JSON.stringify(campus.nodes));
  const clonedEdges = JSON.parse(JSON.stringify(campus.edges));
  const graph = new CampusGraph(clonedNodes, clonedEdges);

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

  // Initial vehicles placed at key hubs
  const hubNodeIds = ['main_gate', 'library', 'sports_complex', 'tech_tower', 'hostel_b', 'canteen_central'];
  const vehicles = [];
  for (let i = 0; i < vehicleCount; i++) {
    const startNodeId = hubNodeIds[i % hubNodeIds.length] || clonedNodes[0].id;
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
      route: [],
      stops: [],
      onboard: [],
      color: VEHICLE_COLORS[i % VEHICLE_COLORS.length],
      totalDistanceMin: 0
    });
  }

  const requests = [];

  function notify() {
    const currentState = getState();
    for (const fn of listeners) {
      try {
        fn(currentState);
      } catch (err) {
        console.error('Error in simulation subscriber:', err);
      }
    }
  }

  /**
   * Updates a vehicle's upcoming node route sequence based on its stops.
   * @param {import('./models.js').Vehicle} vehicle
   */
  function updateVehicleRoute(vehicle) {
    if (vehicle.stops.length === 0) {
      vehicle.route = [];
      if (vehicle.status !== 'broken') {
        vehicle.status = 'idle';
        vehicle.targetNode = null;
        vehicle.progressFraction = 0;
      }
      return;
    }

    if (vehicle.status !== 'broken') {
      vehicle.status = 'moving';
    }

    const fullRoute = [];
    let start = vehicle.targetNode ? vehicle.targetNode : vehicle.currentNode;
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
   * Adds a student ride request and runs dispatcher.
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

    const earliestPickup = time;
    const latestPickup = time + windowMin;
    // Guaranteed promise: direct travel + window + allowed detour
    const promisedLatestDropoff = (directMinutes < Infinity)
      ? (time + windowMin + directMinutes + maxDetourMin)
      : null;

    const reqObj = {
      id: requestId,
      pickup,
      dropoff,
      passengers,
      windowMin,
      maxDetourMin,
      earliestPickup,
      latestPickup,
      status: 'waiting',
      vehicleId: null,
      rejectionReason: null,
      reasons: [],
      createdAt: parseFloat(time.toFixed(1)),
      pickedUpAt: null,
      completedAt: null,
      promisedLatestDropoff: promisedLatestDropoff !== null ? parseFloat(promisedLatestDropoff.toFixed(1)) : null
    };

    const dispatchResult = dispatchRequest({
      request: reqObj,
      vehicles,
      requests,
      currentTime: time,
      graph,
      mode
    });

    if (!dispatchResult.success) {
      reqObj.status = 'rejected';
      reqObj.rejectionReason = dispatchResult.rejectionReason || 'No feasible shuttle slot found';
      reqObj.reasons = dispatchResult.reasons;
      requests.push(reqObj);

      logEvent('rejection', `Request ${requestId} (${pickup} -> ${dropoff}) rejected: ${reqObj.rejectionReason}`, {
        requestId,
        reasons: reqObj.reasons
      });
      notify();
      return {
        requestId,
        status: 'rejected',
        vehicleId: null,
        rejectionReason: reqObj.rejectionReason,
        reasons: reqObj.reasons
      };
    }

    // Success
    const chosenVehicle = vehicles.find(v => v.id === dispatchResult.vehicleId);
    chosenVehicle.stops = dispatchResult.stops;
    updateVehicleRoute(chosenVehicle);

    reqObj.status = 'assigned';
    reqObj.vehicleId = chosenVehicle.id;
    requests.push(reqObj);

    const plannedEta = chosenVehicle.stops.find(s => s.requestId === requestId && s.type === 'pickup')?.plannedArrival;
    logEvent('assignment', `Request ${requestId} assigned to ${chosenVehicle.id} (${pickup} -> ${dropoff}). Planned pickup: t=${plannedEta}m`, {
      requestId,
      vehicleId: chosenVehicle.id
    });

    notify();
    return {
      requestId,
      status: 'assigned',
      vehicleId: chosenVehicle.id
    };
  }

  /**
   * Cancels a student ride request.
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
        const arrivals = calculateStopsArrivals(v, v.stops, time, graph);
        if (arrivals) {
          v.stops.forEach((s, idx) => {
            s.plannedArrival = parseFloat(arrivals[idx].toFixed(1));
          });
        }
        updateVehicleRoute(v);
      }
    }

    logEvent('cancellation', `Request ${requestId} cancelled. Vehicle route freed.`, { requestId, vehicleId: vId });
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

    // Handle onboard riders: deboard at current safe node
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

    // Unpicked stops: return to pool and attempt redispatch
    const unpickedStopReqIds = Array.from(new Set(v.stops.filter(s => s.type === 'pickup').map(s => s.requestId)));
    v.stops = [];
    v.route = [];

    for (const rId of unpickedStopReqIds) {
      const r = requests.find(req => req.id === rId);
      if (r && r.status === 'assigned') {
        r.status = 'waiting';
        r.vehicleId = null;
        logEvent('disruption', `Ride ${r.id} returned to pool due to breakdown of ${v.id}.`, { requestId: r.id });

        const redispatch = dispatchRequest({
          request: r,
          vehicles,
          requests,
          currentTime: time,
          graph,
          mode
        });

        if (redispatch.success) {
          const newV = vehicles.find(veh => veh.id === redispatch.vehicleId);
          newV.stops = redispatch.stops;
          updateVehicleRoute(newV);
          r.status = 'assigned';
          r.vehicleId = newV.id;
          logEvent('assignment', `Ride ${r.id} re-assigned to ${newV.id} after breakdown.`, { requestId: r.id, vehicleId: newV.id });
        } else {
          r.status = 'rejected';
          r.rejectionReason = `Cannot reassign after breakdown: ${redispatch.rejectionReason}`;
          r.reasons = redispatch.reasons;
          logEvent('rejection', `Ride ${r.id} rejected after breakdown: ${r.rejectionReason}`, { requestId: r.id, reasons: r.reasons });
        }
      }
    }

    notify();
  }

  /**
   * Disruption: Close road edge
   */
  function closeRoad(edgeId) {
    const success = graph.closeRoad(edgeId);
    if (!success) return;

    const edge = clonedEdges.find(e => e.id === edgeId);
    if (edge) edge.closed = true;

    logEvent('road_closed', `Road closed: ${edge ? edge.from + ' <-> ' + edge.to : edgeId} (${edgeId})`, { edgeId });

    // Re-validate every active route
    for (const v of vehicles) {
      if (v.status === 'broken' || v.stops.length === 0) continue;

      const arrivals = calculateStopsArrivals(v, v.stops, time, graph);
      if (!arrivals) {
        logEvent('reroute_failed', `Vehicle ${v.id} route blocked by road closure. Handling affected stops...`, { vehicleId: v.id });
        // Separate unpicked stops from onboard stops
        const unpickedStops = v.stops.filter(s => s.type === 'pickup');
        for (const upStop of unpickedStops) {
          const req = requests.find(r => r.id === upStop.requestId);
          if (req && req.status === 'assigned') {
            v.stops = v.stops.filter(s => s.requestId !== req.id);
            req.status = 'waiting';
            req.vehicleId = null;
            logEvent('disruption', `Request ${req.id} unassigned from ${v.id} due to impassable closure.`, { requestId: req.id });
          }
        }
        updateVehicleRoute(v);
      } else {
        v.stops.forEach((s, idx) => {
          s.plannedArrival = parseFloat(arrivals[idx].toFixed(1));
        });
        updateVehicleRoute(v);
        logEvent('rerouted', `Vehicle ${v.id} rerouted around closed road ${edgeId}.`, { vehicleId: v.id });
      }
    }

    notify();
  }

  /**
   * Reopen road edge
   */
  function reopenRoad(edgeId) {
    const success = graph.reopenRoad(edgeId);
    if (!success) return;

    const edge = clonedEdges.find(e => e.id === edgeId);
    if (edge) edge.closed = false;

    logEvent('road_reopened', `Road reopened: ${edge ? edge.from + ' <-> ' + edge.to : edgeId} (${edgeId})`, { edgeId });

    // Recompute optimal routes for vehicles with stops
    for (const v of vehicles) {
      if (v.status !== 'broken' && v.stops.length > 0) {
        const arrivals = calculateStopsArrivals(v, v.stops, time, graph);
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
   * Advances simulation by 1 tick (10 simulated seconds = 1/6 min).
   */
  function tick() {
    const dt = 1 / 6; // minutes
    time = parseFloat((time + dt).toFixed(2));

    for (const vehicle of vehicles) {
      if (vehicle.status === 'broken') continue;

      if (vehicle.stops.length === 0) {
        vehicle.status = 'idle';
        vehicle.progressFraction = 0;
        vehicle.targetNode = null;
        continue;
      }

      vehicle.status = 'moving';
      const nextStop = vehicle.stops[0];

      if (vehicle.currentNode === nextStop.node && vehicle.progressFraction === 0 && !vehicle.targetNode) {
        handleStopArrival(vehicle, nextStop);
        continue;
      }

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
        logEvent('pickup', `Vehicle ${vehicle.id} picked up rider ${req.id} at ${stop.node} (Occupancy: ${vehicle.occupancy}/${vehicle.capacity})`, {
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

    vehicle.stops.shift();
    updateVehicleRoute(vehicle);
  }

  function run(nTicks = 1) {
    for (let i = 0; i < nTicks; i++) {
      tick();
    }
  }

  function getState() {
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
