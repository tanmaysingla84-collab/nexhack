'use client';

import React, { useState } from 'react';
import {
  Bus,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Shield,
  Road,
  Play,
  RotateCcw,
  Radio
} from 'lucide-react';
import { playSound } from './AudioEffects';

export default function AdminCommandCenter({
  simState = {},
  onBreakVehicle,
  onToggleRoad,
  onReset,
  onTriggerBurst,
  onCancelRequest,
  onAddCustomRequest,
  soundEnabled
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const vehicles = simState?.vehicles || [];
  const edges = simState?.edges || [];
  const requests = simState?.requests || [];
  const metrics = simState?.metrics || {};
  const nodes = simState?.nodes || [];
  const nodeMap = new Map(nodes.map(n => [n.id, n.name]));

  const totalSeats = vehicles.reduce((acc, v) => acc + (v.status !== 'broken' ? v.capacity : 0), 0);
  const totalOccupied = vehicles.reduce((acc, v) => acc + v.occupancy, 0);

  const closedRoads = edges.filter(e => e.closed);
  const centralEdge = edges.find(e => e.id === 'E05' || e.id === 'E08') || edges[0];

  const filteredRequests = requests.filter(r => {
    const q = searchTerm.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      (r.riderName && r.riderName.toLowerCase().includes(q)) ||
      (r.pickup && r.pickup.toLowerCase().includes(q)) ||
      (r.dropoff && r.dropoff.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-4 w-full h-full pb-8">
      {/* 1. TOP KPI SUMMARY STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg backdrop-blur-md">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ACTIVE BUSES</div>
          <div className="text-2xl font-black text-sky-400 mt-0.5">
            {vehicles.filter(v => v.status !== 'broken').length} / {vehicles.length}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Buses on Route</span>
        </div>

        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg backdrop-blur-md">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">SEATS OCCUPIED</div>
          <div className="text-2xl font-black text-orange-400 mt-0.5">
            {totalOccupied} / {totalSeats}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Live Passenger Load</span>
        </div>

        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg backdrop-blur-md">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ROAD BLOCKAGES</div>
          <div className="text-2xl font-black text-rose-400 mt-0.5">
            {closedRoads.length}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">{closedRoads.length === 0 ? 'All Roads Open' : 'Active Road Closure'}</span>
        </div>

        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg backdrop-blur-md">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">SERVICE COVERAGE</div>
          <div className="text-2xl font-black text-emerald-400 mt-0.5">
            {metrics.servedPct ?? 100}%
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Trips Served Successfully</span>
        </div>
      </div>

      {/* 2. THREE-SECTION CLEAN DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SECTION A: ACTIVE FLEET BUS CARDS */}
        <div className="lg:col-span-1 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-orange-400" />
              <h3 className="font-extrabold text-sm text-white">Campus Bus Fleet</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">{vehicles.length} Vehicles</span>
          </div>

          <div className="space-y-3">
            {vehicles.map(v => {
              const isBroken = v.status === 'broken';
              return (
                <div
                  key={v.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isBroken
                      ? 'bg-rose-950/30 border-rose-800/60'
                      : 'bg-slate-950 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: isBroken ? '#ef4444' : (v.color || '#f97316') }} />
                      <span className="font-black text-sm text-white">Bus {v.id}</span>
                    </div>
                    <span className={`status-pill ${v.status} text-[10px]`}>
                      {isBroken ? '🚨 BREAKDOWN' : v.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300 mb-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Station:</span>
                      <span className="font-bold text-slate-200 truncate max-w-[150px]">
                        {nodeMap.get(v.currentNode) || v.currentNode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Seats Taken:</span>
                      <span className="font-bold text-orange-400 font-mono">
                        {v.occupancy} / {v.capacity} seats
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Upcoming Stops:</span>
                      <span className="font-semibold text-sky-400">{v.stops?.length || 0} stops queued</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (soundEnabled) playSound('alert');
                      onBreakVehicle(v.id);
                    }}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isBroken
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>{isBroken ? 'Repair & Put Back in Service' : 'Simulate Breakdown'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION B: LIVE PASSENGER RIDE BOOKINGS */}
        <div className="lg:col-span-2 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <h3 className="font-extrabold text-sm text-white">Live Passenger Bookings</h3>
            </div>
            <input
              type="text"
              placeholder="Filter by rider or stop..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500 w-44"
            />
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active passenger bookings at this moment.
              </div>
            ) : (
              filteredRequests.map(r => {
                const isPending = r.status === 'pending_driver';
                const isRejected = r.status === 'rejected';
                const isAssigned = r.status === 'assigned' || r.status === 'waiting';
                const isOnboard = r.status === 'onboard';

                return (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-950/90 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg">
                        {isPending ? '⏳' : isRejected ? '❌' : isOnboard ? '🚀' : '🚐'}
                      </span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-white text-xs truncate">
                          {r.riderName || r.id}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                          <span className="text-emerald-400">{nodeMap.get(r.pickup) || r.pickup}</span>
                          <span>➔</span>
                          <span className="text-orange-400">{nodeMap.get(r.dropoff) || r.dropoff}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {r.vehicleId && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-950 text-sky-400 border border-sky-800">
                          Bus {r.vehicleId}
                        </span>
                      )}
                      <span className={`status-pill ${r.status} text-[10px]`}>
                        {isPending ? 'AWAITING DRIVER' : r.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. SECTION C: 1-CLICK DISRUPTION & SYSTEM TESTING */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="font-extrabold text-sm text-white">1-Click Live Operations & Disruption Tests</h3>
          </div>
          <span className="text-[11px] text-slate-400">Click any action to verify real-time engine response</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Test 1: Vehicle Breakdown */}
          <button
            onClick={() => {
              if (soundEnabled) playSound('alert');
              onBreakVehicle('V1');
            }}
            className="p-3 rounded-xl bg-slate-950 border border-rose-800/50 hover:border-rose-600 transition-all text-left group"
          >
            <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Simulate Bus Breakdown</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Forces Bus V1 offline. Engine immediately reroutes passengers to other available buses.
            </p>
          </button>

          {/* Test 2: Road Closure */}
          <button
            onClick={() => {
              if (soundEnabled) playSound('alert');
              if (centralEdge) onToggleRoad(centralEdge.id);
            }}
            className="p-3 rounded-xl bg-slate-950 border border-amber-800/50 hover:border-amber-600 transition-all text-left group"
          >
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs mb-1">
              <Road className="w-4 h-4" />
              <span>{closedRoads.length > 0 ? 'Reopen Closed Road' : 'Close Central Boulevard'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Blocks campus road. Engine dynamically recalculates detour paths for active buses.
            </p>
          </button>

          {/* Test 3: Class Dismissal Rush */}
          <button
            onClick={() => {
              if (soundEnabled) playSound('success');
              if (onTriggerBurst) onTriggerBurst();
            }}
            className="p-3 rounded-xl bg-slate-950 border border-sky-800/50 hover:border-sky-600 transition-all text-left group"
          >
            <div className="flex items-center gap-2 text-sky-400 font-extrabold text-xs mb-1">
              <Users className="w-4 h-4" />
              <span>Trigger Class Dismissal Rush</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Simulates concurrent students leaving classes, demonstrating multi-rider pooling.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
