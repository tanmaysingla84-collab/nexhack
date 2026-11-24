'use client';

import React, { useState } from 'react';
import {
  Activity,
  Bus,
  ClipboardList,
  AlertOctagon,
  Sliders,
  BarChart2,
  ScrollText,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Shield
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
  onUpdateConfig,
  soundEnabled
}) {
  const [activeTab, setActiveTab] = useState('operations');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Config sliders
  const [detourFactor, setDetourFactor] = useState(simState?.config?.maxDetourFactor || 1.5);
  const [windowMin, setWindowMin] = useState(simState?.config?.windowMin || 10);
  const [batchingSec, setBatchingSec] = useState(10);

  const vehicles = simState?.vehicles || [];
  const edges = simState?.edges || [];
  const requests = simState?.requests || [];
  const events = simState?.events || [];
  const metrics = simState?.metrics || {};

  const totalSeats = vehicles.reduce((acc, v) => acc + (v.status !== 'broken' ? v.capacity : 0), 0);
  const totalOccupied = vehicles.reduce((acc, v) => acc + v.occupancy, 0);

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.dropoff.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.riderName && r.riderName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || r.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Top Admin Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg backdrop-blur-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE SHUTTLES</div>
          <div className="text-xl font-extrabold text-sky-400 mt-0.5">
            {vehicles.filter(v => v.status !== 'broken').length}/{vehicles.length}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Online Shuttles</span>
        </div>

        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg backdrop-blur-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LIVE OCCUPANCY</div>
          <div className="text-xl font-extrabold text-orange-400 mt-0.5">
            {totalOccupied}/{totalSeats}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Fleet Seats Utilized</span>
        </div>

        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg backdrop-blur-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ROAD CLOSURES</div>
          <div className="text-xl font-extrabold text-rose-400 mt-0.5">
            {edges.filter(e => e.closed).length}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Active Blockages</span>
        </div>

        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg backdrop-blur-md">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SERVICE COMPLIANCE</div>
          <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
            {metrics.servedPct ?? 100}%
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Zero Silent Drops</span>
        </div>
      </div>

      {/* 7 Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto shadow-md">
        {[
          { id: 'operations', label: '1. Live Operations', icon: Activity },
          { id: 'fleet', label: '2. Fleet Telemetry', icon: Bus },
          { id: 'requests', label: '3. Requests Manifest', icon: ClipboardList },
          { id: 'disruptions', label: '4. Disruption Simulator', icon: AlertOctagon },
          { id: 'config', label: '5. Heuristic Config', icon: Sliders },
          { id: 'analytics', label: '6. Live Analytics', icon: BarChart2 },
          { id: 'audit', label: '7. Audit Trail', icon: ScrollText }
        ].map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => {
                if (soundEnabled) playSound('click');
                setActiveTab(tab.id);
              }}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Live Operations */}
      {activeTab === 'operations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {vehicles.map(v => (
            <div key={v.id} className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: v.color || '#f97316' }} />
                  <span className="font-extrabold text-sm text-white">Shuttle {v.id}</span>
                </div>
                <span className={`status-pill ${v.status}`}>{v.status.toUpperCase()}</span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Station:</span>
                  <span className="font-bold text-white">{v.currentNode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Occupancy:</span>
                  <span className="font-bold text-orange-400">{v.occupancy}/{v.capacity} seats</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Next Stops:</span>
                  <span className="font-bold text-sky-400">{v.stops.length} stops</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Run-Time:</span>
                  <span className="font-mono text-emerald-400">{v.totalDistanceMin || 0}m</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Fleet Telemetry */}
      {activeTab === 'fleet' && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
          <h3 className="font-extrabold text-sm text-white mb-2">Fleet Readiness & Breakdown Management</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Shuttle</th>
                  <th className="p-2.5">Current Node</th>
                  <th className="p-2.5">Occupancy</th>
                  <th className="p-2.5">Stops Planned</th>
                  <th className="p-2.5">Mileage (min)</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.color || '#f97316' }}></span>
                      {v.id}
                    </td>
                    <td className="p-2.5">{v.currentNode}</td>
                    <td className="p-2.5 font-mono text-orange-400">{v.occupancy}/{v.capacity}</td>
                    <td className="p-2.5">{v.stops.length}</td>
                    <td className="p-2.5 font-mono">{v.totalDistanceMin || 0}m</td>
                    <td className="p-2.5"><span className={`status-pill ${v.status}`}>{v.status.toUpperCase()}</span></td>
                    <td className="p-2.5">
                      <button
                        className={`btn-sm py-1 px-2 text-[10px] ${v.status === 'broken' ? 'bg-emerald-600 text-white' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}
                        onClick={() => onBreakVehicle(v.id)}
                      >
                        {v.status === 'broken' ? 'Re-commission' : 'Trigger Breakdown'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Requests Manifest with Unmet Demand Near-Miss Inspection */}
      {activeTab === 'requests' && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, student or stop..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 w-full sm:w-64"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
              {['ALL', 'WAITING', 'ASSIGNED', 'ONBOARD', 'COMPLETED', 'REJECTED'].map(st => (
                <button
                  key={st}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    statusFilter === st ? 'bg-orange-500 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No ride requests matching filter.
              </div>
            ) : (
              filteredRequests.map(r => {
                const isRejected = r.status === 'rejected';
                return (
                  <div key={r.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-white">{r.id}</span>
                        <span className="text-xs text-slate-300 font-semibold">• {r.riderName || 'GU Student'}</span>
                      </div>
                      <span className={`status-pill ${r.status}`}>{r.status.toUpperCase()}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="font-semibold text-emerald-400">{r.pickup}</span>
                      <span className="text-slate-500">➔</span>
                      <span className="font-semibold text-orange-400">{r.dropoff}</span>
                      {r.vehicleId && (
                        <span className="ml-auto text-sky-400 font-mono font-bold">🚐 {r.vehicleId}</span>
                      )}
                    </div>

                    {/* Unmet Demand Explainability Near-Miss Box */}
                    {isRejected && (
                      <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/50 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Constraint Code: <code>{r.code || 'CAPACITY_EXCEEDED'}</code></span>
                        </div>
                        <p className="text-[11px] text-rose-200/90 leading-tight">
                          <strong>Primary Rejection Reason:</strong> {r.rejectionReason}
                        </p>
                        {r.bestNearMiss && (
                          <div className="p-1.5 rounded-lg bg-rose-900/40 text-[10px] text-rose-200 font-mono">
                            🎯 <strong>Nearest Candidate Delta:</strong> {r.bestNearMiss}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Disruption Controls (Road Closures & Class Bursts) */}
      {activeTab === 'disruptions' && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-white">Live Disruption & Stress Testing</h3>
              <p className="text-xs text-slate-400">Trigger road closures or class dismissal ride surges</p>
            </div>
            <button
              className="btn-primary btn-sm flex items-center gap-1.5 shadow-lg shadow-orange-500/25"
              onClick={() => {
                if (soundEnabled) playSound('chime');
                onTriggerBurst();
              }}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Class Dismissal Surge (4 Rides)</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-2.5">Edge ID</th>
                  <th className="p-2.5">Connected Stations</th>
                  <th className="p-2.5">Travel Time</th>
                  <th className="p-2.5">Road Status</th>
                  <th className="p-2.5">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {edges.map(e => (
                  <tr key={e.id} className={e.closed ? 'bg-rose-950/20' : 'hover:bg-slate-800/40'}>
                    <td className="p-2.5 font-bold font-mono text-white">{e.id}</td>
                    <td className="p-2.5">{e.from} ➔ {e.to}</td>
                    <td className="p-2.5 font-mono">{e.minutes} min</td>
                    <td className="p-2.5">
                      <span className={`status-pill ${e.closed ? 'rejected' : 'completed'}`}>
                        {e.closed ? '🔴 CLOSED' : '🟢 OPEN'}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <button
                        className={`btn-sm py-1 px-2.5 text-[10px] ${e.closed ? 'bg-emerald-600 text-white' : 'bg-rose-900/60 border border-rose-700 text-rose-200'}`}
                        onClick={() => {
                          if (soundEnabled) playSound('click');
                          onToggleRoad(e);
                        }}
                      >
                        {e.closed ? 'Reopen Road' : 'Close Road'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Heuristic Configuration */}
      {activeTab === 'config' && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl max-w-lg space-y-4">
          <h3 className="font-extrabold text-sm text-white pb-2 border-b border-slate-800">
            Dispatching & Mathematical Parameters
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-300">Max Detour Factor:</span>
                <span className="font-mono text-orange-400 font-bold">{detourFactor}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.1"
                className="w-full accent-orange-500 cursor-pointer"
                value={detourFactor}
                onChange={e => setDetourFactor(parseFloat(e.target.value))}
              />
              <span className="text-[10px] text-slate-400 block">
                Passenger guarantee: rideTime &le; directTime &times; {detourFactor}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-300">Default Pickup Window:</span>
                <span className="font-mono text-sky-400 font-bold">{windowMin} min</span>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                step="1"
                className="w-full accent-sky-500 cursor-pointer"
                value={windowMin}
                onChange={e => setWindowMin(parseInt(e.target.value, 10))}
              />
            </div>

            <button
              className="btn-primary w-full py-2.5 rounded-xl font-bold text-xs mt-2"
              onClick={() => {
                if (soundEnabled) playSound('success');
                onUpdateConfig({ maxDetourFactor: detourFactor, windowMin, batchingSec });
                alert('Heuristic parameters updated! Detour limits applied across all shuttles.');
              }}
            >
              Apply Heuristic Configuration
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: Analytics & Comparison Summary */}
      {activeTab === 'analytics' && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
          <h3 className="font-extrabold text-sm text-white mb-2">Live Operation Outcome Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">Total Fleet Mileage</span>
              <span className="text-lg font-bold text-sky-400">{metrics.totalDistanceMin || 0}m</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">Average Wait Time</span>
              <span className="text-lg font-bold text-orange-400">{metrics.avgWaitMin || 0}m</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">Riders Completed</span>
              <span className="text-lg font-bold text-emerald-400">{metrics.completedCount || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">Unmet Rejections</span>
              <span className="text-lg font-bold text-rose-400">{metrics.rejectedCount || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: Audit Log */}
      {activeTab === 'audit' && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
          <h3 className="font-extrabold text-sm text-white pb-2 border-b border-slate-800">
            Real-Time Simulation Audit Trail ({events.length} Events)
          </h3>
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {[...events].reverse().map((ev, i) => (
              <div key={i} className={`event-entry ${ev.type || 'info'} text-xs p-2 rounded-xl`}>
                <span className="event-time">t={ev.time}m</span>
                <span className="font-extrabold text-orange-400 uppercase tracking-wider text-[10px] mr-2">[{ev.type}]:</span>
                <span className="text-slate-200">{ev.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
