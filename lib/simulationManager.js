/**
 * /lib/simulationManager.js
 * Singleton Server Simulation Orchestrator for Next.js App Router.
 * Manages deterministic campus ride-pooling engine, live SSE subscriptions,
 * and REST dispatch operations.
 */

import fs from 'fs';
import path from 'path';
import { createSimulation, runScenario } from '../src/engine/index.js';

// Resolve campus blueprint data
const campusDataPath = path.join(process.cwd(), 'data', 'campus.json');
export const campusData = JSON.parse(fs.readFileSync(campusDataPath, 'utf-8'));

class SimulationManager {
  constructor() {
    this.sim = null;
    this.isRunning = true;
    this.speedMultiplier = 1;
    this.ticker = null;
    this.sseClients = new Set();
    this.currentSeed = 42;
    this.pendingApprovals = new Map();
    this.declinedRequests = new Map();

    this.init(42);
  }

  init(seed = 42) {
    if (this.ticker) clearInterval(this.ticker);
    this.pendingApprovals.clear();
    this.declinedRequests.clear();

    this.currentSeed = seed;
    this.sim = createSimulation({
      campus: campusData,
      seed,
      mode: 'pool',
      vehicleCount: 3,
      capacity: 4,
      maxDetourFactor: 1.5,
      windowMin: 10
    });

    // Seed realistic baseline campus requests
    this.sim.addRequest({
      pickup: 'boys_hostel',
      dropoff: 'academic_complex',
      passengers: 1,
      windowMin: 10,
      riderName: 'Aarav Sharma'
    });
    this.sim.addRequest({
      pickup: 'girls_hostel_mess',
      dropoff: 'student_center',
      passengers: 1,
      windowMin: 10,
      riderName: 'Ananya Verma'
    });

    this.sim.subscribe(() => {
      this.broadcastSSE();
    });

    this.startTicker();
  }

  startTicker() {
    if (this.ticker) clearInterval(this.ticker);
    const intervalMs = Math.max(50, Math.floor(1000 / this.speedMultiplier));
    this.ticker = setInterval(() => {
      if (this.isRunning && this.sim) {
        this.sim.tick();
        this.broadcastSSE();
      }
    }, intervalMs);
  }

  getState() {
    if (!this.sim) return null;
    const baseState = this.sim.getState();
    const pendings = Array.from(this.pendingApprovals.values());
    const declined = Array.from(this.declinedRequests.values());
    return {
      ...baseState,
      pendingApprovals: pendings,
      requests: [...pendings, ...baseState.requests, ...declined]
    };
  }

  getEvents() {
    return this.sim ? this.sim.getEvents() : [];
  }

  addRequest(params) {
    if (!this.sim) return { success: false, rejectionReason: 'Simulation not initialized' };

    // If explicit autoAccept is true (e.g. system seed or scripted demo), add directly
    if (params.autoAccept) {
      const result = this.sim.addRequest(params);
      this.broadcastSSE();
      return result;
    }

    // Default flow: Route to Driver Terminal for explicit Driver Acceptance
    return this.requestDriverApproval(params);
  }

  requestDriverApproval(params) {
    if (!this.sim) return { success: false, rejectionReason: 'Simulation not initialized' };
    const pendingId = `REQ-${Date.now().toString().slice(-5)}`;
    const currentTime = this.sim.getState()?.time || 0;
    const pendingObj = {
      id: pendingId,
      ...params,
      status: 'pending_driver',
      createdAt: parseFloat(currentTime.toFixed(1)),
      rejectionReason: null
    };
    this.pendingApprovals.set(pendingId, pendingObj);
    this.broadcastSSE();
    return {
      requestId: pendingId,
      status: 'pending_driver',
      message: 'Booking request sent to Bus Driver Terminal for approval'
    };
  }

  acceptDriverRequest(requestId, vehicleId) {
    if (!this.sim) return { ok: false, reason: 'Simulation not initialized' };
    const pending = this.pendingApprovals.get(requestId);
    if (!pending) return { ok: false, reason: 'Pending request not found' };

    this.pendingApprovals.delete(requestId);
    const result = this.sim.addRequest({
      pickup: pending.pickup,
      dropoff: pending.dropoff,
      passengers: pending.passengers,
      windowMin: pending.windowMin,
      maxDetourFactor: pending.maxDetourFactor,
      riderName: pending.riderName,
      studentId: pending.studentId
    });

    this.broadcastSSE();
    return { ok: true, result };
  }

