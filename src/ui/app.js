/**
 * /src/ui/app.js
 * Main application orchestrator for Member 2 UI.
 * Connects simulation instance, Leaflet map, request & control panels,
 * event feed, comparison dashboard, and interactive demo runner.
 */

import { createSimulation, loadCampusData } from './engineAdapter.js';
import { MapView } from './mapView.js';
import { RequestPanel } from './requestPanel.js';
import { ControlPanel } from './controlPanel.js';
import { EventFeed } from './eventFeed.js';
import { ComparisonDashboard } from './comparisonDashboard.js';
import { DemoRunner } from '../../demo/script.js';
import { toast } from './toast.js';

class App {
  constructor() {
    this.sim = null;
    this.campus = null;
    this.mapView = null;
    this.requestPanel = null;
    this.controlPanel = null;
    this.eventFeed = null;
    this.comparisonDashboard = null;
    this.demoRunner = null;

    // Simulation playback state
    this.isPlaying = true;
    this.speedMultiplier = 1; // 1x, 5x, 20x
    this.timer = null;
    this.activeTab = 'requests';
  }

  async init() {
    console.log('[CampusPool OS] Initializing Member 2 Visualizer & UI...');

    // Load topology
    this.campus = await loadCampusData();

    // Initialize Simulation instance (defaults to seed 42)
    this.initSimulation(42);

    // Initialize UI Components
    this.mapView = new MapView('map', {
      onNodeClick: (node) => this.handleNodeClick(node),
      onEdgeClick: (edge) => this.handleEdgeClick(edge)
    });

    this.requestPanel = new RequestPanel('request-list-container', {
      onCancel: (id) => this.cancelRequest(id)
    });

    this.controlPanel = new ControlPanel('controls-tab', {
      onAddRequest: (req) => this.handleAddRequest(req),
      onBreakVehicle: (vId) => this.handleBreakVehicle(vId),
      onToggleRoad: (edgeId) => this.handleToggleRoad(edgeId),
      onClassBurst: () => this.handleClassBurst(),
      onReset: (seed) => this.reset(seed)
    });

    this.eventFeed = new EventFeed('event-feed-container');
    this.comparisonDashboard = new ComparisonDashboard('comparison-modal');
    this.demoRunner = new DemoRunner(this);

    // Expose app globally for inline button handlers
    window.app = this;

    // Setup DOM Listeners (Header, Tabs, Speed controls)
    this.setupUIEventListeners();

    // Initial render
    this.render();

    // Start playback loop
    this.startLoop();
  }

  initSimulation(seed = 42) {
    if (this.sim) {
      // clean up if necessary
    }

    this.sim = createSimulation({
      campus: this.campus,
      seed,
      mode: 'pool',
      vehicleCount: 3,
      capacity: 4
    });

    // Subscribe UI render to simulation events
    this.sim.subscribe((state) => {
      this.render(state);
    });
  }

