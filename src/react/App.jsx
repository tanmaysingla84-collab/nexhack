import React, { useState, useEffect, useRef } from 'react';
import LeafletMap from './LeafletMap.jsx';
import RequestPanel from './RequestPanel.jsx';
import ControlPanel from './ControlPanel.jsx';
import EventFeed from './EventFeed.jsx';
import LiveTracker from './LiveTracker.jsx';
import AdminPortal from './AdminPortal.jsx';
import ComparisonDashboard from './ComparisonDashboard.jsx';
import StudentLoginModal from './StudentLoginModal.jsx';
import RapidoRideCard from './RapidoRideCard.jsx';
import LoginPage from './LoginPage.jsx';
import ManifestModal from './ManifestModal.jsx';
import ProblemSolutionModal from './ProblemSolutionModal.jsx';
import { createSimulation, runScenario } from '../engine/index.js';
import campusData from '../../data/campus.json';

export default function App() {
  const [sim, setSim] = useState(null);
  const [simState, setSimState] = useState(null);
  const [events, setEvents] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [activeTab, setActiveTab] = useState('requests');
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'live' | 'admin'
  const [showComparison, setShowComparison] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentSeed, setCurrentSeed] = useState(42);
  const [trackedVehicleId, setTrackedVehicleId] = useState(null);
  const [inspectedVehicle, setInspectedVehicle] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  const [showProblemSolution, setShowProblemSolution] = useState(false);

  // Authenticated User State
  const [currentUser, setCurrentUser] = useState(null);

  // Scripted Demo State
  const [demoActive, setDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoAuto, setDemoAuto] = useState(false);
  const demoAutoTimerRef = useRef(null);

  const demoSteps = [
    {
      title: 'Step 1/7: Morning Baseline',
      caption: 'Geeta University Quiet Campus Baseline: Shuttles V1, V2, and V3 circulate between Gateway Building, Hostels, and Stadium.',
      run: (s) => {
        setIsPlaying(true);
      }
    },
    {
      title: 'Step 2/7: Class-Ends Pooling',
      caption: 'Morning Class Ends: Students from Boys Hostel & Girls Mess book rides to Engineering Block. Engine pools them into Shuttle V1!',
      run: (s) => {
        s.addRequest({ pickup: 'hostel_strip_south', dropoff: 'academic_block_central', passengers: 1, windowMin: 10, maxDetourFactor: 1.5 });
        s.addRequest({ pickup: 'girls_hostel_mess', dropoff: 'academic_block_central', passengers: 1, windowMin: 10, maxDetourFactor: 1.5 });
        setTrackedVehicleId('V1');
      }
    },
    {
      title: 'Step 3/7: Detour Breach Protection',
      caption: 'Commitment Protection: New request arriving would breach on-board passenger detour limit. Engine transparently rejects with exact minutes!',
      run: (s) => {
        s.addRequest({ pickup: 'sports_complex_indoor', dropoff: 'open_landscape_field', passengers: 1, windowMin: 2, maxDetourFactor: 1.1 });
        setActiveTab('requests');
      }
    },
    {
      title: 'Step 4/7: Capacity Rejection',
      caption: 'Capacity Limit: Large party request arrives when seats are full. Structured rejection code CAPACITY_EXCEEDED generated with zero silent drops.',
      run: (s) => {
        s.addRequest({ pickup: 'gateway_building', dropoff: 'cricket_stadium', passengers: 4, windowMin: 4 });
        setActiveTab('requests');
      }
    },
    {
      title: 'Step 5/7: Mid-Trip Cancellation',
      caption: 'Rider Cancellation: Student cancels waiting request. Shuttle route instantly shrinks and remaining passenger ETAs update.',
      run: (s) => {
        const res = s.addRequest({ pickup: 'student_center', dropoff: 'staff_housing', passengers: 1, windowMin: 10 });
        setTimeout(() => {
          if (res.requestId) s.cancelRequest(res.requestId);
        }, 1200);
      }
    },
    {
      title: 'Step 6/7: Live Road Closure & Breakdown',
      caption: 'Disruptions: Road e3 closes and Shuttle V2 breaks down. Engine reroutes active shuttles and reassigns passengers.',
      run: (s) => {
        s.closeRoad('e3');
        s.breakVehicle('V2');
      }
    },
    {
      title: 'Step 7/7: Headless Outcome Comparison',
      caption: 'Honest Head-to-Head Report: Comparing Dynamic Pooling vs Solo Direct Rides across distance, waiting time, and seat utilization.',
      run: () => {
        setShowComparison(true);
      }
    }
  ];

  // Initialize Simulation instance (supports local or WebSocket sync)
  const initSimulation = (seed = 42) => {
    const newSim = createSimulation({
      campus: campusData,
      seed,
      mode: 'pool',
      vehicleCount: 3,
      capacity: 4,
      maxDetourFactor: 1.5
    });

    // Realistic initial requests at Geeta University
    newSim.addRequest({ pickup: 'hostel_strip_south', dropoff: 'gateway_building', passengers: 1, windowMin: 10 });
    newSim.addRequest({ pickup: 'girls_hostel_mess', dropoff: 'student_center', passengers: 1, windowMin: 10 });

    setSim(newSim);
    setSimState(newSim.getState());
    setEvents(newSim.getEvents());
    setCurrentSeed(seed);

    newSim.subscribe((newState) => {
      setSimState(newState);
      setEvents(newSim.getEvents());
    });
  };

  useEffect(() => {
    initSimulation(42);

    // Try connecting to backend WebSocket server if running
    try {
      const ws = new WebSocket('ws://localhost:3001');
      ws.onopen = () => {
        console.log('📡 Connected to CampusPool Live WebSocket Server');
        setWsConnected(true);
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'STATE_UPDATE' || data.type === 'INIT') {
            if (data.state) setSimState(data.state);
            if (data.events) setEvents(data.events);
          }
        } catch (err) {}
      };
      ws.onclose = () => setWsConnected(false);
    } catch (e) {
      setWsConnected(false);
    }
  }, []);

  // Tick loop
  useEffect(() => {
    if (!isPlaying || !sim || currentView === 'login') return;

    const intervalMs = Math.max(50, Math.floor(1000 / speedMultiplier));
    const timer = setInterval(() => {
      sim.tick();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier, sim, currentView]);

  // Demo auto-advancement
  useEffect(() => {
    if (!demoActive || !demoAuto) {
      if (demoAutoTimerRef.current) clearTimeout(demoAutoTimerRef.current);
      return;
    }

    demoAutoTimerRef.current = setTimeout(() => {
      if (demoStep < demoSteps.length - 1) {
        executeDemoStep(demoStep + 1);
      } else {
        setDemoAuto(false);
      }
    }, 4500);

    return () => clearTimeout(demoAutoTimerRef.current);
  }, [demoActive, demoAuto, demoStep]);

  const executeDemoStep = (stepIdx) => {
    setDemoStep(stepIdx);
    if (demoSteps[stepIdx] && sim) {
      demoSteps[stepIdx].run(sim);
    }
  };

  const startDemo = () => {
    setCurrentView('live');
    setDemoActive(true);
    setDemoAuto(false);
    executeDemoStep(0);
  };

  const stopDemo = () => {
    setDemoActive(false);
    setDemoAuto(false);
    if (demoAutoTimerRef.current) clearTimeout(demoAutoTimerRef.current);
  };

  const handleNodeClick = (node) => {
    if (!sim) return;
    const dest = campusData.nodes.find(n => n.id !== node.id);
    if (dest) {
      sim.addRequest({
        pickup: node.id,
        dropoff: dest.id,
        passengers: 1,
        windowMin: 10,
        maxDetourFactor: 1.5
      });
      setActiveTab('requests');
    }
  };

  const handleEdgeClick = (edge) => {
    if (!sim) return;
    if (edge.closed) sim.reopenRoad(edge.id);
    else sim.closeRoad(edge.id);
  };

  const handleAddRequest = (req) => {
    if (!sim) return;
    sim.addRequest(req);
    setActiveTab('requests');
  };

  const handleCancelRequest = (requestId) => {
    if (!sim) return;
    sim.cancelRequest(requestId);
  };

  const handleBreakVehicle = (vehicleId) => {
    if (!sim) return;
    sim.breakVehicle(vehicleId);
  };

  const handleToggleRoad = (edge) => {
    if (!sim) return;
    if (edge.closed) sim.reopenRoad(edge.id);
    else sim.closeRoad(edge.id);
  };

  const handleClassBurst = () => {
    if (!sim) return;
    const hubs = ['academic_block_central', 'gateway_building', 'academic_block_north', 'academic_block_northwest'];
    const hostels = ['hostel_strip_south', 'girls_hostel_mess', 'hostel_strip_north', 'staff_housing'];
    for (let i = 0; i < 4; i++) {
      sim.addRequest({
        pickup: hubs[i % hubs.length],
        dropoff: hostels[i % hostels.length],
        passengers: 1,
        windowMin: 10,
        maxDetourFactor: 1.5
      });
    }
    setActiveTab('requests');
  };

  const handleReset = (seed) => {
    initSimulation(seed);
  };

  const handleUpdateConfig = (cfg) => {
    if (sim?.updateConfig) {
      sim.updateConfig(cfg);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('live');
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  const metrics = simState?.metrics || {
    servedPct: 100,
    avgWaitMin: 0,
    avgOccupancy: 0,
    rejectedCount: 0
  };

  // Dedicated Full-Screen Login Page
  if (currentView === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div>
      {/* Top App Header with Geeta University Branding */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-crest">GU</div>
          <div className="brand-title">
            <span className="brand-main">GEETA UNIVERSITY</span>
            <span className="brand-sub">Smart Campus Ride Pooling & Live Transit OS</span>
          </div>
        </div>

        {/* Role-Based Navigation: Only Admins can see the Admin Command Portal */}
        {currentUser?.role === 'admin' && (
          <div className="header-nav-pills">
            <button
              className={`nav-pill ${currentView === 'live' ? 'active' : ''}`}
              onClick={() => setCurrentView('live')}
            >
              🗺️ Live Campus Map
            </button>
            <button
              className={`nav-pill ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentView('admin')}
            >
              🛡️ Admin Command Portal
            </button>
          </div>
        )}

        {/* Simulation Controls & Student Login */}
        <div className="header-controls">
          <div className="time-display-pill">
            <span>⏱ t = {simState ? simState.time : '0.0'} min</span>
          </div>

          <div className="btn-group">
            <button
              className="btn-sm"
              title="Toggle Play / Pause"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              <span>{isPlaying ? '⏸' : '▶'}</span> {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              className="btn-sm"
              title="Advance by 1 tick (10s)"
              onClick={() => {
                if (sim) sim.tick();
              }}
            >
              ⏭ Step
            </button>
          </div>

          <div className="btn-group">
            {[1, 5, 20].map(s => (
              <button
                key={s}
                className={`btn-sm btn-speed ${speedMultiplier === s ? 'active' : ''}`}
                onClick={() => setSpeedMultiplier(s)}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            className="btn-secondary btn-sm"
            style={{ fontWeight: 700 }}
            title="View NexHack Problem Statement & Solution Guide"
            onClick={() => setShowProblemSolution(true)}
          >
            📘 Problem Solution
          </button>

          <button
            className="btn-secondary btn-sm"
            style={{ fontWeight: 700 }}
            title="Compare Dynamic Pooling vs Solo Direct Rides"
            onClick={() => setShowComparison(true)}
          >
            📊 Solo vs Pool
          </button>

          {/* Student Profile / Rapido Login Button */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                className="btn-secondary btn-sm"
                style={{ borderColor: 'var(--gu-orange)', color: 'var(--gu-orange)', fontWeight: 800 }}
                onClick={() => setShowLoginModal(true)}
              >
                {currentUser.avatar} {currentUser.name.split(' ')[0]} ({currentUser.walletBalance} pts)
              </button>
              <button
                className="btn-sm"
                style={{ color: '#94a3b8', fontSize: '0.75rem' }}
                title="Sign Out to Login Page"
                onClick={handleSignOut}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              className="btn-secondary btn-sm"
              style={{ borderColor: 'var(--gu-orange)', color: 'var(--gu-orange)', fontWeight: 800 }}
              onClick={() => setCurrentView('login')}
            >
              🔑 Sign In
            </button>
          )}

          <button
            className="btn-primary"
            title="Launch 7-Step Scripted Presentation Demo"
            onClick={startDemo}
          >
            ✨ Run Demo
          </button>
        </div>
      </header>

      {/* Scripted Demo Presenter Banner */}
      {demoActive && (
        <div id="demo-banner">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="demo-step-pill">{demoSteps[demoStep].title}</span>
            <span className="demo-caption">{demoSteps[demoStep].caption}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {demoStep < demoSteps.length - 1 ? (
              <button
                className="btn-primary btn-sm"
                onClick={() => executeDemoStep(demoStep + 1)}
              >
                Next Step ➔
              </button>
            ) : (
              <button className="btn-primary btn-sm" onClick={stopDemo}>
                Done
              </button>
            )}
            <button
              className="btn-secondary btn-sm"
              onClick={() => setDemoAuto(!demoAuto)}
            >
              {demoAuto ? '⏸ Pause Auto' : '▶ Auto Play'}
            </button>
            <button
              className="btn-sm"
              style={{ color: '#ffffff' }}
              onClick={stopDemo}
            >
              ✕ Exit
            </button>
          </div>
        </div>
      )}

      {/* Main Content: Live View or Admin Portal */}
      {currentView === 'live' ? (
        <main className="app-main">
          {/* Left: Spatial Leaflet Map */}
          <LeafletMap
            state={simState}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            liveTrackVehicleId={trackedVehicleId}
            onVehicleClick={(v) => setInspectedVehicle(v)}
          />

          {/* Right: Telemetry & Dispatch Sidebar */}
          <aside className="dashboard-sidebar">
            {/* Live Metrics Strip */}
            <div className="metrics-strip">
              <div className="metric-card">
                <span className="metric-label">Served</span>
                <span className="metric-value">{metrics.servedPct}%</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Avg Wait</span>
                <span className="metric-value">{metrics.avgWaitMin}m</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Occupancy</span>
                <span className="metric-value">{metrics.avgOccupancy}/4</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Rejections</span>
                <span className="metric-value" style={{ color: '#dc2626' }}>
                  {metrics.rejectedCount}
                </span>
              </div>
            </div>

            {/* Rapido-Style Quick Ride Booking Card */}
            <RapidoRideCard
              nodes={simState?.nodes || []}
              onAddRequest={handleAddRequest}
              currentUser={currentUser}
              onOpenLogin={() => setShowLoginModal(true)}
            />

            {/* Live Shuttle GPS Tracker Strip */}
            <LiveTracker
              vehicles={simState?.vehicles || []}
              nodes={simState?.nodes || []}
              selectedVehicleId={trackedVehicleId}
              onSelectVehicle={(id) => {
                setTrackedVehicleId(id);
                const veh = simState?.vehicles?.find(v => v.id === id);
                if (veh) setInspectedVehicle(veh);
              }}
            />

            {/* Tab Navigation */}
            <nav className="sidebar-tabs">
              <button
                className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                <span>📋 Active Rides</span>
                <span className="tab-badge">{simState?.requests?.length || 0}</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'controls' ? 'active' : ''}`}
                onClick={() => setActiveTab('controls')}
              >
                <span>🎛️ Advanced Controls</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                <span>📡 Live Feed</span>
              </button>
            </nav>

            {/* Tab Contents */}
            {activeTab === 'requests' && (
              <RequestPanel
                requests={simState?.requests || []}
                nodes={simState?.nodes || []}
                onCancel={handleCancelRequest}
              />
            )}

            {activeTab === 'controls' && (
              <ControlPanel
                nodes={simState?.nodes || []}
                edges={simState?.edges || []}
                vehicles={simState?.vehicles || []}
                onAddRequest={handleAddRequest}
                onBreakVehicle={handleBreakVehicle}
                onToggleRoad={handleToggleRoad}
                onClassBurst={handleClassBurst}
                onReset={handleReset}
              />
            )}

            {activeTab === 'events' && (
              <EventFeed events={events} />
            )}
          </aside>
        </main>
      ) : (
        /* Dedicated Full-Screen 7-Tab Admin Command Portal */
        <main className="app-main" style={{ display: 'block', overflow: 'hidden' }}>
          <AdminPortal
            simState={{ ...(simState || {}), events }}
            onBreakVehicle={handleBreakVehicle}
            onToggleRoad={handleToggleRoad}
            onReset={handleReset}
            onTriggerBurst={handleClassBurst}
            onCancelRequest={handleCancelRequest}
            onAddCustomRequest={handleAddRequest}
            onUpdateConfig={handleUpdateConfig}
          />
        </main>
      )}

      {/* Vehicle Manifest Modal */}
      {inspectedVehicle && (
        <ManifestModal
          vehicle={inspectedVehicle}
          onClose={() => setInspectedVehicle(null)}
        />
      )}

      {/* Rapido-Style Student Profile / Login Modal */}
      <StudentLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        currentUser={currentUser}
        onLogin={(user) => setCurrentUser(user)}
      />

      {/* Problem Statement & Solution Guide Modal */}
      <ProblemSolutionModal
        isOpen={showProblemSolution}
        onClose={() => setShowProblemSolution(false)}
      />

      {/* Comparison Modal */}
      <ComparisonDashboard
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        seed={currentSeed}
        campus={campusData}
      />
    </div>
  );
}
