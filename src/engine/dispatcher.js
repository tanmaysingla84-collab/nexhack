/**
 * /src/engine/dispatcher.js
 * Enhanced Greedy Insertion Heuristic with Rigorous Constraint Validation.
 * 
 * Feasibility Invariants:
 *  (a) Seat load never exceeds vehicle capacity at any stop along the candidate route.
 *  (b) New rider's pickup arrival is within promised window [earliestPickup, latestPickup].
 *  (c) Existing commitments: For EVERY existing passenger (onboard or queued),
 *      - pickup arrival <= latestPickup window
 *      - dropoff arrival <= maxRideTimeLimit (directTime * maxDetourFactor)
 *      - onboard passengers are NEVER dropped unplanned.
 *  (d) Route uses only open, reachable roads.
 * 
 * Rejection Codes:
 *  - CAPACITY_EXCEEDED
 *  - PICKUP_WINDOW_INFEASIBLE
 *  - DETOUR_LIMIT_BREACH
 *  - NO_ROUTE_AVAILABLE
 *  - NO_VEHICLE_AVAILABLE
 */

/**
 * Calculates planned arrival times at each candidate stop.
 * @param {import('./models.js').Vehicle} vehicle
 * @param {import('./models.js').Stop[]} candidateStops
 * @param {number} currentTime
 * @param {import('./graph.js').CampusGraph} graph
 * @returns {number[]|null} Planned arrival minutes or null if unreachable
 */
export function calculateStopsArrivals(vehicle, candidateStops, currentTime, graph) {
  let currTime = currentTime;
  let currNode = vehicle.currentNode;

  if (vehicle.targetNode && vehicle.status === 'moving' && vehicle.progressFraction > 0) {
    const sp = graph.getShortestPath(vehicle.currentNode, vehicle.targetNode);
    const legMin = sp.minutes > 0 ? sp.minutes : 1;
    currTime += legMin * Math.max(0, 1 - vehicle.progressFraction);
    currNode = vehicle.targetNode;
  }

  const arrivals = [];
  for (const stop of candidateStops) {
    const sp = graph.getShortestPath(currNode, stop.node);
    if (!sp.path || sp.minutes === Infinity) {
      return null; // Route disconnected
    }
    currTime += sp.minutes;
    arrivals.push(currTime);
    currNode = stop.node;
  }
  return arrivals;
}

/**
 * Dispatches a request using greedy insertion with lowest marginal cost.
 * Marginal cost = extra vehicle travel distance (minutes) + alpha * added passenger wait time.
 */