  declineDriverRequest(requestId, reason = 'Driver unable to accept: Current capacity fully booked or detour limits exceeded') {
    if (!this.sim) return { ok: false, reason: 'Simulation not initialized' };
    const pending = this.pendingApprovals.get(requestId);
    if (!pending) return { ok: false, reason: 'Pending request not found' };

    this.pendingApprovals.delete(requestId);
    const declinedObj = {
      ...pending,
      status: 'rejected',
      code: 'DRIVER_DECLINED',
      rejectionReason: reason
    };
    this.declinedRequests.set(requestId, declinedObj);
    this.broadcastSSE();
    return { ok: true, request: declinedObj };
  }

  cancelRequest(requestId) {
    if (!this.sim) return { ok: false, reason: 'Simulation not initialized' };
    if (this.pendingApprovals.has(requestId)) {
      this.pendingApprovals.delete(requestId);
      this.broadcastSSE();
      return { ok: true, message: 'Pending booking cancelled by student' };
    }
    const result = this.sim.cancelRequest(requestId);
    this.broadcastSSE();
    return result;
  }

  breakVehicle(vehicleId) {
    if (!this.sim) return;
    this.sim.breakVehicle(vehicleId);
    this.broadcastSSE();
  }

  toggleRoad(edgeId) {
    if (!this.sim) return { ok: false };
    const state = this.sim.getState();
    const edge = state.edges.find(e => e.id === edgeId);
    if (!edge) return { ok: false, reason: 'Edge not found' };

    if (edge.closed) {
      this.sim.reopenRoad(edgeId);
    } else {
      this.sim.closeRoad(edgeId);
    }
    this.broadcastSSE();
    return { ok: true, closed: !edge.closed };
  }

  setControl({ action, speed, seed, mode, capacity, maxDetourFactor }) {
    if (action === 'pause') this.isRunning = false;
    if (action === 'play') this.isRunning = true;
    if (action === 'step') {
      if (this.sim) this.sim.tick();
      this.broadcastSSE();
    }
    if (speed !== undefined) {
      this.speedMultiplier = parseFloat(speed);
      this.startTicker();
    }
    if (action === 'reset' || seed !== undefined) {
      this.init(seed !== undefined ? seed : this.currentSeed);
    }
    if (maxDetourFactor !== undefined && this.sim?.updateConfig) {
      this.sim.updateConfig({ maxDetourFactor });
    }
    return {
      ok: true,
      isRunning: this.isRunning,
      speedMultiplier: this.speedMultiplier,
      seed: this.currentSeed
    };
  }

  runComparison({ seed = 42, durationMin = 60 }) {
    const pool = runScenario({ campus: campusData, seed, mode: 'pool', durationMin });
    const solo = runScenario({ campus: campusData, seed, mode: 'solo', durationMin });
    return { pool, solo, seed };
  }

  // SSE Subscription Management
  addSSEClient(controller) {
    this.sseClients.add(controller);
    // Send immediate initial state
    const payload = `data: ${JSON.stringify({
      type: 'INIT',
      state: this.getState(),
      events: this.getEvents(),
      isRunning: this.isRunning,
      speedMultiplier: this.speedMultiplier,
      campus: campusData
    })}\n\n`;
    try {
      controller.enqueue(new TextEncoder().encode(payload));
    } catch (e) {
      this.sseClients.delete(controller);
    }
  }

  removeSSEClient(controller) {
    this.sseClients.delete(controller);
  }

  broadcastSSE() {
    if (this.sseClients.size === 0) return;
    const payload = `data: ${JSON.stringify({
      type: 'STATE_UPDATE',
      state: this.getState(),
      events: this.getEvents(),
      isRunning: this.isRunning,
      speedMultiplier: this.speedMultiplier
    })}\n\n`;
    const encoded = new TextEncoder().encode(payload);

    for (const client of this.sseClients) {
      try {
        client.enqueue(encoded);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }
}

// Global singleton instance across Next.js module reloads
const globalForSim = globalThis;
if (!globalForSim.simManager) {
  globalForSim.simManager = new SimulationManager();
}

export const simManager = globalForSim.simManager;
