import React, { useState } from 'react';

export default function AdminPortal({
  simState,
  onBreakVehicle,
  onToggleRoad,
  onReset,
  onTriggerBurst,
  onCancelRequest,
  onAddCustomRequest,
  onUpdateConfig,
  currentConfig = {}
}) {
  const [activeTab, setActiveTab] = useState('operations');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Config state
  const [detourFactor, setDetourFactor] = useState(currentConfig.maxDetourFactor || 1.5);
  const [windowMin, setWindowMin] = useState(currentConfig.windowMin || 10);
  const [batchingSec, setBatchingSec] = useState(currentConfig.batchingSec || 10);

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
      r.dropoff.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-portal-container">
      {/* Admin Top Dashboard Bar */}
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge">GU Transport Operations Command Center</div>
          <h2>Fleet Command & Dispatch Administration</h2>
          <p>Panipat – Rohtak Highway Campus, Naultha | Algorithmic Ride-Pooling Orchestrator</p>
        </div>
        <div className="admin-stats-summary">
          <div className="admin-stat-card">
            <span className="stat-num">{vehicles.filter(v => v.status !== 'broken').length}/{vehicles.length}</span>
            <span className="stat-label">Active Shuttles</span>
          </div>
          <div className="admin-stat-card">
            <span className="stat-num">{totalOccupied}/{totalSeats}</span>
            <span className="stat-label">Live Occupancy</span>
          </div>
          <div className="admin-stat-card">
            <span className="stat-num">{edges.filter(e => e.closed).length}</span>
            <span className="stat-label">Road Closures</span>
          </div>
          <div className="admin-stat-card">
            <span className="stat-num">{metrics.servedPct || 0}%</span>
            <span className="stat-label">Service Compliance</span>
          </div>
        </div>
      </div>

      {/* 7 Required Admin Navigation Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab-btn ${activeTab === 'operations' ? 'active' : ''}`} onClick={() => setActiveTab('operations')}>
          📊 1. Live Operations
        </button>
        <button className={`admin-tab-btn ${activeTab === 'fleet' ? 'active' : ''}`} onClick={() => setActiveTab('fleet')}>
          🚐 2. Fleet Management
        </button>
        <button className={`admin-tab-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
          📋 3. Requests Manifest
        </button>
        <button className={`admin-tab-btn ${activeTab === 'disruptions' ? 'active' : ''}`} onClick={() => setActiveTab('disruptions')}>
          🚧 4. Disruption Controls
        </button>
        <button className={`admin-tab-btn ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>
          ⚙️ 5. Configuration
        </button>
        <button className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          📈 6. Analytics & Comparison
        </button>
        <button className={`admin-tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
          🛡️ 7. Audit Log
        </button>
      </div>

      {/* TAB 1: Live Operations */}
      {activeTab === 'operations' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
          <div className="admin-section-box">
            <h3 style={{ color: '#012e55', fontSize: '1rem', fontWeight: 800, marginBottom: '0.65rem' }}>Active Trip Manifests</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {vehicles.map(v => (
                <div key={v.id} style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <strong>{v.id} - Shuttle</strong>
                    <span className={`status-pill ${v.status}`}>{v.status.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Load: <b>{v.occupancy}/{v.capacity}</b> • Location: <b>{v.currentNode}</b> • Route Stops: <b>{v.stops.length}</b>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section-box">
            <h3 style={{ color: '#012e55', fontSize: '1rem', fontWeight: 800, marginBottom: '0.65rem' }}>Unmet Demand & Near-Misses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
              {requests.filter(r => r.status === 'rejected').length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#10b981', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.8rem' }}>
                  🎉 No unmet demand. All campus requests accepted!
                </div>
              ) : (
                requests.filter(r => r.status === 'rejected').map(r => (
                  <div key={r.id} style={{ padding: '0.65rem', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#9f1239' }}>
                      <span>{r.id}: {r.pickup} ➔ {r.dropoff}</span>
                      <span className="status-pill rejected">{r.code || 'REJECTED'}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#881337', marginTop: '3px' }}>
                      <b>Reason:</b> {r.rejectionReason}
                    </div>
                    {r.bestNearMiss && (
                      <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '3px', background: '#fff', padding: '3px 6px', borderRadius: '4px' }}>
                        <b>Near-miss trace:</b> {r.bestNearMiss}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Fleet Management */}
      {activeTab === 'fleet' && (
        <div className="admin-grid">
          {vehicles.map(v => (
            <div key={v.id} className={`admin-vehicle-card ${v.status}`}>
              <div className="v-card-top">
                <div className="v-id-name">
                  <span className="v-color-tag" style={{ background: v.color }}></span>
                  <span className="v-title">{v.id} - Campus Express</span>
                </div>
                <span className={`status-pill ${v.status}`}>{v.status.toUpperCase()}</span>
              </div>
              <div className="v-card-body">
                <div className="v-metric-row"><span>Current Station:</span><strong>{v.currentNode}</strong></div>
                <div className="v-metric-row"><span>Target Station:</span><strong>{v.targetNode || 'At Station'}</strong></div>
                <div className="v-metric-row"><span>Live Capacity:</span><strong>{v.occupancy} / {v.capacity} seats</strong></div>
                <div className="v-metric-row"><span>Queued Stops:</span><strong>{v.stops.length} stops</strong></div>
                <div className="v-metric-row"><span>Onboard Students:</span><strong>{v.onboard.join(', ') || 'Empty'}</strong></div>
              </div>
              <div className="v-card-actions">
                {v.status !== 'broken' ? (
                  <button className="btn-danger btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onBreakVehicle(v.id)}>
                    ⚠️ Mark Out-of-Service / Breakdown
                  </button>
                ) : (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center', padding: '0.3rem' }}>
                    Vehicle Offline - Deboarded at {v.currentNode}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Requests Manifest */}
      {activeTab === 'requests' && (
        <div className="admin-section-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search request ID, station..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ maxWidth: '300px' }}
            />
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {['ALL', 'WAITING', 'ASSIGNED', 'ONBOARD', 'COMPLETED', 'REJECTED', 'CANCELLED'].map(st => (
                <button
                  key={st}
                  className={`btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="road-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Pickup ➔ Dropoff</th>
                  <th>Party Size</th>
                  <th>Assigned Vehicle</th>
                  <th>Status</th>
                  <th>Action / Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.id}</strong></td>
                    <td>{r.pickup} ➔ {r.dropoff}</td>
                    <td>👥 {r.passengers || 1}</td>
                    <td>{r.vehicleId ? <b>🚐 {r.vehicleId}</b> : 'Unassigned'}</td>
                    <td><span className={`status-pill ${r.status}`}>{r.status.toUpperCase()}</span></td>
                    <td>
                      {r.status === 'assigned' || r.status === 'waiting' ? (
                        <button className="btn-sm btn-danger" onClick={() => onCancelRequest(r.id)}>
                          Cancel
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {r.rejectionReason ? `Reason: ${r.code}` : `Completed at t=${r.completedAt}m`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Disruption Controls */}
      {activeTab === 'disruptions' && (
        <div className="admin-section-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ color: '#012e55', fontSize: '1.05rem', fontWeight: 800 }}>Live Road Closures & Obstructions</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Click any segment to immediately close it and trigger dynamic rerouting.</p>
            </div>
            <button className="btn-secondary btn-sm" onClick={() => onTriggerBurst()}>
              ⚡ Trigger Class Dismissal Burst (4 Rides)
            </button>
          </div>

          <div className="road-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Road ID</th>
                  <th>Connecting Stations</th>
                  <th>Travel Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {edges.map(e => (
                  <tr key={e.id} className={e.closed ? 'row-closed' : ''}>
                    <td><strong>{e.id}</strong></td>
                    <td>{e.from} ➔ {e.to}</td>
                    <td>{e.minutes} min</td>
                    <td><span className={`status-pill ${e.closed ? 'rejected' : 'completed'}`}>{e.closed ? '🔴 CLOSED' : '🟢 OPEN'}</span></td>
                    <td>
                      <button className={`btn-sm ${e.closed ? 'btn-primary' : 'btn-danger'}`} onClick={() => onToggleRoad(e)}>
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

      {/* TAB 5: Configuration */}
      {activeTab === 'config' && (
        <div className="admin-section-box" style={{ maxWidth: '600px' }}>
          <h3 style={{ color: '#012e55', fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem' }}>Dispatch & Heuristic Parameters</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Max Detour Factor (directTime × Factor)</label>
              <input type="number" step="0.1" className="form-input" value={detourFactor} onChange={e => setDetourFactor(parseFloat(e.target.value))} />
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Current: {detourFactor}x direct route duration</span>
            </div>

            <div className="form-group">
              <label className="form-label">Default Pickup Window (Minutes)</label>
              <input type="number" className="form-input" value={windowMin} onChange={e => setWindowMin(parseInt(e.target.value, 10))} />
            </div>

            <div className="form-group">
              <label className="form-label">Periodic Batching Interval (Simulated Seconds)</label>
              <input type="number" className="form-input" value={batchingSec} onChange={e => setBatchingSec(parseInt(e.target.value, 10))} />
            </div>

            <button
              className="btn-primary"
              style={{ padding: '0.65rem', justifyContent: 'center' }}
              onClick={() => {
                if (onUpdateConfig) onUpdateConfig({ maxDetourFactor: detourFactor, windowMin, batchingSec });
                alert('Configuration applied! Dispatch heuristic updated.');
              }}
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: Analytics & Comparison */}
      {activeTab === 'analytics' && (
        <div className="admin-section-box">
          <h3 style={{ color: '#012e55', fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.8rem' }}>Live Travel Outcomes vs Solo Baseline</h3>
          <div className="modal-kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">Fleet Distance (Minutes)</div>
              <div className="kpi-values"><span className="kpi-val pool">{metrics.totalDistanceMin}m</span></div>
              <div className="kpi-sub">Total vehicle run-time</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Average Waiting Time</div>
              <div className="kpi-values"><span className="kpi-val pool">{metrics.avgWaitMin}m</span></div>
              <div className="kpi-sub">From request to pickup</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Service Compliance Rate</div>
              <div className="kpi-values"><span className="kpi-val pool">{metrics.servedPct}%</span></div>
              <div className="kpi-sub">Zero silent drops</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Average Seat Utilization</div>
              <div className="kpi-values"><span className="kpi-val pool">{metrics.avgOccupancy}/4</span></div>
              <div className="kpi-sub">Shuttle capacity factor</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: Audit Log */}
      {activeTab === 'audit' && (
        <div className="admin-section-box">
          <h3 style={{ color: '#012e55', fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.8rem' }}>Telemetry Audit Trail</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '450px', overflowY: 'auto' }}>
            {events.map((ev, idx) => (
              <div key={idx} className={`event-entry ${ev.type || 'info'}`} style={{ padding: '0.6rem 0.85rem' }}>
                <span className="event-time">t={ev.time}m</span>
                <span style={{ fontWeight: 700, marginRight: '0.5rem', textTransform: 'uppercase', color: '#012e55' }}>[{ev.type}]:</span>
                <span>{ev.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
