import React, { useState } from 'react';

export default function ManifestModal({ vehicle, onClose }) {
  if (!vehicle) return null;

  return (
    <div className="modal-backdrop active" style={{ zIndex: 2500 }}>
      <div className="modal-window" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🚐</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                Shuttle {vehicle.id} Passenger Manifest
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                Status: <span style={{ textTransform: 'uppercase', color: vehicle.status === 'broken' ? '#ef4444' : '#34d399', fontWeight: 700 }}>{vehicle.status}</span> • Seat Load: {vehicle.occupancy}/{vehicle.capacity}
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {/* Active Onboard Students */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#012e55', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>👥 Students Onboard ({vehicle.onboard.length})</span>
              <span style={{ color: '#e16b1f' }}>Live In-Transit</span>
            </div>

            {vehicle.onboard.length === 0 ? (
              <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
                No students currently onboard. Shuttle is en-route to next pickup.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {vehicle.onboard.map((reqId, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: '#012e55', fontSize: '0.82rem' }}>🎓 Rider {reqId}</span>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Journey active • Detour protected</div>
                    </div>
                    <span className="status-pill onboard">ONBOARD</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Planned Next Stops Manifest */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#012e55', marginBottom: '0.5rem' }}>
              📍 Next Ordered Route Stops ({vehicle.stops.length})
            </div>

            {vehicle.stops.length === 0 ? (
              <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
                Stationary at {vehicle.currentNode}. Awaiting dispatch assignments.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {vehicle.stops.map((stop, index) => {
                  const isPickup = stop.type === 'pickup';
                  return (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className={`stop-badge ${isPickup ? 'pickup' : 'dropoff'}`}>
                          {index + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#012e55' }}>
                            {stop.node}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            {isPickup ? '🟢 PICKUP' : '🏁 DROPOFF'} • Rider {stop.requestId}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e16b1f', fontFamily: 'monospace' }}>
                          ETA: t={stop.plannedArrival}m
                        </span>
                      </div>
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
