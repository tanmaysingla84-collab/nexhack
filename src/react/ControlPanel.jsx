import React, { useState, useEffect } from 'react';

export default function ControlPanel({
  nodes = [],
  edges = [],
  vehicles = [],
  onAddRequest,
  onBreakVehicle,
  onToggleRoad,
  onClassBurst,
  onReset
}) {
  const [pickup, setPickup] = useState('hostel_strip_south');
  const [dropoff, setDropoff] = useState('academic_block_central');
  const [passengers, setPassengers] = useState(1);
  const [windowMin, setWindowMin] = useState(10);
  const [detourMin, setDetourMin] = useState(6);
  const [detourFactor, setDetourFactor] = useState(1.5);

  const [selectedEdge, setSelectedEdge] = useState('e1');
  const [selectedVehicle, setSelectedVehicle] = useState('V1');
  const [seed, setSeed] = useState(42);

  useEffect(() => {
    if (nodes && nodes.length > 0) {
      if (!nodes.some(n => n.id === pickup)) setPickup(nodes[0].id);
      if (!nodes.some(n => n.id === dropoff)) setDropoff(nodes[1]?.id || nodes[0].id);
    }
  }, [nodes]);

  useEffect(() => {
    if (edges && edges.length > 0 && !edges.some(e => e.id === selectedEdge)) {
      setSelectedEdge(edges[0].id);
    }
  }, [edges]);

  useEffect(() => {
    if (vehicles && vehicles.length > 0 && !vehicles.some(v => v.id === selectedVehicle)) {
      setSelectedVehicle(vehicles[0].id);
    }
  }, [vehicles]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pickup === dropoff) {
      alert('Pickup and dropoff destination cannot be the same node.');
      return;
    }
    onAddRequest({
      pickup,
      dropoff,
      passengers: parseInt(passengers, 10),
      windowMin: parseFloat(windowMin),
      maxDetourMin: parseFloat(detourMin),
      maxDetourFactor: parseFloat(detourFactor)
    });
  };

  const handlePreset = (p, d, pass = 1) => {
    onAddRequest({
      pickup: p,
      dropoff: d,
      passengers: pass,
      windowMin: 10,
      maxDetourMin: 6,
      maxDetourFactor: 1.5
    });
  };

  return (
    <div className="tab-content active">
      {/* Add Request Section */}
      <div className="control-section">
        <div className="section-heading">
          <span>➕</span>
          <span>Add Ride Request</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Pickup Location</label>
              <select className="form-select" value={pickup} onChange={e => setPickup(e.target.value)}>
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Dropoff Destination</label>
              <select className="form-select" value={dropoff} onChange={e => setDropoff(e.target.value)}>
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Passengers</label>
              <select className="form-select" value={passengers} onChange={e => setPassengers(e.target.value)}>
                <option value="1">1 Seat</option>
                <option value="2">2 Seats</option>
                <option value="3">3 Seats</option>
                <option value="4">4 Seats</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pickup Window (Min)</label>
              <input
                type="number"
                className="form-input"
                value={windowMin}
                min="2"
                max="30"
                onChange={e => setWindowMin(e.target.value)}
              />
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Max Allowed Detour (Min)</label>
              <input
                type="number"
                className="form-input"
                value={detourMin}
                min="1"
                max="25"
                onChange={e => setDetourMin(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              Dispatch Request
            </button>
          </div>
        </form>

        <div style={{ marginTop: '0.85rem' }}>
          <span className="form-label">Quick Test Presets:</span>
          <div className="preset-buttons">
            <button className="btn-preset" onClick={() => handlePreset('hostel_a', 'tech_tower', 1)}>
              Rahul: Hostel A ➔ CS Tower
            </button>
            <button className="btn-preset" onClick={() => handlePreset('library', 'hostel_b', 1)}>
              Priya: Library ➔ Hostel B
            </button>
            <button className="btn-preset" onClick={() => handlePreset('canteen_central', 'sports_complex', 2)}>
              Duo: Canteen ➔ Gym (2 seats)
            </button>
            <button className="btn-preset" onClick={() => handlePreset('north_gate', 'south_gate', 4)}>
              Overcapacity: 4 Passengers
            </button>
          </div>
        </div>
      </div>

      {/* Demand Spikes Section */}
      <div className="control-section">
        <div className="section-heading">
          <span>⚡</span>
          <span>Demand Burst & Scenarios</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
          Simulates simultaneous class dismissal (e.g., lecture hall emptying). Fires 4 pooled requests across campus.
        </p>
        <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onClassBurst}>
          Trigger "Classes End" Burst (4 Rides)
        </button>
      </div>

      {/* Disruptions: Road Closures & Breakdown */}
      <div className="control-section">
        <div className="section-heading">
          <span>🚧</span>
          <span>Live Campus Disruptions</span>
        </div>

        {/* Road Closures */}
        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
          <label className="form-label">Toggle Road Closure</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              className="form-select"
              value={selectedEdge}
              onChange={e => setSelectedEdge(e.target.value)}
              style={{ flex: 1 }}
            >
              {edges.map(e => (
                <option key={e.id} value={e.id}>
                  {e.from} ➔ {e.to} ({e.minutes}m) {e.closed ? '🔴 [CLOSED]' : '🟢 [OPEN]'}
                </option>
              ))}
            </select>
            <button
              className="btn-danger btn-sm"
              onClick={() => {
                const ed = edges.find(e => e.id === selectedEdge);
                if (ed) onToggleRoad(ed);
              }}
            >
              Toggle
            </button>
          </div>
        </div>

        {/* Breakdown */}
        <div className="form-group">
          <label className="form-label">Simulate Shuttle Breakdown</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              className="form-select"
              value={selectedVehicle}
              onChange={e => setSelectedVehicle(e.target.value)}
              style={{ flex: 1 }}
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.id} ({v.status.toUpperCase()} - {v.occupancy}/{v.capacity} seats)
                </option>
              ))}
            </select>
            <button
              className="btn-danger btn-sm"
              onClick={() => onBreakVehicle(selectedVehicle)}
            >
              Break Vehicle
            </button>
          </div>
        </div>
      </div>

      {/* Seed & Reset */}
      <div className="control-section">
        <div className="section-heading">
          <span>🔄</span>
          <span>Engine Reset & Seed</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="number"
            className="form-input"
            value={seed}
            onChange={e => setSeed(parseInt(e.target.value, 10) || 42)}
            style={{ width: '80px' }}
          />
          <button
            className="btn-secondary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => onReset(seed)}
          >
            Reset Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
