'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import TopNavbar from '@/components/TopNavbar';
import DemoBanner from '@/components/DemoBanner';
import LoginPage from '@/components/LoginPage';
import StudentRiderView from '@/components/StudentRiderView';
import CaptainView from '@/components/CaptainView';
import AdminCommandCenter from '@/components/AdminCommandCenter';
import ComparisonModal from '@/components/ComparisonModal';
import ProblemSolutionModal from '@/components/ProblemSolutionModal';
import ManifestModal from '@/components/ManifestModal';
import { playSound } from '@/components/AudioEffects';
import campusData from '@/data/campus.json';

// Dynamically import Leaflet Map (client-only to prevent SSR errors)
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-xs gap-2">
      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <span>Loading Geeta University Spatial Transit Map...</span>
    </div>
  )
});

export default function CampusPoolPage() {
  const [simState, setSimState] = useState(null);
  const [events, setEvents] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Authenticated user session state: { role: 'student' | 'captain' | 'admin', user: {...} }
  const [currentUser, setCurrentUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Modals state
  const [showComparison, setShowComparison] = useState(false);
  const [showProblemSolution, setShowProblemSolution] = useState(false);
  const [inspectedVehicle, setInspectedVehicle] = useState(null);
  const [trackedVehicleId, setTrackedVehicleId] = useState(null);

  // Scripted Demo State
  const [demoActive, setDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoAuto, setDemoAuto] = useState(false);
  const demoAutoTimerRef = useRef(null);

  // Initialize and check persistent authentication or query params
  useEffect(() => {
    setMounted(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const portalParam = params.get('portal') || params.get('role');
      if (portalParam === 'student') {
        setCurrentUser({
          role: 'student',
          user: { name: 'Aarav Sharma', id: 'GU24-CSE-1042', credits: 160, department: 'School of AI & CSE' }
        });
        return;
      } else if (portalParam === 'captain') {
        const v = params.get('v') || 'V1';
        setCurrentUser({
          role: 'captain',
          user: { name: 'Captain Rajesh Kumar', badge: 'CAPT-' + v, vehicleId: v }
        });
        setTrackedVehicleId(v);
        return;
      } else if (portalParam === 'admin') {
        setCurrentUser({
          role: 'admin',
          user: { name: 'Chief Dispatcher Mehta', clearance: 'Tier-1 Master Dispatch Authority' }
        });
        return;
      }

      const saved = localStorage.getItem('geeta_transit_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);
        if (parsed.role === 'captain' && parsed.user?.vehicleId) {
          setTrackedVehicleId(parsed.user.vehicleId);
        }
      }
    } catch (e) {}
  }, []);

  const handleLogin = (userSession) => {
    setCurrentUser(userSession);
    try {
      localStorage.setItem('geeta_transit_user', JSON.stringify(userSession));
    } catch (e) {}
    if (userSession.role === 'captain' && userSession.user?.vehicleId) {
      setTrackedVehicleId(userSession.user.vehicleId);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('geeta_transit_user');
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  };

  const demoSteps = [
    {
      title: 'Step 1/7: Morning Baseline',
      caption: 'Geeta University Quiet Campus Baseline: Shuttles V1, V2, and V3 circulate between Gateway Building, Hostels, and Stadium.',
      run: () => {
        setIsPlaying(true);
      }
    },
    {
      title: 'Step 2/7: Class-Ends Pooling',
      caption: 'Class Dismissal: Concurrent students book from Hostels and Girls Mess to Academic Central. Engine pools them into Shuttle V1!',
      run: async () => {
        await handleAddRequest({ pickup: 'boys_hostel', dropoff: 'academic_complex', passengers: 1, windowMin: 10, maxDetourFactor: 1.5, riderName: 'Rohan Gupta' });
        await handleAddRequest({ pickup: 'girls_hostel', dropoff: 'academic_complex', passengers: 1, windowMin: 10, maxDetourFactor: 1.5, riderName: 'Priya Sharma' });
        setTrackedVehicleId('V1');
      }
    },
    {
      title: 'Step 3/7: Detour Breach Protection',
      caption: 'Commitment Protection: Incoming booking would cause an existing rider to exceed their 1.1x detour limit. Engine transparently rejects!',
      run: async () => {
        await handleAddRequest({ pickup: 'sports_complex', dropoff: 'north_entrance', passengers: 1, windowMin: 2, maxDetourFactor: 1.1, riderName: 'Amit Kumar' });
      }
    },
    {
      title: 'Step 4/7: Capacity Limit Rejection',
      caption: 'Capacity Invariant: 4-passenger booking arrives when shuttles are partially full. Rejection code CAPACITY_EXCEEDED with near-miss delta!',
      run: async () => {
        await handleAddRequest({ pickup: 'gateway_building', dropoff: 'sports_complex', passengers: 4, windowMin: 4, riderName: 'Group Booking' });
      }
    },
    {
      title: 'Step 5/7: Mid-Trip Cancellation',
      caption: 'Rider Cancellation: Student cancels waiting request. Shuttle route instantly shrinks and remaining passenger ETAs update.',
      run: async () => {
        const res = await handleAddRequest({ pickup: 'student_center', dropoff: 'staff_housing', passengers: 1, windowMin: 10, riderName: 'Vikram Singh' });
        if (res?.requestId) {
          setTimeout(() => {
            handleCancelRequest(res.requestId);
          }, 1400);
        }
      }
    },
    {
      title: 'Step 6/7: Road Closure & Breakdown',
      caption: 'Disruptions: Road e3 closes and Shuttle V2 reports breakdown. Engine reroutes active trips and reassigns passengers.',
      run: async () => {
        await handleToggleRoad({ id: 'e3', closed: false });
        await handleBreakVehicle('V2');
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

  // SSE Subscription & REST Sync
  useEffect(() => {
    let eventSource = null;

    const connectSSE = () => {
      eventSource = new EventSource('/api/stream');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'STATE_UPDATE' || data.type === 'INIT') {
            if (data.state) setSimState(data.state);
            if (data.events) setEvents(data.events);
            if (data.isRunning !== undefined) setIsPlaying(data.isRunning);
            if (data.speedMultiplier !== undefined) setSpeedMultiplier(data.speedMultiplier);
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };

      eventSource.onerror = () => {
        // Fallback polling if SSE is disconnected
        eventSource.close();
        setTimeout(fetchStatePolling, 2000);
      };
    };

    const fetchStatePolling = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          if (data.state) setSimState(data.state);
          if (data.events) setEvents(data.events);
        }
      } catch (err) {}
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Demo auto-advance timer
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
    if (demoSteps[stepIdx]) {
      demoSteps[stepIdx].run();
    }
  };

  const startDemo = () => {
    setDemoActive(true);
    setDemoAuto(false);
    executeDemoStep(0);
  };

  const stopDemo = () => {
    setDemoActive(false);
    setDemoAuto(false);
    if (demoAutoTimerRef.current) clearTimeout(demoAutoTimerRef.current);
  };

  // Backend API Call Handlers
  const handleTogglePlay = async () => {
    const nextAction = isPlaying ? 'pause' : 'play';
    setIsPlaying(!isPlaying);
    await fetch('/api/simulation/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: nextAction })
    });
  };

  const handleStep = async () => {
    await fetch('/api/simulation/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'step' })
    });
  };

  const handleSpeedChange = async (spd) => {
    setSpeedMultiplier(spd);
    await fetch('/api/simulation/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed: spd })
    });
  };

  const handleAddRequest = async (req) => {
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      return await res.json();
    } catch (e) {
      console.error('Add request error:', e);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/requests/${requestId}/cancel`, {
        method: 'POST'
      });
      return await res.json();
    } catch (e) {
      console.error('Cancel request error:', e);
    }
  };

  const handleBreakVehicle = async (vehicleId) => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/break`, {
        method: 'POST'
      });
      return await res.json();
    } catch (e) {
      console.error('Break vehicle error:', e);
    }
  };

  const handleToggleRoad = async (edge) => {
    try {
      const res = await fetch(`/api/roads/${edge.id}/toggle`, {
        method: 'POST'
      });
      return await res.json();
    } catch (e) {
      console.error('Toggle road error:', e);
    }
  };

  const handleClassBurst = async () => {
    const hubs = ['academic_complex', 'gateway_building', 'student_center', 'sports_complex'];
    const hostels = ['boys_hostel', 'girls_hostel', 'staff_housing', 'north_entrance'];
    for (let i = 0; i < 4; i++) {
      await handleAddRequest({
        pickup: hubs[i % hubs.length],
        dropoff: hostels[i % hostels.length],
        passengers: 1,
        windowMin: 10,
        maxDetourFactor: 1.5,
        riderName: `Surge Rider #${i + 1}`
      });
    }
  };

  const handleUpdateConfig = async (cfg) => {
    await fetch('/api/simulation/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });
  };

  // If user is not logged in or during initial mount, present dedicated Portal Login Hub
  if (mounted && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <LoginPage
          onLogin={handleLogin}
          onOpenProblemSolution={() => setShowProblemSolution(true)}
          onOpenComparison={() => setShowComparison(true)}
          soundEnabled={soundEnabled}
        />

        {/* Global Reference Modals */}
        <ComparisonModal
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
          seed={42}
          campus={campusData}
        />

        <ProblemSolutionModal
          isOpen={showProblemSolution}
          onClose={() => setShowProblemSolution(false)}
        />
      </div>
    );
  }

  const role = currentUser?.role || 'student';

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navigation Bar with Role-Specific Identity & Sign Out */}
      <TopNavbar
        simTime={simState?.time ?? 0}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onStep={handleStep}
        speedMultiplier={speedMultiplier}
        onSpeedChange={handleSpeedChange}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenProblemSolution={() => setShowProblemSolution(true)}
        onOpenComparison={() => setShowComparison(true)}
        onStartDemo={startDemo}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Scripted Presentation Demo Banner (for Admin) */}
      {role === 'admin' && (
        <DemoBanner
          active={demoActive}
          step={demoStep}
          steps={demoSteps}
          autoPlay={demoAuto}
          onNext={() => executeDemoStep(demoStep + 1)}
          onToggleAuto={() => setDemoAuto(!demoAuto)}
          onClose={stopDemo}
        />
      )}

      {/* Main Content Area: Strictly Segregated by Authenticated Role */}
      <main className="flex-1 p-3 md:p-4 max-w-7xl mx-auto w-full">
        {/* 1. STUDENT RIDER DEDICATED PORTAL */}
        {role === 'student' && (
          <div className="app-main-layout">
            {/* Spatial Leaflet Map Container */}
            <div className="w-full h-full min-h-[520px]">
              <LeafletMap
                state={simState}
                onNodeClick={(node) => {
                  if (soundEnabled) playSound('click');
                  handleAddRequest({
                    pickup: node.id,
                    dropoff: 'academic_complex',
                    passengers: 1,
                    windowMin: 10,
                    maxDetourFactor: 1.5,
                    riderName: currentUser?.user?.name || 'Aarav Sharma'
                  });
                }}
                liveTrackVehicleId={trackedVehicleId}
                onVehicleClick={(v) => {
                  if (soundEnabled) playSound('click');
                  setInspectedVehicle(v);
                }}
              />
            </div>

            {/* Right Student Booking Sidebar */}
            <div className="w-full h-full overflow-y-auto pr-1">
              <StudentRiderView
                nodes={simState?.nodes || campusData.nodes}
                requests={simState?.requests || []}
                vehicles={simState?.vehicles || []}
                onAddRequest={handleAddRequest}
                onCancelRequest={handleCancelRequest}
                soundEnabled={soundEnabled}
                currentUser={currentUser?.user}
              />
            </div>
          </div>
        )}

        {/* 2. SHUTTLE CAPTAIN COCKPIT DEDICATED TERMINAL */}
        {role === 'captain' && (
          <div className="app-main-layout">
            {/* Spatial Leaflet Map Container (Tracking Captain's Vehicle) */}
            <div className="w-full h-full min-h-[520px]">
              <LeafletMap
                state={simState}
                liveTrackVehicleId={currentUser?.user?.vehicleId || 'V1'}
                onVehicleClick={(v) => {
                  if (soundEnabled) playSound('click');
                  setInspectedVehicle(v);
                }}
              />
            </div>

            {/* Right Captain Cockpit Sidebar */}
            <div className="w-full h-full overflow-y-auto pr-1">
              <CaptainView
                vehicles={simState?.vehicles || []}
                nodes={simState?.nodes || campusData.nodes}
                requests={simState?.requests || []}
                onBreakVehicle={handleBreakVehicle}
                soundEnabled={soundEnabled}
                assignedVehicleId={currentUser?.user?.vehicleId || 'V1'}
              />
            </div>
          </div>
        )}

        {/* 3. TRANSPORT ADMIN DEDICATED COMMAND CENTER */}
        {role === 'admin' && (
          <div className="admin-main-layout">
            {/* Left Spatial Map Preview for Admin */}
            <div className="w-full min-h-[450px] xl:h-[calc(100vh-100px)]">
              <LeafletMap
                state={simState}
                onNodeClick={(node) => {
                  if (soundEnabled) playSound('click');
                  handleAddRequest({
                    pickup: node.id,
                    dropoff: 'academic_complex',
                    passengers: 1
                  });
                }}
                onEdgeClick={handleToggleRoad}
                liveTrackVehicleId={trackedVehicleId}
                onVehicleClick={(v) => {
                  if (soundEnabled) playSound('click');
                  setInspectedVehicle(v);
                }}
              />
            </div>

            {/* Right 7-Tab Admin Center */}
            <div className="w-full h-full overflow-y-auto pr-1">
              <AdminCommandCenter
                simState={{ ...(simState || {}), events }}
                onBreakVehicle={handleBreakVehicle}
                onToggleRoad={handleToggleRoad}
                onTriggerBurst={handleClassBurst}
                onCancelRequest={handleCancelRequest}
                onAddCustomRequest={handleAddRequest}
                onUpdateConfig={handleUpdateConfig}
                soundEnabled={soundEnabled}
              />
            </div>
          </div>
        )}
      </main>

      {/* Global Modals */}
      <ComparisonModal
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        seed={42}
        campus={campusData}
      />

      <ProblemSolutionModal
        isOpen={showProblemSolution}
        onClose={() => setShowProblemSolution(false)}
      />

      {inspectedVehicle && (
        <ManifestModal
          vehicle={inspectedVehicle}
          nodes={simState?.nodes || campusData.nodes}
          onClose={() => setInspectedVehicle(null)}
        />
      )}
    </div>
  );
}
