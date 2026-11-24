'use client';

import React, { useState } from 'react';
import {
  Bus,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  Navigation,
  Gauge,
  Clock,
  Compass
} from 'lucide-react';
import { playSound } from './AudioEffects';

export default function CaptainView({
  vehicles = [],
  nodes = [],
  requests = [],
  onBreakVehicle,
  soundEnabled,
  assignedVehicleId = 'V1'
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(assignedVehicleId || vehicles[0]?.id || 'V1');
  const nodeMap = new Map(nodes.map(n => [n.id, n.name]));

  React.useEffect(() => {
    if (assignedVehicleId) {
      setSelectedVehicleId(assignedVehicleId);
    }
  }, [assignedVehicleId]);

  const vehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
  const isBroken = vehicle?.status === 'broken';

  const onboardRiders = (vehicle?.onboard || []).map(rId =>
    requests.find(r => r.id === rId) || { id: rId, riderName: `Student ${rId}`, dropoff: 'Campus Stop' }
  );

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      {/* Shuttle Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md">
        {vehicles.map(v => (
          <button
            key={v.id}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              v.id === selectedVehicleId
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => {
              if (soundEnabled) playSound('click');
              setSelectedVehicleId(v.id);
            }}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>{v.id}</span>
            {v.status === 'broken' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>}
          </button>
        ))}
      </div>

      {vehicle ? (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          {/* Cockpit Status Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: isBroken ? '#ef4444' : (vehicle.color || '#f97316') }} />
                <h3 className="font-extrabold text-sm text-white">Shuttle {vehicle.id} Cockpit</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Captain Nav Station</span>
            </div>
            <span className={`status-pill ${vehicle.status}`}>
              {isBroken ? '🚨 BREAKDOWN' : vehicle.status.toUpperCase()}
            </span>
          </div>

          {/* Instruments Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">CURRENT STATION</span>
              <span className="font-bold text-white text-xs truncate block">
                {nodeMap.get(vehicle.currentNode) || vehicle.currentNode}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">NEXT HEADING</span>
              <span className="font-bold text-sky-400 text-xs truncate block">
                {vehicle.targetNode ? (nodeMap.get(vehicle.targetNode) || vehicle.targetNode) : 'Stationary'}
              </span>
            </div>
          </div>

          {/* Seat Capacity Bar */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Users className="w-3.5 h-3.5" />
                Live Seat Occupancy
              </span>
              <span className="font-mono text-orange-400 font-bold">
                {vehicle.occupancy}/{vehicle.capacity} Seats Taken
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (vehicle.occupancy / vehicle.capacity) * 100)}%`,
                  background: vehicle.occupancy >= vehicle.capacity ? '#ef4444' : (vehicle.color || '#f97316')
                }}
              />
            </div>
          </div>

          {/* Ordered Stop Itinerary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                Next Route Stops ({vehicle.stops.length})
              </span>
            </div>

            {vehicle.stops.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                All assigned stops completed. Shuttle is waiting at station.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {vehicle.stops.map((stop, idx) => {
                  const isPickup = stop.type === 'pickup';
                  return (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-extrabold text-[10px] text-white ${
                            isPickup ? 'bg-emerald-600' : 'bg-orange-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-200 text-xs">
                            {nodeMap.get(stop.node) || stop.node}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {isPickup ? '🟢 PICKUP' : '🏁 DROPOFF'} • Rider {stop.requestId}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-orange-400 font-bold">
                        t={stop.plannedArrival}m
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Onboard Students */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-orange-400" />
              Onboard Passengers ({onboardRiders.length})
            </span>

            {onboardRiders.length === 0 ? (
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                No students currently in vehicle seats.
              </div>
            ) : (
              <div className="space-y-1">
                {onboardRiders.map((r, i) => (
                  <div key={i} className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-200">🎓 {r.riderName || r.id}</span>
                      <span className="text-[10px] text-slate-400 block">Bound for: {nodeMap.get(r.dropoff) || r.dropoff}</span>
                    </div>
                    <span className="status-pill onboard text-[10px]">ONBOARD</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Emergency Breakdown Trigger Button */}
          <button
            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              isBroken
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-rose-950/40 border border-rose-800 text-rose-300 hover:bg-rose-900/50'
            }`}
            onClick={() => {
              if (soundEnabled) playSound('alert');
              onBreakVehicle(vehicle.id);
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isBroken ? 'Clear Breakdown & Re-commission' : 'Simulate Vehicle Breakdown'}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
