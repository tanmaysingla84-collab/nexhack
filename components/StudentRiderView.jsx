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
  Bus,
  Compass,
  Radio,
  Building,
  Map as MapIcon,
  ArrowRight
} from 'lucide-react';
import { playSound } from './AudioEffects';

export default function StudentRiderView({
  nodes = [],
  requests = [],
  vehicles = [],
  onAddRequest,
  onCancelRequest,
  soundEnabled,
  currentUser = { name: 'Aarav Sharma', id: 'GU24-CSE-1042', credits: 160 },
  activeRideId: externalActiveRideId,
  onRidePlaced
}) {
  const [pickup, setPickup] = useState('N07');
  const [dropoff, setDropoff] = useState('H01');
  const [rideType, setRideType] = useState('pool'); // 'pool' | 'solo'
  const [passengers, setPassengers] = useState(1);
  const [activeRideId, setActiveRideId] = useState(externalActiveRideId || null);

  useEffect(() => {
    if (externalActiveRideId) {
      setActiveRideId(externalActiveRideId);
    }
  }, [externalActiveRideId]);

  // Separate stations by region
  const campusNodes = nodes.filter(n => n.region === 'campus' || (!n.region && !n.id.startsWith('H')));
  const haryanaNodes = nodes.filter(n => n.region === 'haryana' || n.id.startsWith('H'));

  // Route characteristics
  const isPickupCampus = !pickup.startsWith('H');
  const isDropoffCampus = !dropoff.startsWith('H');

  let routeCategoryLabel = '🏫 Inside Campus Shuttle';
  let routeBadgeBg = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  let poolPoints = '2 pts';
  let soloPoints = '5 pts';

  if (isPickupCampus && !isDropoffCampus) {
    routeCategoryLabel = '🏫 Campus ➔ 🏙️ Outside City Transit';
    routeBadgeBg = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    poolPoints = '5 pts';
    soloPoints = '10 pts';
  } else if (!isPickupCampus && isDropoffCampus) {
    routeCategoryLabel = '🏙️ Outside City ➔ 🏫 Campus Shuttle';
    routeBadgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    poolPoints = '5 pts';
    soloPoints = '10 pts';
  } else if (!isPickupCampus && !isDropoffCampus) {
    routeCategoryLabel = '🏙️ Haryana Regional Inter-City';
    routeBadgeBg = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    poolPoints = '5 pts';
    soloPoints = '10 pts';
  }

  // Find user's active ride (including pending driver approval)
  const currentRideId = externalActiveRideId || activeRideId;
  const activeRide = requests.find(r =>
    (r.id === currentRideId ||
     (currentUser?.name && r.riderName?.toLowerCase().includes(currentUser.name.toLowerCase())) ||
     (currentUser?.id && r.studentId === currentUser.id)) &&
    ['pending_driver', 'waiting', 'assigned', 'onboard'].includes(r.status)
  ) || (currentRideId ? requests.find(r => r.id === currentRideId && ['pending_driver', 'waiting', 'assigned', 'onboard', 'rejected'].includes(r.status)) : null);

  const nodeMap = new Map(nodes.map(n => [n.id, n.name]));

  const handleBook = async (e) => {
    e.preventDefault();
    if (pickup === dropoff) {
      alert('Pickup and dropoff destination cannot be the same station!');
      return;
    }

    if (soundEnabled) playSound('success');

    const isCrossOrRegional = !isPickupCampus || !isDropoffCampus;

    const result = await onAddRequest({
      pickup,
      dropoff,
      passengers: parseInt(passengers, 10),
      windowMin: isCrossOrRegional ? 20 : 10,
      maxDetourFactor: rideType === 'pool' ? 1.5 : 1.0,
      riderName: currentUser?.name || 'Aarav Sharma',
      studentId: currentUser?.id || 'GU24-CSE-1042',
      region: isCrossOrRegional ? 'haryana' : 'campus'
    });

    if (result?.requestId) {
      setActiveRideId(result.requestId);
      if (onRidePlaced) onRidePlaced(result.requestId);
    }
  };

  const swapStations = () => {
    if (soundEnabled) playSound('click');
    const temp = pickup;
    setPickup(dropoff);
    setDropoff(temp);
  };

  const setRoutePreset = (preset) => {
    if (soundEnabled) playSound('click');
    if (preset === 'campus_to_outside') {
      setPickup(campusNodes[0]?.id || 'N01');
      setDropoff(haryanaNodes[0]?.id || 'H01');
    } else if (preset === 'outside_to_campus') {
      setPickup(haryanaNodes[0]?.id || 'H01');
      setDropoff(campusNodes[6]?.id || 'N07');
    } else if (preset === 'inside_campus') {
      setPickup(campusNodes[6]?.id || 'N07');
      setDropoff(campusNodes[11]?.id || 'N16');
    } else if (preset === 'outside_cities') {
      setPickup(haryanaNodes[0]?.id || 'H01');
      setDropoff(haryanaNodes[2]?.id || 'H03');
    }
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

      {/* 1. PENDING DRIVER APPROVAL CARD */}
      {activeRide && activeRide.status === 'pending_driver' && (
        <div className="p-4 bg-gradient-to-b from-amber-950/70 via-slate-900 to-amber-950/40 border-2 border-amber-500/60 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden animate-pulse">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/30 mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="font-extrabold text-xs tracking-wider text-amber-300 uppercase">
                AWAITING BUS DRIVER ACCEPTANCE
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              DISPATCHED
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Your booking request has been sent to active campus bus drivers. The ride will confirm as soon as the driver clicks <strong className="text-emerald-400">[Accept Ride]</strong> on the Bus Driver Terminal.
          </p>

          <div className="space-y-1.5 text-xs bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Pickup Station:</span>
              <span className="font-bold text-emerald-400">{nodeMap.get(activeRide.pickup) || activeRide.pickup}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Dropoff Destination:</span>
              <span className="font-bold text-orange-400">{nodeMap.get(activeRide.dropoff) || activeRide.dropoff}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
              <span className="text-slate-400">Service Route:</span>
              <span className="font-semibold text-sky-400">
                {!activeRide.pickup?.startsWith('H') && activeRide.dropoff?.startsWith('H') && '🏫 Campus ➔ 🏙️ Outside City'}
                {activeRide.pickup?.startsWith('H') && !activeRide.dropoff?.startsWith('H') && '🏙️ Outside City ➔ 🏫 Campus'}
                {!activeRide.pickup?.startsWith('H') && !activeRide.dropoff?.startsWith('H') && '🏫 Inside Campus Shuttle'}
                {activeRide.pickup?.startsWith('H') && activeRide.dropoff?.startsWith('H') && '🏙️ Outside Cities Inter-City'}
              </span>
            </div>
          </div>

          <button
            className="w-full py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/50 transition-colors flex items-center justify-center gap-1.5"
            onClick={() => {
              if (soundEnabled) playSound('alert');
              onCancelRequest(activeRide.id);
            }}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel Ride Request</span>
          </button>
        </div>
      )}

      {/* 2. REJECTED / DECLINED RIDE CARD */}
      {activeRide && activeRide.status === 'rejected' && (
        <div className="p-4 bg-rose-950/60 border-2 border-rose-600/70 rounded-2xl shadow-xl backdrop-blur-md space-y-2.5">
          <div className="flex items-center gap-2 text-rose-300 font-extrabold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Booking Unable to be Accommodated</span>
          </div>
          <p className="text-xs text-rose-200/90 leading-relaxed">
            {activeRide.rejectionReason || 'Driver unable to accept ride due to capacity or detour constraints.'}
          </p>
          <button
            className="w-full py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
            onClick={() => setActiveRideId(null)}
          >
            Dismiss & Try Another Station
          </button>
        </div>
      )}

      {/* 3. CONFIRMED ACTIVE RIDE / BOARDING PASS */}
      {activeRide && (activeRide.status === 'waiting' || activeRide.status === 'assigned' || activeRide.status === 'onboard') && (
        <div className="p-4 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-emerald-500/60 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span className="font-extrabold text-xs tracking-wider text-emerald-300 uppercase">
                {activeRide.status === 'onboard' ? '🚀 RIDE IN PROGRESS' : '🚐 BUS ASSIGNED & EN-ROUTE'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {activeRide.status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-2 mb-3 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-medium">Assigned Bus:</span>
              <span className="font-extrabold text-sky-400 text-sm">
                {activeRide.vehicleId ? `Bus ${activeRide.vehicleId}` : 'Dispatching...'}
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
              <span className="font-bold text-emerald-400">{nodeMap.get(activeRide.pickup) || activeRide.pickup}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-medium">Dropoff Destination:</span>
              <span className="font-bold text-orange-400">{nodeMap.get(activeRide.dropoff) || activeRide.dropoff}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-sky-950/40 border border-sky-800/40 text-[11px] text-sky-300 mb-3">
            <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400" />
            <span><strong>Detour Bound Active:</strong> Guaranteed max ride delay within 1.5x direct duration.</span>
          </div>

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
      )}

      {/* 4. BOOKING FORM CARD */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-orange-400 uppercase block">⚡ GU RAPIDO DISPATCH</span>
            <h3 className="font-extrabold text-sm text-white">Book a Ride</h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            Pool Enabled
          </span>
        </div>

        {/* 4 QUICK ROUTE DIRECTION PRESETS */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Quick Route Directions
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 border ${
                isPickupCampus && !isDropoffCampus
                  ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/25'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
              onClick={() => setRoutePreset('campus_to_outside')}
            >
              <span>🏫 Campus</span>
              <ArrowRight className="w-3 h-3 text-sky-300" />
              <span>🏙️ Outside</span>
            </button>

            <button
              type="button"
              className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 border ${
                !isPickupCampus && isDropoffCampus
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/25'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
              onClick={() => setRoutePreset('outside_to_campus')}
            >
              <span>🏙️ Outside</span>
              <ArrowRight className="w-3 h-3 text-emerald-300" />
              <span>🏫 Campus</span>
            </button>

            <button
              type="button"
              className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 border ${
                isPickupCampus && isDropoffCampus
                  ? 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/25'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
              onClick={() => setRoutePreset('inside_campus')}
            >
              <span>🏫 Inside Campus</span>
            </button>

            <button
              type="button"
              className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 border ${
                !isPickupCampus && !isDropoffCampus
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/25'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
              onClick={() => setRoutePreset('outside_cities')}
            >
              <span>🏙️ Outside Cities</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleBook} className="space-y-3">
          {/* Pickup Station (Supports BOTH Campus & Outside Cities) */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                PICKUP STATION
              </span>
              <span className="text-[10px] text-slate-500">
                {isPickupCampus ? '🏫 Inside Campus' : '🏙️ Outside City'}
              </span>
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
              value={pickup}
              onChange={e => setPickup(e.target.value)}
            >
              <optgroup label="🏫 Inside Campus Stations">
                {campusNodes.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </optgroup>
              <optgroup label="🏙️ Outside Haryana Cities">
                {haryanaNodes.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </optgroup>
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

          {/* Dropoff Destination (Supports BOTH Campus & Outside Cities) */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                DROPOFF DESTINATION
              </span>
              <span className="text-[10px] text-slate-500">
                {isDropoffCampus ? '🏫 Inside Campus' : '🏙️ Outside City'}
              </span>
            </label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
              value={dropoff}
              onChange={e => setDropoff(e.target.value)}
            >
              <optgroup label="🏫 Inside Campus Stations">
                {campusNodes.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </optgroup>
              <optgroup label="🏙️ Outside Haryana Cities">
                {haryanaNodes.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Dynamic Route Category Pill */}
          <div className={`p-2 rounded-xl border text-xs font-extrabold flex items-center justify-between ${routeBadgeBg}`}>
            <span>{routeCategoryLabel}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider">Direct & Pooled</span>
          </div>

          {/* Ride Mode Selector (Shared Pool vs Solo Direct) */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
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
                <span className="text-[10px] text-orange-400 font-extrabold">{poolPoints}</span>
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
                <span className="text-[10px] text-sky-400 font-extrabold">{soloPoints}</span>
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
            <span>Confirm & Request Ride</span>
          </button>
        </form>
      </div>
    </div>
  );
}
