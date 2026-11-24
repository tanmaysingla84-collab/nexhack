import React, { useState } from 'react';

export default function ProblemSolutionModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop active" style={{ zIndex: 3000 }}>
      <div className="modal-window" style={{ maxWidth: '820px', maxHeight: '88vh' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📘</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
                NexHack 2.0: Dynamic Campus Ride Pooling Solution
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                Problem Statement #10 • Algorithmic Formulation & Quality Assessment
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem', lineHeight: '1.6', fontSize: '0.85rem' }}>
          {/* Solution Mapping Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, color: '#012e55', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>1️⃣</span> Match Requests Dynamically
              </div>
              <p style={{ color: '#475569', fontSize: '0.8rem' }}>
                Employs greedy insertion with marginal cost minimization ($ \Delta \text{dist} + 0.5 \times \Delta \text{wait} $). Tests all stop index permutations across active shuttles to group concurrent class dismissal rides into shared trips.
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, color: '#012e55', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>2️⃣</span> Protect Existing Commitments
              </div>
              <p style={{ color: '#475569', fontSize: '0.8rem' }}>
                Rigorous mathematical invariant: for every onboard or assigned student, $ \text{rideTime} \le \text{directTime} \times 1.5 $. Onboard passengers are never dropped or subjected to detours past their bound.
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, color: '#012e55', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>3️⃣</span> Respond to Disruptions Live
              </div>
              <p style={{ color: '#475569', fontSize: '0.8rem' }}>
                <b>Cancellations:</b> Route polyline shrinks and remaining ETAs update.<br/>
                <b>Breakdowns:</b> Safe node deboarding + automatic re-dispatch of unpicked rides.<br/>
                <b>Road Closures:</b> Real-time Dijkstra graph recalculation & rerouting.
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, color: '#012e55', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>4️⃣</span> Explain Unmet Demand (Zero Silent Drops)
              </div>
              <p style={{ color: '#475569', fontSize: '0.8rem' }}>
                Explicit structured reason codes (<code>CAPACITY_EXCEEDED</code>, <code>PICKUP_WINDOW_INFEASIBLE</code>, <code>DETOUR_LIMIT_BREACH</code>, <code>NO_ROUTE_AVAILABLE</code>) plus nearest near-miss delta logging.
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, color: '#012e55', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>5️⃣</span> Visualize the Service
              </div>
              <p style={{ color: '#475569', fontSize: '0.8rem' }}>
                Interactive Leaflet map with OpenStreetMap tiles (no watermarks), moving vehicles with seat load badges (<code>2/4</code>), numbered stop pins, pulsing waiting riders, and passenger manifest modals.
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, color: '#012e55', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>6️⃣</span> Compare Travel Outcomes
              </div>
              <p style={{ color: '#475569', fontSize: '0.8rem' }}>
                Headless comparison engine evaluating Dynamic Pooling against Solo rides under identical seeded traffic for fleet distance, average wait, $p95$ wait, missed pickups, and seat utilization.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button className="btn-primary" style={{ padding: '0.65rem 1.75rem' }} onClick={onClose}>
              Got It, Continue to Campus Transit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
