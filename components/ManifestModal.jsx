'use client';

import React from 'react';
import { Bus, Users, MapPin, X, CheckCircle2 } from 'lucide-react';

export default function ManifestModal({ vehicle, onClose, nodes = [] }) {
  if (!vehicle) return null;

  const nodeMap = new Map(nodes.map(n => [n.id, n.name]));

  return (
    <div className="modal-backdrop active" style={{ zIndex: 2500 }}>
      <div className="modal-window max-w-lg">
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <Bus className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="font-extrabold text-sm text-white">
                Shuttle {vehicle.id} Passenger Manifest
              </h3>
              <p className="text-[11px] text-slate-400">
                Seat Load: <strong className="text-orange-400">{vehicle.occupancy}/{vehicle.capacity} seats</strong> • Status: <span className={`status-pill ${vehicle.status} text-[10px]`}>{vehicle.status.toUpperCase()}</span>
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body p-4 space-y-4">
          {/* Active Onboard Students */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-orange-400" />
                Students Currently Onboard ({vehicle.onboard.length})
              </span>
              <span className="text-[10px] text-orange-400">Detour Protected</span>
            </div>

            {vehicle.onboard.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                No passengers currently in shuttle seats.
              </div>
            ) : (
              <div className="space-y-1.5">
                {vehicle.onboard.map((reqId, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-white">🎓 Rider {reqId}</span>
                      <span className="text-[10px] text-slate-400 block">Journey active • En-route</span>
                    </div>
                    <span className="status-pill onboard text-[10px]">ONBOARD</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Planned Next Stops Manifest */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              Upcoming Scheduled Stops ({vehicle.stops.length})
            </span>

            {vehicle.stops.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                Stationary at {nodeMap.get(vehicle.currentNode) || vehicle.currentNode}. Awaiting requests.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {vehicle.stops.map((stop, index) => {
                  const isPickup = stop.type === 'pickup';
                  return (
                    <div
                      key={index}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-extrabold text-[10px] text-white ${
                            isPickup ? 'bg-emerald-600' : 'bg-orange-600'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-bold text-white">
                            {nodeMap.get(stop.node) || stop.node}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {isPickup ? '🟢 PICKUP' : '🏁 DROPOFF'} • Rider {stop.requestId}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-orange-400 font-bold">
                        ETA: t={stop.plannedArrival}m
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
