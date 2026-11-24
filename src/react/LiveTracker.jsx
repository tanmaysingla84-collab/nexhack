import React, { useState } from 'react';

export default function LiveTracker({ vehicles = [], nodes = [], onSelectVehicle, selectedVehicleId }) {
  const nodeMap = new Map(nodes.map(n => [n.id, n.name]));

  return (
    <div className="live-tracker-panel">
      <div className="tracker-header">
        <div>
          <span className="live-pulse"></span>
          <span className="tracker-title">Live GU Shuttle GPS Tracker</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Real-time telemetry</span>
      </div>

      <div className="tracker-vehicle-list">
        {vehicles.map(v => {
          const isSelected = selectedVehicleId === v.id;
          const isBroken = v.status === 'broken';
          const nodeName = nodeMap.get(v.currentNode) || v.currentNode;
          const targetName = v.targetNode ? (nodeMap.get(v.targetNode) || v.targetNode) : null;

          return (
            <div
              key={v.id}
              className={`tracker-card ${isSelected ? 'selected' : ''} ${isBroken ? 'broken' : ''}`}
              onClick={() => onSelectVehicle(isSelected ? null : v.id)}
            >
              <div className="tracker-card-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="v-indicator" style={{ background: isBroken ? '#ef4444' : v.color }}></span>
                  <strong>Shuttle {v.id}</strong>
                </div>
                <span className={`status-pill ${v.status}`}>
                  {isBroken ? 'OFFLINE' : v.status.toUpperCase()}
                </span>
              </div>

              <div className="tracker-card-coords">
                <div>📍 <b>Location:</b> {nodeName}</div>
                {targetName && <div>➔ <b>Heading to:</b> {targetName}</div>}
              </div>

              <div className="tracker-seat-bar-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '2px' }}>
                  <span>Occupancy</span>
                  <span><b>{v.occupancy}/{v.capacity} seats</b></span>
                </div>
                <div className="seat-progress-bar">
                  <div
                    className="seat-progress-fill"
                    style={{
                      width: `${Math.min(100, (v.occupancy / v.capacity) * 100)}%`,
                      background: v.occupancy >= v.capacity ? '#ef4444' : (v.color || '#e16b1f')
                    }}
                  />
                </div>
              </div>

              <div className="tracker-meta">
                <span>🛣️ Stops: {v.stops.length}</span>
                <span>🎓 Onboard: {v.onboard.length}</span>
                <span style={{ color: isSelected ? '#e16b1f' : '#64748b', fontWeight: 600 }}>
                  {isSelected ? '🎯 Tracking Live' : 'Click to Focus'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
