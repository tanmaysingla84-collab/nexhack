/**
 * /src/engine/scenario.js
 * Headless scenario comparator:
 * Evaluates performance of 'pool' vs 'solo' dispatching under identical demand sequences.
 */

import { createSimulation } from './engine.js';
import { createRNG } from './models.js';

/**
 * Runs a headless simulation scenario for durationMin and returns summary KPIs.
 * 
 * @param {Object} options
 * @param {Object} options.campus
 * @param {number} [options.seed=42]
 * @param {'pool'|'solo'} [options.mode='pool']
 * @param {number} [options.durationMin=60]
 * @param {number} [options.vehicleCount=3]
 * @param {number} [options.capacity=4]
 * @returns {{
 *   totalDistanceMin: number,
 *   avgWaitMin: number,
 *   missedPickups: number,
 *   servedPct: number,
 *   avgOccupancy: number,
 *   perVehicle: Array<{id: string, status: string, occupancy: number}>
 * }}
 */
export function runScenario({
  campus,
  seed = 42,
  mode = 'pool',
  durationMin = 60,
  vehicleCount = 3,
  capacity = 4
} = {}) {
  const sim = createSimulation({
    campus,
    seed,
    mode,
    vehicleCount,
    capacity
  });

  const rng = createRNG(seed);
  const nodeIds = campus.nodes.map(n => n.id);

  const totalTicks = Math.floor(durationMin * 6); // 1 tick = 10 sec = 1/6 min
  const requestSchedule = new Map();

  // Deterministic demand generation with burst periods at t=15 and t=40
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
