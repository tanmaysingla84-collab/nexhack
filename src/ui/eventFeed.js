/**
 * /src/ui/eventFeed.js
 * Live append-only event stream rendering from sim.getEvents().
 */

export class EventFeed {
  constructor(containerId = 'event-feed-container') {
    this.container = document.getElementById(containerId);
    this.lastRenderedCount = 0;
  }

  render(events = []) {
    if (!this.container) return;

    if (events.length === 0) {
      this.container.innerHTML = `
        <div style="text-align: center; color: var(--text-dim); padding: 2rem 1rem; font-size: 0.85rem;">
          No events recorded yet. Start the simulation or dispatch a ride.
        </div>
      `;
      return;
    }

    // Render in reverse chronological order
    const reversed = [...events].reverse();

    this.container.innerHTML = reversed.map(ev => {
      const typeClass = ev.type || 'info';
      return `
        <div class="event-entry ${typeClass}">
          <span class="event-time">t=${ev.time}m</span>
          <span class="event-msg">${ev.message}</span>
        </div>
      `;
    }).join('');
  }
}
