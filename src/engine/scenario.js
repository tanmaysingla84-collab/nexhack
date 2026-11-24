/**
 * /src/engine/scenario.js
 * Headless Comparative Scenario Evaluator (Dynamic Pooling vs Solo Direct Rides).
 * Accurately computes:
 *  - total distance traveled (minutes)
 *  - average and p95 passenger wait time
 *  - missed pickups (rejected or window expired)
 *  - average seat occupancy & seat utilization
 *  - percentage of requests served
 */

import { createSimulation } from './engine.js';
import { createRNG } from './models.js';

export function runScenario({
  campus,
  seed = 42,
  mode = 'pool',
  durationMin = 60,
  vehicleCount = 3,
  capacity = 4,
  maxDetourFactor = 1.5
} = {}) {
  const sim = createSimulation({
    campus,
    seed,
    mode,
    vehicleCount,
    capacity,
    maxDetourFactor
  });

  const rng = createRNG(seed);
  const nodeIds = campus.nodes.map(n => n.id);
  const totalTicks = Math.floor(durationMin * 6); // 1 tick = 10 sec = 1/6 min
  const requestSchedule = new Map();

  // Generate realistic campus peak traffic (e.g. class dismissals at t=15 and t=40)
  const burstTimes = [15, 40];
  for (let m = 2; m < durationMin - 4; m += 3) {
    const isBurst = burstTimes.includes(m);
    const count = isBurst ? 4 : (rng() > 0.45 ? 1 : 0);

    for (let c = 0; c < count; c++) {
      const pIdx = Math.floor(rng() * nodeIds.length);
      let dIdx = Math.floor(rng() * nodeIds.length);
      if (dIdx === pIdx) dIdx = (pIdx + 1) % nodeIds.length;

      const tickIdx = Math.floor(m * 6);
      if (!requestSchedule.has(tickIdx)) requestSchedule.set(tickIdx, []);
      requestSchedule.get(tickIdx).push({
        pickup: nodeIds[pIdx],
        dropoff: nodeIds[dIdx],
        passengers: 1,
        windowMin: 10,
        maxDetourFactor
      });
    }
  }

  const occupancySamples = [];

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

  const waitTimes = [];
  for (const r of completed) {
    if (r.pickedUpAt !== null && r.createdAt !== null) {
      waitTimes.push(Math.max(0, r.pickedUpAt - r.createdAt));
    }
  }

  waitTimes.sort((a, b) => a - b);
  const avgWaitMin = waitTimes.length > 0
    ? parseFloat((waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length).toFixed(1))
    : 0;

  const p95Index = Math.floor(waitTimes.length * 0.95);
  const p95WaitMin = waitTimes.length > 0
    ? parseFloat((waitTimes[p95Index] || waitTimes[waitTimes.length - 1]).toFixed(1))
    : 0;

  const servedPct = totalRequests > 0
    ? parseFloat(((completed.length / totalRequests) * 100).toFixed(1))
    : 0;

  const missedPickups = rejected.length;
  const totalDistanceMin = finalState.metrics.totalDistanceMin;
  const avgOccupancy = occupancySamples.length > 0
    ? parseFloat((occupancySamples.reduce((a, b) => a + b, 0) / occupancySamples.length).toFixed(2))
    : 0;

  const seatUtilPct = capacity > 0
    ? parseFloat(((avgOccupancy / capacity) * 100).toFixed(1))
    : 0;

  const perVehicle = finalState.vehicles.map(v => ({
    id: v.id,
    status: v.status,
    occupancy: v.occupancy,
    totalDistanceMin: v.totalDistanceMin
  }));

  return {
    mode,
    totalDistanceMin,
    avgWaitMin,
    p95WaitMin,
    missedPickups,
    servedPct,
    avgOccupancy,
    seatUtilPct,
    perVehicle,
    totalRequests,
    completedCount: completed.length
  };
}
