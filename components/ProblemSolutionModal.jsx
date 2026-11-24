'use client';

import React from 'react';
import { BookOpen, X, CheckCircle, ShieldCheck, Zap, AlertTriangle, Eye, BarChart3, Navigation } from 'lucide-react';

export default function ProblemSolutionModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop active">
      <div className="modal-window max-w-3xl">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-extrabold text-sm md:text-base text-white">
                Dynamic Campus Ride Pooling — Solution & Challenge Guide
              </h3>
              <p className="text-[11px] text-slate-400">NexHack 2.0 • Autonomous Dispatch Architecture</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Solution Mapping Grid (7 Challenges) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-extrabold text-xs text-orange-400">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-[11px]">1</span>
                <span>Match Requests Dynamically</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Evaluates every insertion permutation across active shuttles with lowest marginal cost (&Delta;dist + 0.5 &times; &Delta;wait). Groups concurrent class-break riders into shared trips within capacity and promised pickup windows.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-extrabold text-xs text-sky-400">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center text-[11px]">2</span>
                <span>Protect Existing Commitments</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Mathematical invariant: for every onboard and queued rider, rideTime &le; directTime &times; 1.5. Onboard passengers are never dropped or delayed past their detour bound.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-extrabold text-xs text-emerald-400">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">3</span>
                <span>Respond to Disruptions Live</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <b>Cancellations:</b> Stops pruned instantly and route shrinks.<br/>
                <b>Breakdowns:</b> Deboards onboard riders safely at station; re-dispatches unpicked rides.<br/>
                <b>Road Closures:</b> Real-time Dijkstra graph recalculation & alternate route dispatch.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-extrabold text-xs text-rose-400">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-[11px]">4</span>
                <span>Explain Unmet Demand (Zero Silent Drops)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Standardized error codes (<code>CAPACITY_EXCEEDED</code>, <code>PICKUP_WINDOW_INFEASIBLE</code>, <code>DETOUR_LIMIT_BREACH</code>, <code>NO_ROUTE_AVAILABLE</code>) plus nearest near-miss delta recording for rider transparency.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-extrabold text-xs text-purple-400">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[11px]">5</span>
                <span>Visualize the Service</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Interactive Leaflet map with dark-matter and OSM tiles, live shuttle markers with seat occupancy badges (<code>3/4</code>), glowing route trails, numbered pickup/dropoff pins, and vehicle manifests.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-extrabold text-xs text-amber-400">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">6</span>
                <span>Compare Travel Outcomes</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Headless evaluator comparing Dynamic Pooling vs Solo rides under identical seeded demand for distance traveled, average wait, $p95$ wait, missed pickups, and seat utilization.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 md:col-span-2">
              <div className="flex items-center gap-2 font-extrabold text-xs text-teal-400">
                <span className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-[11px]">7</span>
                <span>Demonstrate Active Disruptions (Cancellation & Road Closure)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                1-click interactive demonstration: actively cancels waiting student rides to illustrate route contraction, and closes active campus road segments to display live Dijkstra rerouting while shuttles are moving.
              </p>
            </div>
          </div>

          {/* Expected Impact Callout */}
          <div className="p-3.5 bg-orange-500/10 border border-orange-500/20 rounded-xl space-y-1">
            <h4 className="font-extrabold text-xs text-orange-400">🎯 Expected Campus Impact & Operational Value</h4>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
              <li><strong>Efficiency:</strong> Maximize shuttle capacity utilization during surge dismissals, lowering total fuel and campus emissions.</li>
              <li><strong>Transparency:</strong> Provide dispatchers and riders clear explanations instead of dropping unserved bookings silently.</li>
              <li><strong>Fairness:</strong> Strict mathematical detour bounds prevent early onboard passengers from being delayed indefinitely for new bookings.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
