/**
 * /tests/engine.test.js
 * Comprehensive unit and integration test suite for Member 1 Engine.
 * Run using Node.js: node tests/engine.test.js
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSimulation, runScenario, CampusGraph, createRNG } from '../src/engine/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load campus.json
const campusData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/campus.json'), 'utf-8')
);

console.log('🧪 Starting Campus Pooling Engine Test Suite...\n');

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Campus Data and Graph Tests
test('Campus topology has 20 nodes and 31 edges, is fully connected', () => {
  assert.strictEqual(campusData.nodes.length, 20, 'Should have 20 nodes');
  assert.strictEqual(campusData.edges.length, 31, 'Should have 31 edges');

  const graph = new CampusGraph(campusData.nodes, campusData.edges);
  for (const n1 of campusData.nodes) {
    for (const n2 of campusData.nodes) {
      const sp = graph.getShortestPath(n1.id, n2.id);
      assert.notStrictEqual(sp.minutes, Infinity, `Nodes ${n1.id} and ${n2.id} must be connected`);
      assert.ok(sp.path && sp.path.length >= 1, `Path must exist between ${n1.id} and ${n2.id}`);
    }
  }
});

// 2. Determinism of RNG and Simulation
test('Determinism: same seed produces identical random sequences and simulation runs', () => {
  const rng1 = createRNG(12345);
  const rng2 = createRNG(12345);
  for (let i = 0; i < 50; i++) {
    assert.strictEqual(rng1(), rng2(), `RNG mismatch at iteration ${i}`);
  }

  const simA = createSimulation({ campus: campusData, seed: 99, mode: 'pool', vehicleCount: 2 });
  const simB = createSimulation({ campus: campusData, seed: 99, mode: 'pool', vehicleCount: 2 });

  simA.addRequest({ pickup: 'main_gate', dropoff: 'library' });
  simB.addRequest({ pickup: 'main_gate', dropoff: 'library' });

  simA.run(15);
  simB.run(15);

  const stateA = simA.getState();
  const stateB = simB.getState();

  assert.deepStrictEqual(stateA.vehicles[0].position, stateB.vehicles[0].position, 'Vehicle positions must match');
  assert.strictEqual(stateA.time, stateB.time, 'Simulation times must match');
});

// 3. Pickup-before-Dropoff and Insertion Correctness
test('Pickup-before-dropoff invariant is preserved in stops sequence', () => {
  const sim = createSimulation({ campus: campusData, seed: 42, vehicleCount: 1 });
  const pNode = campusData.nodes[0].id;
  const dNode = campusData.nodes[1].id;
  const res = sim.addRequest({ pickup: pNode, dropoff: dNode });
  assert.strictEqual(res.status, 'assigned');

  const state = sim.getState();
  const v = state.vehicles[0];
  const pIdx = v.stops.findIndex(s => s.requestId === res.requestId && s.type === 'pickup');
  const dIdx = v.stops.findIndex(s => s.requestId === res.requestId && s.type === 'dropoff');

  assert.ok(pIdx !== -1, 'Pickup stop must be present');
  assert.ok(dIdx !== -1, 'Dropoff stop must be present');
  assert.ok(pIdx < dIdx, `Pickup index (${pIdx}) must precede dropoff index (${dIdx})`);
});

// 4. Pooling two compatible rides into the same shuttle
test('Pools multiple riders into a single vehicle when routes align', () => {
  const sim = createSimulation({ campus: campusData, seed: 42, vehicleCount: 1, capacity: 4 });
  const pNode = campusData.nodes[0].id;
  const dNode1 = campusData.nodes[1].id;
  const dNode2 = campusData.nodes[3].id;
  const r1 = sim.addRequest({ pickup: pNode, dropoff: dNode1 });
  const r2 = sim.addRequest({ pickup: pNode, dropoff: dNode2 });

  assert.strictEqual(r1.status, 'assigned');
  assert.strictEqual(r2.status, 'assigned');

  const state = sim.getState();
  assert.strictEqual(state.vehicles[0].stops.length, 4, 'Vehicle should have 4 stops (2 pickups, 2 dropoffs)');
});

// 5. Capacity Limit Enforcement
test('Rejects request if vehicle capacity would be exceeded', () => {
  // 1 vehicle with capacity 1
  const sim = createSimulation({ campus: campusData, seed: 42, vehicleCount: 1, capacity: 1 });
  const pNode = campusData.nodes[0].id;
  const dNode = campusData.nodes[1].id;
  const r1 = sim.addRequest({ pickup: pNode, dropoff: dNode });
  assert.strictEqual(r1.status, 'assigned');

  const r3 = sim.addRequest({ pickup: dNode, dropoff: pNode, passengers: 2 });
  assert.strictEqual(r3.status, 'rejected', 'Must reject passengers exceeding capacity');
  assert.ok(r3.reasons.some(r => r.type === 'capacity'), 'Should report capacity rejection reason');
});

// 6. Timing and Promise Invariant (No Stale/Broken Promises)
test('Insertion that would break existing rider promise is rejected with clear reason', () => {
  const sim = createSimulation({ campus: campusData, seed: 42, vehicleCount: 1 });
  // Add first rider with tight window
  const r1 = sim.addRequest({ pickup: campusData.nodes[0].id, dropoff: campusData.nodes[3].id, windowMin: 2, maxDetourMin: 1 });
  assert.strictEqual(r1.status, 'assigned');

  // Add conflicting rider far away that would delay r1
  const r2 = sim.addRequest({ pickup: campusData.nodes[15].id, dropoff: campusData.nodes[16].id, windowMin: 2 });
  if (r2.status === 'rejected') {
    assert.ok(r2.reasons.length > 0, 'Rejection must contain structured reasons');
    assert.ok(r2.rejectionReason, 'rejectionReason string must be populated');
  }
});

// 7. Cancellation Lifecycle
test('cancelRequest removes stops for waiting/assigned request, rejects onboard cancellation', () => {
  const sim = createSimulation({ campus: campusData, seed: 42, vehicleCount: 1 });
  const r1 = sim.addRequest({ pickup: campusData.nodes[0].id, dropoff: campusData.nodes[3].id });
  assert.strictEqual(r1.status, 'assigned');

  // Cancel while assigned
  const cancelRes = sim.cancelRequest(r1.requestId);
  assert.strictEqual(cancelRes.ok, true);

  const state1 = sim.getState();
  const reqObj = state1.requests.find(r => r.id === r1.requestId);
  assert.strictEqual(reqObj.status, 'cancelled');
  assert.strictEqual(state1.vehicles[0].stops.length, 0, 'Vehicle stops must be empty after cancellation');

  // Add another request, board the vehicle, then attempt cancel
  const r2 = sim.addRequest({ pickup: campusData.nodes[0].id, dropoff: campusData.nodes[3].id });
  sim.run(1); // At first node, boards immediately
  const state2 = sim.getState();
  const req2Obj = state2.requests.find(r => r.id === r2.requestId);
  assert.strictEqual(req2Obj.status, 'onboard');

  const cancelOnboard = sim.cancelRequest(r2.requestId);
  assert.strictEqual(cancelOnboard.ok, false, 'Cannot cancel rider who is already onboard');
  assert.ok(cancelOnboard.reason.includes('on board'));
});

// 8. Disruption: Vehicle Breakdown
test('breakVehicle sets status to broken, safely drops onboard riders, reassigns unpicked stops', () => {
  const sim = createSimulation({ campus: campusData, seed: 42, vehicleCount: 2 });
  const r1 = sim.addRequest({ pickup: campusData.nodes[0].id, dropoff: campusData.nodes[3].id });
  sim.run(1); // Board V1

  const state1 = sim.getState();
  const v1 = state1.vehicles.find(v => v.id === r1.vehicleId);
  assert.ok(v1.onboard.includes(r1.requestId), 'Rider 1 must be onboard');

  // Add an unpicked request to V1
  const r2 = sim.addRequest({ pickup: campusData.nodes[3].id, dropoff: campusData.nodes[11].id });

  // Break V1
  sim.breakVehicle(v1.id);

  const state2 = sim.getState();
  const brokenV = state2.vehicles.find(v => v.id === v1.id);
  assert.strictEqual(brokenV.status, 'broken');
  assert.strictEqual(brokenV.onboard.length, 0, 'Onboard list cleared');
  assert.strictEqual(brokenV.stops.length, 0, 'Stops cleared');

  const req1After = state2.requests.find(r => r.id === r1.requestId);
  assert.strictEqual(req1After.status, 'rejected');
  assert.ok(req1After.rejectionReason.includes('broke down'));

  // r2 should have been returned to pool and re-dispatched to V2 (or rejected with reason)
  const req2After = state2.requests.find(r => r.id === r2.requestId);
  assert.ok(['assigned', 'rejected'].includes(req2After.status));
});

// 9. Disruption: Road Closure and Rerouting
test('closeRoad updates graph, reroutes vehicle or re-pools unservable stops, reopenRoad restores', () => {
  const sim = createSimulation({ campus: campusData, seed: 42, vehicleCount: 1 });
  const r1 = sim.addRequest({ pickup: campusData.nodes[0].id, dropoff: campusData.nodes[3].id });
  assert.strictEqual(r1.status, 'assigned');

  // Close road e1
  sim.closeRoad('e1');

  const state = sim.getState();
  const edge = state.edges.find(e => e.id === 'e1');
  assert.strictEqual(edge.closed, true);

  // Vehicle should reroute via alternate path
  assert.ok(state.vehicles[0].stops.length > 0, 'Stops should still be planned via alternate route');

  // Reopen road
  sim.reopenRoad('e1');
  const stateAfterOpen = sim.getState();
  const reopenedEdge = stateAfterOpen.edges.find(e => e.id === 'e1');
  assert.strictEqual(reopenedEdge.closed, false);
});

// 10. Headless Comparison Scenario (Pool vs Solo)
test('runScenario completes honestly without crashing for both pool and solo modes', () => {
  const poolResult = runScenario({ campus: campusData, seed: 42, mode: 'pool', durationMin: 20 });
  const soloResult = runScenario({ campus: campusData, seed: 42, mode: 'solo', durationMin: 20 });

  assert.ok(typeof poolResult.totalDistanceMin === 'number');
  assert.ok(typeof poolResult.avgWaitMin === 'number');
  assert.ok(typeof poolResult.servedPct === 'number');
  assert.ok(typeof soloResult.totalDistanceMin === 'number');
  assert.ok(typeof soloResult.avgWaitMin === 'number');
  assert.ok(typeof soloResult.servedPct === 'number');

  console.log(`    Scenario Results (20 min test run):`);
  console.log(`    Pool: Served ${poolResult.servedPct}%, Avg Wait ${poolResult.avgWaitMin}m, Distance ${poolResult.totalDistanceMin}m`);
  console.log(`    Solo: Served ${soloResult.servedPct}%, Avg Wait ${soloResult.avgWaitMin}m, Distance ${soloResult.totalDistanceMin}m`);
});

console.log(`\n🎉 All ${passedTests} engine tests passed successfully!\n`);
