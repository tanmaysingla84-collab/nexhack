import React from 'react';

export default function EventFeed({ events = [] }) {
  if (events.length === 0) {
    return (
      <div className="tab-content active">
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem 1rem', fontSize: '0.85rem' }}>
          No events recorded yet. Start the simulation or dispatch a ride.
        </div>
      </div>
    );
  }

  const reversed = [...events].reverse();

  return (
    <div className="tab-content active" style={{ height: '100%' }}>
      <div className="event-feed-list">
        {reversed.map((ev, index) => {
          const typeClass = ev.type || 'info';
          return (
            <div key={index} className={`event-entry ${typeClass}`}>
              <span className="event-time">t={ev.time}m</span>
              <span className="event-msg">{ev.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
