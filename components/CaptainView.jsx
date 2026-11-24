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
  Compass,
  Bell,
  Check,
  X,
  Sparkles
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
  const [actionLoading, setActionLoading] = useState(null);
  const nodeMap = new Map(nodes.map(n => [n.id, n.name]));

  React.useEffect(() => {
    if (assignedVehicleId) {
      setSelectedVehicleId(assignedVehicleId);
    }
  }, [assignedVehicleId]);

  const vehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
  const isBroken = vehicle?.status === 'broken';

  const pendingRequests = requests.filter(r => r.status === 'pending_driver');

  const onboardRiders = (vehicle?.onboard || []).map(rId =>
    requests.find(r => r.id === rId) || { id: rId, riderName: `Student ${rId}`, dropoff: 'Campus Stop' }
  );

  const handleAccept = async (requestId) => {
    if (soundEnabled) playSound('success');
    setActionLoading(requestId);
    try {
      await fetch(`/api/requests/${requestId}/driver-accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: selectedVehicleId })
      });
    } catch (e) {
      console.error('Accept error:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (requestId) => {
    if (soundEnabled) playSound('alert');
    setActionLoading(requestId);
    try {
      await fetch(`/api/requests/${requestId}/driver-decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Driver at full capacity or detour limits exceeded' })
      });
    } catch (e) {
      console.error('Decline error:', e);
    } finally {
      setActionLoading(null);
    }
  };

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
            <span>Bus {v.id}</span>
            {v.status === 'broken' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>}
          </button>
        ))}
      </div>

      {/* 🚨 INCOMING RIDE REQUESTS (MUST BE ACCEPTED BY DRIVER) */}
      {pendingRequests.length > 0 && (
        <div className="p-4 bg-gradient-to-b from-amber-950/80 via-slate-900 to-amber-950/60 border-2 border-amber-500/80 rounded-2xl shadow-xl shadow-amber-500/20 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
              <span className="font-extrabold text-xs tracking-wider text-amber-300 uppercase">
                Incoming Ride Request ({pendingRequests.length})
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
              DRIVER CONFIRMATION REQUIRED
            </span>
          </div>

          <div className="space-y-2.5">
            {pendingRequests.map(r => (
              <div key={r.id} className="p-3 bg-slate-950/95 border border-amber-500/40 rounded-xl space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🎓</span>
                    <div>
                      <div className="font-extrabold text-sm text-white">{r.riderName || r.id}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.studentId || r.id}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    {r.passengers || 1} Seat(s)
                  </span>
                </div>

                <div className="space-y-1.5 text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Pickup Station:</span>
                    <span className="font-bold text-emerald-400 truncate max-w-[200px]">
                      {nodeMap.get(r.pickup) || r.pickup}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Dropoff Destination:</span>
                    <span className="font-bold text-orange-400 truncate max-w-[200px]">
                      {nodeMap.get(r.dropoff) || r.dropoff}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-800">
                    <span className="text-slate-500">Service Zone:</span>
                    <span className="font-semibold text-sky-400">
                      {r.pickup?.startsWith('H') || r.dropoff?.startsWith('H') ? '🏙️ Outside Cities (Haryana)' : '🏫 Inside Cities'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    onClick={() => handleAccept(r.id)}
                    disabled={actionLoading === r.id}
                    className="py-2.5 px-3 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{actionLoading === r.id ? 'Accepting...' : 'Accept Ride'}</span>
                  </button>
                  <button
                    onClick={() => handleDecline(r.id)}
                    disabled={actionLoading === r.id}
                    className="py-2.5 px-3 rounded-xl font-bold text-xs bg-rose-950/60 border border-rose-800/80 hover:bg-rose-900/60 text-rose-300 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {vehicle ? (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
          {/* Driver Terminal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: isBroken ? '#ef4444' : (vehicle.color || '#f97316') }} />
                <h3 className="font-extrabold text-sm text-white">Campus Bus {vehicle.id}</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Bus Driver Terminal</span>
            </div>
            <span className={`status-pill ${vehicle.status}`}>
              {isBroken ? '🚨 BREAKDOWN' : vehicle.status.toUpperCase()}
            </span>
          </div>

          {/* Instruments Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">CURRENT LOCATION</span>
              <span className="font-bold text-white text-xs truncate block">
                {nodeMap.get(vehicle.currentNode) || vehicle.currentNode}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">NEXT HEADING</span>
              <span className="font-bold text-sky-400 text-xs truncate block">
                {vehicle.targetNode ? (nodeMap.get(vehicle.targetNode) || vehicle.targetNode) : 'At Station'}
              </span>
            </div>
          </div>

          {/* Seat Capacity Bar */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Users className="w-3.5 h-3.5" />
                Live Bus Seats
              </span>
              <span className="font-mono text-orange-400 font-bold">
                {vehicle.occupancy}/{vehicle.capacity} Seats Filled
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
                Assigned Route Stops ({vehicle.stops.length})
              </span>
            </div>

            {vehicle.stops.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                All assigned stops completed. Bus is standing at station ready for rides.
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
                No students currently in bus seats.
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

          {/* Emergency Breakdown Trigger / Clear Breakdown Button */}
          <button
            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md ${
              isBroken
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-rose-950/40 border border-rose-800 text-rose-300 hover:bg-rose-900/50'
            }`}
            onClick={async () => {
              if (soundEnabled) playSound(isBroken ? 'success' : 'alert');
              if (onBreakVehicle) {
                await onBreakVehicle(vehicle.id);
              }
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isBroken ? 'Clear Breakdown & Re-commission Bus' : 'Simulate Bus Breakdown'}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