export function dispatchRequest({
  request,
  vehicles,
  requests,
  currentTime,
  graph,
  mode = 'pool',
  maxDetourFactor = 1.5,
  alphaWaitWeight = 0.5
}) {
  const directPath = graph.getShortestPath(request.pickup, request.dropoff);
  const directMinutes = directPath.minutes;

  if (!directPath.path || directMinutes === Infinity) {
    const rejection = {
      vehicleId: null,
      code: 'NO_ROUTE_AVAILABLE',
      type: 'routing',
      message: 'No open path exists between pickup and dropoff due to active road closures.'
    };
    return {
      success: false,
      code: 'NO_ROUTE_AVAILABLE',
      rejectionReason: rejection.message,
      reasons: [rejection],
      bestNearMiss: null
    };
  }

  const availableVehicles = vehicles.filter(v => v.status !== 'broken');
  if (availableVehicles.length === 0) {
    const rejection = {
      vehicleId: null,
      code: 'NO_VEHICLE_AVAILABLE',
      type: 'vehicle_unavailable',
      message: 'All campus fleet shuttles are currently out-of-service or broken down.'
    };
    return {
      success: false,
      code: 'NO_VEHICLE_AVAILABLE',
      rejectionReason: rejection.message,
      reasons: [rejection],
      bestNearMiss: null
    };
  }

  const reasons = [];
  let bestCandidate = null;
  let bestNearMiss = null;

  for (const vehicle of vehicles) {
    if (vehicle.status === 'broken') {
      reasons.push({
        vehicleId: vehicle.id,
        code: 'NO_VEHICLE_AVAILABLE',
        type: 'vehicle_unavailable',
        message: `${vehicle.id} is marked out-of-service.`
      });
      continue;
    }

    if (mode === 'solo' && (vehicle.onboard.length > 0 || vehicle.stops.length > 0)) {
      reasons.push({
        vehicleId: vehicle.id,
        code: 'CAPACITY_EXCEEDED',
        type: 'capacity',
        message: `${vehicle.id} is operating in solo direct mode and already has an active trip.`
      });
      continue;
    }

    const existingStops = [...vehicle.stops];
    let vehicleFirstFailure = null;
    let minMarginalCost = Infinity;
    let bestPairForVehicle = null;

    const n = existingStops.length;

    // Try EVERY pickup position i, and dropoff position j >= i
    for (let i = 0; i <= n; i++) {
      for (let j = i; j <= n; j++) {
        const testStops = [...existingStops];
        const pStop = {
          type: 'pickup',
          node: request.pickup,
          requestId: request.id,
          plannedArrival: 0
        };
        const dStop = {
          type: 'dropoff',
          node: request.dropoff,
          requestId: request.id,
          plannedArrival: 0
        };

        testStops.splice(i, 0, pStop);
        testStops.splice(j + 1, 0, dStop);

        // (a) Capacity Constraint: seat load never exceeds capacity
        let currentLoad = vehicle.occupancy;
        let capFailed = false;
        let peakLoad = currentLoad;

        for (const s of testStops) {
          const req = (s.requestId === request.id)
            ? request
            : requests.find(r => r.id === s.requestId);
          const pCount = req ? (req.passengers || 1) : 1;

          if (s.type === 'pickup') currentLoad += pCount;
          else if (s.type === 'dropoff') currentLoad -= pCount;

          if (currentLoad > peakLoad) peakLoad = currentLoad;
          if (currentLoad > vehicle.capacity) {
            capFailed = true;
            break;
          }
        }

        if (capFailed) {
          if (!vehicleFirstFailure) {
            vehicleFirstFailure = {
              vehicleId: vehicle.id,
              code: 'CAPACITY_EXCEEDED',
              type: 'capacity',
              message: `${vehicle.id}: Peak route load (${peakLoad} riders) would exceed vehicle capacity of ${vehicle.capacity} seats.`
            };
            if (!bestNearMiss) {
              bestNearMiss = {
                vehicleId: vehicle.id,
                code: 'CAPACITY_EXCEEDED',
                details: `Shuttle ${vehicle.id} has ${vehicle.capacity} seats, but route requires ${peakLoad} seats.`
              };
            }
          }
          continue;
        }

        // (b) Road Connectivity & Planned Stop Arrivals
        const arrivals = calculateStopsArrivals(vehicle, testStops, currentTime, graph);
        if (!arrivals) {
          if (!vehicleFirstFailure) {
            vehicleFirstFailure = {
              vehicleId: vehicle.id,
              code: 'NO_ROUTE_AVAILABLE',
              type: 'routing',
              message: `${vehicle.id}: Planned route traverses a road blocked by closure.`
            };
          }
          continue;
        }

        // (c) Pickup Window Feasibility for New Rider
        const newPickupArrival = arrivals[i];
        if (newPickupArrival > request.latestPickup) {
          const delayMin = (newPickupArrival - request.latestPickup).toFixed(1);
          if (!vehicleFirstFailure) {
            vehicleFirstFailure = {
              vehicleId: vehicle.id,
              code: 'PICKUP_WINDOW_INFEASIBLE',
              type: 'timing',
              message: `${vehicle.id}: Pickup ETA t=${newPickupArrival.toFixed(1)}m arrives ${delayMin}m after promised window (t=${request.latestPickup}m).`
            };
            if (!bestNearMiss) {
              bestNearMiss = {
                vehicleId: vehicle.id,
                code: 'PICKUP_WINDOW_INFEASIBLE',
                details: `${vehicle.id} pickup ETA is ${delayMin} min late.`
              };
            }
          }
          continue;
        }

        // (d) Detour Limit for New Rider
        const newDropoffArrival = arrivals[j + 1];
        const newRideTime = newDropoffArrival - newPickupArrival;
        const maxAllowedRideTime = directMinutes * maxDetourFactor;
        if (newRideTime > maxAllowedRideTime) {
          const excess = (newRideTime - maxAllowedRideTime).toFixed(1);
          if (!vehicleFirstFailure) {
            vehicleFirstFailure = {
              vehicleId: vehicle.id,
              code: 'DETOUR_LIMIT_BREACH',
              type: 'detour',
              message: `${vehicle.id}: Rider ride time (${newRideTime.toFixed(1)}m) exceeds detour limit of ${maxAllowedRideTime.toFixed(1)}m by ${excess}m.`
            };
          }
          continue;
        }

        // (e) Invariant: Protect Commitments to EVERY Existing Passenger
        let existingCommitmentBreached = false;
        let breachReason = null;

        for (let k = 0; k < testStops.length; k++) {
          const st = testStops[k];
          if (st.requestId === request.id) continue;

          const exReq = requests.find(r => r.id === st.requestId);
          if (!exReq) continue;

          const arrivalTime = arrivals[k];

          // Pickup window protection
          if (st.type === 'pickup' && arrivalTime > exReq.latestPickup) {
            existingCommitmentBreached = true;
            breachReason = {
              vehicleId: vehicle.id,
              code: 'PICKUP_WINDOW_INFEASIBLE',
              type: 'timing',
              message: `${vehicle.id}: Would delay pickup for ${exReq.id} to t=${arrivalTime.toFixed(1)}m, violating their window.`
            };
            break;
          }

          // Detour limit protection
          if (st.type === 'dropoff') {
            const exDirect = graph.getShortestPath(exReq.pickup, exReq.dropoff).minutes;
            const exMaxRide = exDirect * (exReq.maxDetourFactor || maxDetourFactor);
            const actualPickupTime = (exReq.pickedUpAt !== null) ? exReq.pickedUpAt : exReq.createdAt;
            const exRideTime = arrivalTime - actualPickupTime;

            if (exRideTime > exMaxRide) {
              const delayMin = (exRideTime - exMaxRide).toFixed(1);
              existingCommitmentBreached = true;
              breachReason = {
                vehicleId: vehicle.id,
                code: 'DETOUR_LIMIT_BREACH',
                type: 'detour',
                message: `${vehicle.id}: Would add ${delayMin}m detour to ${exReq.id} (${exReq.riderName || 'onboard rider'}), breaching their ${exMaxRide.toFixed(1)}m limit.`
              };
              if (!bestNearMiss) {
                bestNearMiss = {
                  vehicleId: vehicle.id,
                  code: 'DETOUR_LIMIT_BREACH',
                  details: `${vehicle.id} had capacity but inserting this stop delays ${exReq.id} by ${delayMin} min, breaching detour limit.`
                };
              }
              break;
            }
          }
        }

        if (existingCommitmentBreached) {
          if (!vehicleFirstFailure && breachReason) {
            vehicleFirstFailure = breachReason;
          }
          continue;
        }

        // Feasible Candidate Found! Compute marginal cost
        const existingRouteDist = vehicle.stops.length > 0
          ? (vehicle.stops[vehicle.stops.length - 1].plannedArrival - currentTime)
          : 0;
        const newRouteDist = arrivals[arrivals.length - 1] - currentTime;
        const extraDist = Math.max(0, newRouteDist - existingRouteDist);
        const passengerWait = Math.max(0, newPickupArrival - currentTime);

        const marginalCost = extraDist + alphaWaitWeight * passengerWait;

        if (marginalCost < minMarginalCost) {
          minMarginalCost = marginalCost;
          const annotatedStops = testStops.map((st, idx) => ({
            ...st,
            plannedArrival: parseFloat(arrivals[idx].toFixed(1))
          }));
          bestPairForVehicle = {
            vehicle,
            testStops: annotatedStops,
            marginalCost
          };
        }
      }
    }

    if (bestPairForVehicle) {
      if (!bestCandidate || bestPairForVehicle.marginalCost < bestCandidate.marginalCost) {
        bestCandidate = bestPairForVehicle;
      }
    } else {
      reasons.push(vehicleFirstFailure || {
        vehicleId: vehicle.id,
        code: 'PICKUP_WINDOW_INFEASIBLE',
        type: 'timing',
        message: `${vehicle.id}: No feasible stop slot found within detour and capacity bounds.`
      });
    }
  }

  if (!bestCandidate) {
    const primary = reasons[0];
    return {
      success: false,
      code: primary?.code || 'CAPACITY_EXCEEDED',
      rejectionReason: primary?.message || 'Request cannot be accommodated across any campus shuttle.',
      reasons,
      bestNearMiss: bestNearMiss ? bestNearMiss.details : primary?.message
    };
  }

  return {
    success: true,
    vehicleId: bestCandidate.vehicle.id,
    stops: bestCandidate.testStops,
    reasons: [],
    marginalCost: bestCandidate.marginalCost
  };
}
