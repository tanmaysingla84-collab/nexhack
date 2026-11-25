import test from 'node:test';
import assert from 'node:assert';
import { simManager } from '../lib/simulationManager.js';
import fs from 'fs';
import path from 'path';

test('Driver Acceptance & Regional Haryana Workflow', async (t) => {
  await t.test('Haryana Regional nodes are loaded and reachable', () => {
    const state = simManager.getState();
    assert.ok(state.nodes.length >= 32, 'All 32 nodes should be present in state');
    
    const haryanaNodes = state.nodes.filter(n => n.region === 'haryana' || n.id.startsWith('H'));
    assert.ok(haryanaNodes.length >= 10, 'At least 10 Haryana regional nodes should exist');

    const panipatJunction = haryanaNodes.find(n => n.id === 'H01');
    assert.ok(panipatJunction, 'Panipat Junction H01 should exist');
  });

  await t.test('Student booking enters pending_driver state and alerts driver', () => {
    const initialPendingCount = simManager.pendingApprovals.size;
    
    const bookingResult = simManager.addRequest({
      pickup: 'N07',
      dropoff: 'N16',
      passengers: 1,
      windowMin: 10,
      maxDetourFactor: 1.5,
      riderName: 'Test Student Aarav',
      studentId: 'GU24-CSE-9999'
    });

    assert.strictEqual(bookingResult.status, 'pending_driver');
    assert.ok(bookingResult.requestId, 'Pending request ID must be returned');
    assert.strictEqual(simManager.pendingApprovals.size, initialPendingCount + 1);

    const pendingInState = simManager.getState().pendingApprovals.find(r => r.id === bookingResult.requestId);
    assert.ok(pendingInState, 'Pending approval must be visible in simulation state');
  });

  await t.test('Driver explicitly accepting the ride commits it to the vehicle route', () => {
    const pendingList = Array.from(simManager.pendingApprovals.values());
    const testReq = pendingList[pendingList.length - 1];
    assert.ok(testReq, 'Must have a pending request to test');

    const acceptResult = simManager.acceptDriverRequest(testReq.id, 'V1');
    assert.strictEqual(acceptResult.ok, true);
    assert.strictEqual(acceptResult.result.status, 'assigned');

    const state = simManager.getState();
    const assignedReq = state.requests.find(r => r.id === acceptResult.result.requestId);
    assert.ok(assignedReq, 'Accepted request must be in simulation requests');
    assert.strictEqual(assignedReq.status, 'assigned');
    assert.ok(assignedReq.vehicleId, 'Vehicle ID must be assigned upon driver acceptance');
  });

  await t.test('Driver explicitly declining a ride sets status to rejected with explanation', () => {
    // Add another request
    const booking = simManager.addRequest({
      pickup: 'H01',
      dropoff: 'H02',
      passengers: 4,
      windowMin: 15,
      riderName: 'Test Decline Rider',
      studentId: 'GU24-CSE-0001'
    });

    assert.strictEqual(booking.status, 'pending_driver');
    const declineResult = simManager.declineDriverRequest(booking.requestId, 'Bus at full capacity');
    assert.strictEqual(declineResult.ok, true);
    assert.strictEqual(declineResult.request.status, 'rejected');
    assert.strictEqual(declineResult.request.rejectionReason, 'Bus at full capacity');

    const state = simManager.getState();
    const declinedInState = state.requests.find(r => r.id === booking.requestId);
    assert.ok(declinedInState, 'Declined request must be present in state with rejected status');
    assert.strictEqual(declinedInState.status, 'rejected');
  });

  await t.test('Cross-boundary routing: Campus to Outside City and Outside City to Campus', () => {
    // 1. Campus to Outside City (N01 North Gate -> H01 Panipat Junction)
    const campusToOutside = simManager.addRequest({
      pickup: 'N01',
      dropoff: 'H01',
      passengers: 1,
      windowMin: 20,
      maxDetourFactor: 1.5,
      riderName: 'Campus To Outside Rider',
      autoAccept: true
    });
    assert.strictEqual(campusToOutside.status, 'assigned', 'Campus to Outside City booking should be feasible and assigned');

    // 2. Outside City to Campus (H04 Karnal Oasis -> N14 Academic Megablock)
    const outsideToCampus = simManager.addRequest({
      pickup: 'H04',
      dropoff: 'N14',
      passengers: 1,
      windowMin: 25,
      maxDetourFactor: 1.5,
      riderName: 'Outside To Campus Rider',
      autoAccept: true
    });
    assert.ok(['assigned', 'waiting'].includes(outsideToCampus.status), 'Outside City to Campus booking should be supported');
  });
});
