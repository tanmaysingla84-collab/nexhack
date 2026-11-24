import React, { useState } from 'react';

export default function RequestPanel({ requests = [], nodes = [], onCancel }) {
  const [currentFilter, setCurrentFilter] = useState('all');
  const [expandedRejections, setExpandedRejections] = useState(new Set());

  const nodeMap = new Map(nodes.map(n => [n.id, n.name]));

  const toggleRejection = (requestId) => {
    setExpandedRejections(prev => {
      const next = new Set(prev);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }
      return next;
    });
  };

  const filtered = requests.filter(req => {
    if (currentFilter === 'all') return true;
    return req.status === currentFilter;
  });

  const reversed = [...filtered].reverse();

  return (
    <div className="tab-content active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filter Chips */}
      <div className="request-filters">
        {['all', 'waiting', 'assigned', 'onboard', 'completed', 'rejected', 'cancelled'].map(f => (
          <button
            key={f}
            className={`filter-chip ${currentFilter === f ? 'active' : ''}`}
            onClick={() => setCurrentFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="request-list">
        {reversed.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem 1rem', fontSize: '0.85rem' }}>
            No requests in "{currentFilter.toUpperCase()}" status
          </div>
        ) : (
          reversed.map(req => {
            const pName = nodeMap.get(req.pickup) || req.pickup;
            const dName = nodeMap.get(req.dropoff) || req.dropoff;
            const isRejected = req.status === 'rejected';
            const isCancellable = req.status === 'waiting' || req.status === 'assigned';
            const isExpanded = expandedRejections.has(req.id) || isRejected;

            const reasonsList = req.reasons || [];
            const primaryReason = req.rejectionReason || (reasonsList[0]?.message ?? 'Constraints exceeded');

            return (
              <div key={req.id} className={`request-card ${req.status}`}>
                <div className="req-header">
                  <span className="req-id">{req.id}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`status-chip ${req.status}`}>{req.status}</span>
                    {isCancellable && (
                      <button
                        className="btn-sm btn-danger"
                        style={{ padding: '0.15rem 0.45rem', fontSize: '0.68rem' }}
                        onClick={() => onCancel(req.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="req-route">
                  <strong>{pName}</strong>
                  <span className="req-route-arrow">➔</span>
                  <strong>{dName}</strong>
                </div>

                <div className="req-meta">
                  <span>👥 {req.passengers || 1} seat</span>
                  <span>⏱ req: t={req.createdAt}m</span>
                  {req.vehicleId && <span>🚐 {req.vehicleId}</span>}
                  {req.pickedUpAt !== null && <span>🛄 pickup: t={req.pickedUpAt}m</span>}
                  {req.completedAt !== null && <span>🏁 drop: t={req.completedAt}m</span>}
                </div>

                {isRejected && (
                  <div className="rejection-accordion">
                    <div className="rejection-primary" onClick={() => toggleRejection(req.id)}>
                      <span>⚠️</span>
                      <span><strong>Primary Reason:</strong> {primaryReason}</span>
                      <span className="rejection-toggle-hint">
                        {isExpanded ? '▲ Hide breakdown' : '▼ View per-vehicle breakdown'}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="rejection-details">
                        <div style={{ fontWeight: 600, color: '#fca5a5', marginBottom: '2px' }}>
                          Evaluated Vehicle Constraints:
                        </div>
                        {reasonsList.length > 0 ? (
                          reasonsList.map((r, idx) => (
                            <div key={idx} className="reason-item">
                              <span className="reason-badge">{r.type || 'constraint'}</span>
                              <span>
                                <strong>{r.vehicleId ? r.vehicleId + ': ' : ''}</strong>
                                {r.message}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div style={{ color: 'var(--text-dim)' }}>No detailed vehicle traces recorded</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
