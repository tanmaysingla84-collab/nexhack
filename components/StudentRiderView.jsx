'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  MapPin,
  ArrowUpDown,
  Users,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CreditCard,
  Bus
} from 'lucide-react';
import { playSound } from './AudioEffects';

export default function StudentRiderView({
  nodes = [],
  requests = [],
  vehicles = [],
  onAddRequest,
  onCancelRequest,
  soundEnabled,
  currentUser = { name: 'Aarav Sharma', id: 'GU24-CSE-1042', credits: 160 }
}) {
  const [pickup, setPickup] = useState('boys_hostel');
  const [dropoff, setDropoff] = useState('academic_complex');
  const [rideType, setRideType] = useState('pool'); // 'pool' | 'solo'
  const [passengers, setPassengers] = useState(1);
  const [activeRideId, setActiveRideId] = useState(null);

  // Sync station selections with loaded nodes
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      if (!nodes.some(n => n.id === pickup)) {
        setPickup(nodes.find(n => n.id.includes('hostel'))?.id || nodes[0].id);
      }
      if (!nodes.some(n => n.id === dropoff)) {
        setDropoff(nodes.find(n => n.id.includes('academic') || n.id.includes('gateway'))?.id || nodes[1]?.id || nodes[0].id);
      }
    }
  }, [nodes]);

  // Find user's active ride
  const activeRide = requests.find(r =>
    (r.id === activeRideId || 
     (currentUser?.name && r.riderName?.toLowerCase().includes(currentUser.name.toLowerCase())) || 
     (currentUser?.id && r.studentId === currentUser.id)) &&
    ['waiting', 'assigned', 'onboard'].includes(r.status)
  ) || (activeRideId ? requests.find(r => r.id === activeRideId) : null);

  const handleBook = (e) => {
    e.preventDefault();
    if (pickup === dropoff) {
      alert('Pickup and dropoff destination cannot be the same station!');
      return;
    }

    if (soundEnabled) playSound('success');

    // Confetti effect
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#f97316', '#38bdf8', '#10b981']
      });
    } catch (err) {}

    const result = onAddRequest({
      pickup,
      dropoff,
      passengers: parseInt(passengers, 10),
      windowMin: 10,
      maxDetourFactor: rideType === 'pool' ? 1.5 : 1.0,
      riderName: currentUser.name,
      studentId: currentUser.id
    });

    if (result?.requestId) {
      setActiveRideId(result.requestId);
    }
  };

  const swapStations = () => {
    if (soundEnabled) playSound('click');
    const temp = pickup;
    setPickup(dropoff);
    setDropoff(temp);
  };

  const assignedVehicle = activeRide?.vehicleId
    ? vehicles.find(v => v.id === activeRide.vehicleId)
    : null;

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      {/* Student Profile Quick Strip */}
      <div className="flex items-center justify-between p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-orange-500/20">
            🎓
          </div>
          <div>
            <div className="font-extrabold text-sm text-white">{currentUser.name}</div>
            <div className="text-[11px] text-slate-400 font-mono">{currentUser.id} • School of AI</div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Campus Credits</span>
          <span className="text-sm font-extrabold text-orange-400">🪙 {currentUser.credits} pts</span>
        </div>
      </div>

      {/* Live Active Ride Card / Boarding Pass */}
      {activeRide ? (
        <div className="p-4 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-orange-500/40 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-orange-400 animate-bounce" />
              <span className="font-extrabold text-xs tracking-wider text-white uppercase">
                {activeRide.status === 'onboard' ? '🚀 RIDE IN PROGRESS' : '🚐 SHUTTLE EN-ROUTE'}
              </span>
            </div>
            <span className={`status-pill ${activeRide.status}`}>
              {activeRide.status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-2 mb-3 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-medium">Assigned Shuttle:</span>
              <span className="font-extrabold text-sky-400 text-sm">
                {activeRide.vehicleId ? `Shuttle ${activeRide.vehicleId}` : 'Dispatching...'}
              </span>
            </div>
            {assignedVehicle && (
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Occupancy:</span>
                <span>{assignedVehicle.occupancy}/{assignedVehicle.capacity} seats taken</span>
              </div>
            )}
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-medium">Pickup Station:</span>
              <span className="font-bold text-emerald-400">{activeRide.pickup}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-medium">Dropoff Station:</span>
              <span className="font-bold text-orange-400">{activeRide.dropoff}</span>
            </div>
          </div>

          {/* Guarantee Badge */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-sky-950/40 border border-sky-800/40 text-[11px] text-sky-300 mb-3">
            <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400" />
            <span><strong>Detour Bound Active:</strong> Guaranteed max ride delay within 1.5x direct duration.</span>
          </div>

          {/* Cancel button if waiting or assigned */}
          {(activeRide.status === 'waiting' || activeRide.status === 'assigned') && (
            <button
              className="w-full py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/50 transition-colors flex items-center justify-center gap-1.5"
              onClick={() => {
                if (soundEnabled) playSound('alert');
                onCancelRequest(activeRide.id);
              }}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Ride Booking</span>
            </button>
          )}
        </div>
      ) : null}

      {/* Booking Form Card */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-orange-400 uppercase block">⚡ GU RAPIDO DISPATCH</span>
            <h3 className="font-extrabold text-sm text-white">Book a Campus Shuttle</h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            Pool Enabled
          </span>
        </div>

        <form onSubmit={handleBook} className="space-y-3">
          {/* Pickup Station */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              PICKUP STATION
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500"
              value={pickup}
              onChange={e => setPickup(e.target.value)}
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          {/* Swap Stations Button */}
          <div className="flex justify-center -my-1">
            <button
              type="button"
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-transform active:scale-90"
              onClick={swapStations}
              title="Swap Pickup and Dropoff"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-orange-400" />
            </button>
          </div>

          {/* Dropoff Destination */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              DROPOFF DESTINATION
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500"
              value={dropoff}
              onChange={e => setDropoff(e.target.value)}
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          {/* Ride Mode Selector (Shared Pool vs Solo Direct) */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                rideType === 'pool'
                  ? 'bg-orange-500/15 border-orange-500 text-white shadow-md shadow-orange-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
              onClick={() => {
                if (soundEnabled) playSound('click');
                setRideType('pool');
              }}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                <span>⚡ Shared Pool</span>
                <span className="text-[10px] text-orange-400">10 pts</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Smart dynamic pooling • 1.5x detour bound
              </p>
            </div>

            <div
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                rideType === 'solo'
                  ? 'bg-sky-500/15 border-sky-500 text-white shadow-md shadow-sky-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
              onClick={() => {
                if (soundEnabled) playSound('click');
                setRideType('solo');
              }}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                <span>🚀 Solo Direct</span>
                <span className="text-[10px] text-sky-400">25 pts</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Direct unshared trip • Zero detour
              </p>
            </div>
          </div>

          {/* Passenger Count */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-3.5 h-3.5" />
              Seats Required:
            </span>
            <select
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              value={passengers}
              onChange={e => setPassengers(e.target.value)}
            >
              <option value="1" className="bg-slate-900">1 Rider</option>
              <option value="2" className="bg-slate-900">2 Riders</option>
              <option value="3" className="bg-slate-900">3 Riders</option>
              <option value="4" className="bg-slate-900">4 Riders</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Confirm & Request Campus Shuttle</span>
          </button>
        </form>
      </div>
    </div>
  );
}