  setupUIEventListeners() {
    // Play / Pause / Step
    const btnPlay = document.getElementById('btn-play-pause');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        if (this.isPlaying) this.pause();
        else this.play();
      });
    }

    const btnStep = document.getElementById('btn-step');
    if (btnStep) {
      btnStep.addEventListener('click', () => {
        this.pause();
        this.sim.tick();
      });
    }

    // Speed Controls
    document.querySelectorAll('.btn-speed').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const speed = parseInt(e.currentTarget.dataset.speed, 10) || 1;
        this.setSpeed(speed);
      });
    });

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.currentTarget.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Request Filters
    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const filter = e.currentTarget.dataset.filter;
        this.requestPanel.setFilter(filter);
        this.render();
      });
    });

    // Modal Trigger for Solo vs Pool Comparison
    const btnComp = document.getElementById('btn-open-comparison');
    if (btnComp) {
      btnComp.addEventListener('click', () => {
        this.comparisonDashboard.open();
      });
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(c => {
      c.classList.toggle('active', c.id === `${tabName}-tab`);
    });
  }

  startLoop() {
    if (this.timer) clearInterval(this.timer);
    // Base: 1000ms / speedMultiplier
    const intervalMs = Math.max(50, Math.floor(1000 / this.speedMultiplier));
    this.timer = setInterval(() => {
      if (this.isPlaying && this.sim) {
        this.sim.tick();
      }
    }, intervalMs);
  }

  play() {
    this.isPlaying = true;
    const icon = document.getElementById('play-icon');
    if (icon) icon.textContent = '⏸';
  }

  pause() {
    this.isPlaying = false;
    const icon = document.getElementById('play-icon');
    if (icon) icon.textContent = '▶';
  }

  setSpeed(mult) {
    this.speedMultiplier = mult;
    this.startLoop();
  }

  render(state) {
    if (!state && this.sim) state = this.sim.getState();
    if (!state) return;

    // 1. Clock Display
    const clockEl = document.getElementById('sim-clock');
    if (clockEl) {
      clockEl.textContent = `t = ${state.time.toFixed(1)} min`;
    }

    // 2. Metrics Strip
    const m = state.metrics;
    if (m) {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setVal('metric-served', `${m.servedPct}%`);
      setVal('metric-wait', `${m.avgWaitMin}m`);
      setVal('metric-occupancy', `${m.avgOccupancy}/4`);
      setVal('metric-rejected', `${m.rejectedCount}`);
    }

    // 3. Tab Badge Counts
    const reqBadge = document.getElementById('badge-requests-count');
    if (reqBadge) reqBadge.textContent = state.requests.length;

    // 4. Update Leaflet Map
    if (this.mapView) {
      this.mapView.render(state);
    }

    // 5. Update Panels
    if (this.requestPanel) {
      this.requestPanel.render(state.requests, state.nodes);
    }

    if (this.controlPanel) {
      this.controlPanel.update(state);
    }

    if (this.eventFeed && this.sim) {
      this.eventFeed.render(this.sim.getEvents());
    }
  }

  // --- Handlers & Actions ---

  handleAddRequest(params) {
    const res = this.sim.addRequest(params);
    if (res.status === 'rejected') {
      const reason = res.reasons[0]?.message || 'Capacity/Timing constraint violated';
      toast.error('Ride Request Rejected', `${reason}`);
    } else {
      toast.info('Ride Assigned', `Request ${res.requestId} allocated to ${res.vehicleId}`);
    }
  }

  cancelRequest(requestId) {
    const res = this.sim.cancelRequest(requestId);
    if (res.ok) {
      toast.warning('Ride Cancelled', `Request ${requestId} was successfully cancelled`);
    } else {
      toast.error('Cancellation Failed', res.reason || 'Could not cancel request');
    }
  }

  toggleRejection(requestId) {
    this.requestPanel.toggleRejection(requestId);
    this.render();
  }

  presetRequest(pickup, dropoff, passengers = 1) {
    this.handleAddRequest({
      pickup,
      dropoff,
      passengers,
      windowMin: 10,
      maxDetourMin: 6
    });
  }

  handleBreakVehicle(vehicleId) {
    this.sim.breakVehicle(vehicleId);
    toast.error('Vehicle Breakdown!', `Vehicle ${vehicleId} broke down. Riders safely deboarded or transferred.`);
  }

  handleToggleRoad(edgeId) {
    const edge = this.sim.getState().edges.find(e => e.id === edgeId);
    if (!edge) return;

    if (edge.closed) {
      this.sim.reopenRoad(edgeId);
      toast.info('Road Reopened', `Road ${edge.from} ↔ ${edge.to} is now open for transit.`);
    } else {
      this.sim.closeRoad(edgeId);
      toast.warning('Road Closed!', `Road ${edge.from} ↔ ${edge.to} is closed. Vehicles rerouting.`);
    }
  }

  handleEdgeClick(edge) {
    this.handleToggleRoad(edge.id);
  }

  handleNodeClick(node) {
    if (this.controlPanel) {
      this.controlPanel.setPickupDropoff(node.id);
      this.switchTab('controls');
      toast.info('Node Selected', `Selected "${node.name}" in Dispatch Form`);
    }
  }

  handleClassBurst() {
    const burstRequests = [
      { pickup: 'tech_tower', dropoff: 'hostel_a', passengers: 1 },
      { pickup: 'tech_tower', dropoff: 'hostel_b', passengers: 1 },
      { pickup: 'science_lab', dropoff: 'canteen_central', passengers: 1 },
      { pickup: 'mech_workshop', dropoff: 'hostel_c', passengers: 1 },
      { pickup: 'library', dropoff: 'south_gate', passengers: 1 },
      { pickup: 'library', dropoff: 'hostel_d', passengers: 1 }
    ];

    toast.warning('Class Ends Rush!', 'Injecting 6 simultaneous student ride requests...');
    burstRequests.forEach((req, idx) => {
      setTimeout(() => {
        this.sim.addRequest({
          ...req,
          windowMin: 10,
          maxDetourMin: 6
        });
      }, idx * 120);
    });
  }

  reset(seed = 42) {
    this.initSimulation(seed);
    toast.info('Simulation Reset', `Engine restarted with Seed: ${seed}`);
    this.render();
  }
}

// Bootstrap on DOM load
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init().catch(err => console.error('App init error:', err));
});
