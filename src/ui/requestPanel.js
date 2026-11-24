/**
 * /src/ui/requestPanel.js
 * Renders the live request log, status chips, cancellation buttons,
 * and structured per-vehicle rejection reason accordions.
 * Pure function of sim.getState().requests.
 */

export class RequestPanel {
  constructor(containerId = 'request-list-container', options = {}) {
    this.container = document.getElementById(containerId);
    this.onCancel = options.onCancel || (() => {});
    this.currentFilter = 'all';
    this.expandedRejections = new Set(); // set of requestIds currently expanded
  }

  setFilter(filter) {
    this.currentFilter = filter;
  }

  toggleRejection(requestId) {
    if (this.expandedRejections.has(requestId)) {
      this.expandedRejections.delete(requestId);
    } else {
      this.expandedRejections.add(requestId);
    }
  }

  render(requests = [], nodes = []) {
    if (!this.container) return;

    const nodeMap = new Map(nodes.map(n => [n.id, n.name]));

    // Filter requests
    const filtered = requests.filter(req => {
      if (this.currentFilter === 'all') return true;
      return req.status === this.currentFilter;
    });

    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div style="text-align: center; color: var(--text-dim); padding: 2rem 1rem; font-size: 0.85rem;">
          No requests in "${this.currentFilter.toUpperCase()}" status
        </div>
      `;
      return;
    }

    // Render in reverse chronological order (newest first)
    const reversed = [...filtered].reverse();

    this.container.innerHTML = reversed.map(req => {
      const pName = nodeMap.get(req.pickup) || req.pickup;
      const dName = nodeMap.get(req.dropoff) || req.dropoff;
      const isRejected = req.status === 'rejected';
      const isCancellable = req.status === 'waiting' || req.status === 'assigned';
      const isExpanded = this.expandedRejections.has(req.id) || isRejected; // Default open for rejected to ensure transparency!

      // Reasons list
      const reasonsList = req.reasons || [];
      const primaryReason = req.rejectionReason || (reasonsList[0]?.message ?? 'Constraints exceeded');

      const reasonsHtml = isRejected ? `
        <div class="rejection-accordion">
          <div class="rejection-primary" onclick="window.app.toggleRejection('${req.id}')">
            <span>⚠️</span>
            <span><strong>Primary Reason:</strong> ${primaryReason}</span>
            <span class="rejection-toggle-hint">${isExpanded ? '▲ Hide breakdown' : '▼ View per-vehicle breakdown'}</span>
          </div>
          ${isExpanded ? `
            <div class="rejection-details">
              <div style="font-weight: 600; color: #fca5a5; margin-bottom: 2px;">Evaluated Vehicle Constraints:</div>
              ${reasonsList.length > 0 ? reasonsList.map(r => `
                <div class="reason-item">
                  <span class="reason-badge">${r.type || 'constraint'}</span>
                  <span><strong>${r.vehicleId ? r.vehicleId + ': ' : ''}</strong>${r.message}</span>
                </div>
              `).join('') : '<div style="color: var(--text-dim);">No detailed vehicle traces recorded</div>'}
            </div>
          ` : ''}
        </div>
      ` : '';

      return `
        <div class="request-card ${req.status}">
          <div class="req-header">
            <span class="req-id">${req.id}</span>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="status-chip ${req.status}">${req.status}</span>
              ${isCancellable ? `
                <button class="btn-sm btn-danger" style="padding: 0.15rem 0.45rem; font-size: 0.68rem;" onclick="window.app.cancelRequest('${req.id}')">
                  Cancel
                </button>
              ` : ''}
            </div>
          </div>
          
          <div class="req-route">
            <strong>${pName}</strong>
            <span class="req-route-arrow">➔</span>
            <strong>${dName}</strong>
          </div>

          <div class="req-meta">
            <span>Pass: <strong>${req.passengers || 1}</strong> | At: t=<strong>${req.createdAt ?? '--'}m</strong></span>
            ${req.vehicleId ? `<span>Vehicle: <strong style="color: var(--accent-cyan);">${req.vehicleId}</strong></span>` : ''}
            ${req.promisedLatestDropoff ? `<span>Promised By: <strong>t=${req.promisedLatestDropoff}m</strong></span>` : ''}
          </div>

          ${reasonsHtml}
        </div>
      `;
    }).join('');
  }
}
