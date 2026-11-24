/**
 * /src/engine/dispatcher.js
 * Greedy insertion heuristic dispatcher with strict constraint validation.
 * Supports pooled vs solo mode, capacity tracking, pickup windows, detour limits,
 * existing passenger guarantees, and detailed structured rejection reasons.
 */

/**
 * Calculates planned stop arrivals for a vehicle given current time and candidate stops.
 * Takes into account whether the vehicle is currently mid-transit between currentNode and targetNode.
 * 
 * @param {import('./models.js').Vehicle} vehicle
 * @param {import('./models.js').Stop[]} candidateStops
 * @param {number} currentTime
 * @param {import('./graph.js').CampusGraph} graph
 * @returns {number[]|null} Array of planned arrival times at each candidate stop, or null if unreachable
 */
export function calculateStopsArrivals(vehicle, candidateStops, currentTime, graph) {
  let currTime = currentTime;
  let currNode = vehicle.currentNode;

  // If vehicle is moving towards a targetNode, account for remaining time to reach targetNode
  if (vehicle.targetNode && vehicle.status === 'moving' && vehicle.progressFraction > 0) {
    const sp = graph.getShortestPath(vehicle.currentNode, vehicle.targetNode);
    const legMinutes = (sp.minutes > 0 ? sp.minutes : 1);
    const remainingMinutes = legMinutes * Math.max(0, 1 - vehicle.progressFraction);
    currTime += remainingMinutes;
    currNode = vehicle.targetNode;
  }

  const arrivals = [];
  for (const stop of candidateStops) {
    const sp = graph.getShortestPath(currNode, stop.node);
    if (!sp.path || sp.minutes === Infinity) {
      return null; // unreachable due to road closure or disconnection
    }
    currTime += sp.minutes;
    arrivals.push(currTime);
    currNode = stop.node;
  }
  return arrivals;
}

/**
 * Dispatches a new ride request using greedy insertion heuristic.
 * 
 * @param {Object} params
 * @param {import('./models.js').Request} params.request
 * @param {import('./models.js').Vehicle[]} params.vehicles
 * @param {import('./models.js').Request[]} params.requests
 * @param {number} params.currentTime
 * @param {import('./graph.js').CampusGraph} params.graph
 * @param {'pool'|'solo'} params.mode
 * @returns {{
 *   success: boolean,
 *   vehicleId?: string,
 *   stops?: import('./models.js').Stop[],
 *   reasons: import('./models.js').RejectionReason[],
 *   rejectionReason?: string
 * }}
 */
export function dispatchRequest({
  request,
  vehicles,
  requests,
  currentTime,
  graph,
  mode = 'pool'
}) {
  const directPath = graph.getShortestPath(request.pickup, request.dropoff);
  const directMinutes = directPath.minutes;

  // Unreachable pickup to dropoff
  if (!directPath.path || directMinutes === Infinity) {
    const rejection = {
      vehicleId: null,
      type: 'routing',
      message: 'No active route between pickup and dropoff due to road closures'
    };
    return {
      success: false,
      reasons: [rejection],
      rejectionReason: rejection.message
    };
  }

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

    const existingStops = [...vehicle.stops];
    let firstFailure = null;
    let minAddedTime = Infinity;
    let bestPair = null;

    const n = existingStops.length;

    // Try EVERY pickup position i (0 to n), and EVERY dropoff position j >= i (i to n)
    for (let i = 0; i <= n; i++) {
      for (let j = i; j <= n; j++) {
        const testStops = [...existingStops];
        const pickupStop = {
          type: 'pickup',
          node: request.pickup,
          requestId: request.id,
          plannedArrival: 0
        };
        const dropoffStop = {
          type: 'dropoff',
          node: request.dropoff,
          requestId: request.id,
          plannedArrival: 0
        };

        // Insert pickup at i, then dropoff at j+1
        testStops.splice(i, 0, pickupStop);
        testStops.splice(j + 1, 0, dropoffStop);

        // (a) Capacity constraint: seats never exceed vehicle.capacity at any point
        let occ = vehicle.occupancy;
        let capacityExceeded = false;
        for (const s of testStops) {
          const req = (s.requestId === request.id)
            ? request
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

        // Compute planned arrivals at every stop
        const arrivals = calculateStopsArrivals(vehicle, testStops, currentTime, graph);
        if (!arrivals) {
          if (!firstFailure) {
            firstFailure = {
              vehicleId: vehicle.id,
              type: 'routing',
              message: `${vehicle.id}: Route unreachable due to closed road`
            };
          }
          continue;
        }

        // (b) Timing for new pickup: arrival must be within [earliest, latest]
        const pickupArrival = arrivals[i];
        if (pickupArrival > request.latestPickup) {
          if (!firstFailure) {
            firstFailure = {
              vehicleId: vehicle.id,
              type: 'timing',
              message: `${vehicle.id}: Pickup ETA ${(pickupArrival - currentTime).toFixed(1)}m exceeds ${request.windowMin}m window`
            };
          }
          continue;
        }

        // Timing for new dropoff: must not exceed promisedLatestDropoff
        const dropoffArrival = arrivals[j + 1];
        if (request.promisedLatestDropoff && dropoffArrival > request.promisedLatestDropoff) {
          if (!firstFailure) {
            firstFailure = {
              vehicleId: vehicle.id,
              type: 'detour',
              message: `${vehicle.id}: Dropoff detour would exceed max allowed detour (+${request.maxDetourMin}m)`
            };
          }
          continue;
        }

        // (c) EVERY existing passenger's promise still holds
        let promiseBroken = false;
        let brokenReason = null;
        for (let k = 0; k < testStops.length; k++) {
          const st = testStops[k];
          if (st.requestId === request.id) continue;
          const exReq = requests.find(r => r.id === st.requestId);
          if (!exReq) continue;

          const stArrival = arrivals[k];
          if (st.type === 'pickup' && stArrival > exReq.latestPickup) {
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

        // Feasible candidate! Added time relative to existing route or empty
        const totalRouteTime = arrivals[arrivals.length - 1] - currentTime;
        if (totalRouteTime < minAddedTime) {
          minAddedTime = totalRouteTime;
          const annotatedStops = testStops.map((st, idx) => ({
            ...st,
            plannedArrival: parseFloat(arrivals[idx].toFixed(1))
          }));
          bestPair = {
            vehicle,
            testStops: annotatedStops,
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
    const primaryReason = reasons[0]?.message || 'All vehicles busy or constraints exceeded';
    return {
      success: false,
      reasons,
      rejectionReason: primaryReason
    };
  }

  return {
    success: true,
    vehicleId: bestCandidate.vehicle.id,
    stops: bestCandidate.testStops,
    reasons: []
  };
}
