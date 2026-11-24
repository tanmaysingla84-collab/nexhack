import React, { useState, useEffect } from 'react';

export default function RapidoRideCard({ nodes = [], onAddRequest, currentUser, onOpenLogin }) {
  const [pickup, setPickup] = useState('hostel_strip_south');
  const [dropoff, setDropoff] = useState('academic_block_central');
  const [rideType, setRideType] = useState('pool'); // 'pool' | 'solo'
  const [passengers, setPassengers] = useState(1);

  useEffect(() => {
    if (nodes && nodes.length > 0) {
      if (!nodes.some(n => n.id === pickup)) {
        setPickup(nodes.find(n => n.id.includes('hostel'))?.id || nodes[0].id);
      }
      if (!nodes.some(n => n.id === dropoff)) {
        setDropoff(nodes.find(n => n.id.includes('academic') || n.id.includes('gateway'))?.id || nodes[1]?.id || nodes[0].id);
      }
    }
  }, [nodes]);

  const handleBookRide = (e) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    if (pickup === dropoff) {
      alert('Pickup and dropoff stations cannot be the same!');
      return;
    }

    onAddRequest({
      pickup,
      dropoff,
      passengers: parseInt(passengers, 10),
      windowMin: 10,
      maxDetourMin: rideType === 'pool' ? 6 : 0,
      maxDetourFactor: rideType === 'pool' ? 1.5 : 1.0,
      riderName: currentUser.name,
      studentId: currentUser.id
    });
  };

  const getEstimateMin = () => {
    return rideType === 'pool' ? '3-5 min ETA' : '2 min ETA';
  };

  const getPointsCost = () => {
    return rideType === 'pool' ? '10 Credits' : '25 Credits';
  };

  return (
    <div className="rapido-ride-card">
      <div className="rapido-card-header">
        <div>
          <span className="rapido-tag">⚡ RAPIDO CAMPUS RIDE</span>
          <div className="rapido-title">Where do you want to go on campus?</div>
        </div>
        {currentUser ? (
          <div className="user-badge-mini" onClick={onOpenLogin}>
            <span>{currentUser.avatar}</span>
            <span>{currentUser.name.split(' ')[0]}</span>
          </div>
        ) : (
          <button className="btn-sm btn-primary" onClick={onOpenLogin}>
            Login to Book
          </button>
        )}
      </div>

      <form onSubmit={handleBookRide} className="rapido-ride-form">
        {/* Pickup selection */}
        <div className="rapido-input-group">
          <div className="loc-icon-dot green"></div>
          <div style={{ flex: 1 }}>
            <span className="rapido-input-label">PICKUP STATION</span>
            <select
              className="rapido-select"
              value={pickup}
              onChange={e => setPickup(e.target.value)}
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rapido-route-divider">
          <span className="divider-line"></span>
          <button
            type="button"
            className="swap-btn"
            title="Swap Pickup & Dropoff"
            onClick={() => {
              const temp = pickup;
              setPickup(dropoff);
              setDropoff(temp);
            }}
          >
            ⇅
          </button>
        </div>

        {/* Dropoff selection */}
        <div className="rapido-input-group">
          <div className="loc-icon-dot orange"></div>
          <div style={{ flex: 1 }}>
            <span className="rapido-input-label">DROPOFF DESTINATION</span>
            <select
              className="rapido-select"
              value={dropoff}
              onChange={e => setDropoff(e.target.value)}
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ride Option Selectors (Rapido Style) */}
        <div className="rapido-tier-selector">
          <div
            className={`rapido-tier-option ${rideType === 'pool' ? 'active' : ''}`}
            onClick={() => setRideType('pool')}
          >
            <div className="tier-top">
              <span className="tier-icon">🚐</span>
              <span className="tier-badge-save">SAVE 50%</span>
            </div>
            <div className="tier-name">GU Shared Pool</div>
            <div className="tier-sub">{getEstimateMin()} • High Frequency</div>
            <div className="tier-price">10 pts / seat</div>
          </div>

          <div
            className={`rapido-tier-option ${rideType === 'solo' ? 'active' : ''}`}
            onClick={() => setRideType('solo')}
          >
            <div className="tier-top">
              <span className="tier-icon">⚡</span>
              <span className="tier-badge-fast">EXPRESS</span>
            </div>
            <div className="tier-name">Direct Priority</div>
            <div className="tier-sub">Direct Non-Stop • 0 Detour</div>
            <div className="tier-price">25 pts / seat</div>
          </div>
        </div>

        {/* Passenger count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.65rem 0' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b637b' }}>Seats Needed:</span>
          <div className="passenger-pill-selector">
            {[1, 2, 3, 4].map(p => (
              <button
                key={p}
                type="button"
                className={`pass-pill ${passengers === p ? 'active' : ''}`}
                onClick={() => setPassengers(p)}
              >
                {p} {p === 1 ? 'Seat' : 'Seats'}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary rapido-book-btn"
        >
          {currentUser ? `Book ${rideType === 'pool' ? 'Pooled Ride' : 'Express Ride'} (🪙 ${getPointsCost()})` : '🔑 Login with GU ID to Book Ride'}
        </button>
      </form>
    </div>
  );
}
