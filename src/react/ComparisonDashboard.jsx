import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { runScenario } from '../engine/index.js';

export default function ComparisonDashboard({ isOpen, onClose, seed = 42, campus }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const executeComparison = (targetSeed) => {
    setLoading(true);
    setTimeout(() => {
      const pool = runScenario({ campus, seed: targetSeed, mode: 'pool', durationMin: 60 });
      const solo = runScenario({ campus, seed: targetSeed, mode: 'solo', durationMin: 60 });
      setResults({ pool, solo, seed: targetSeed });
      setLoading(false);
    }, 50);
  };

  useEffect(() => {
    if (isOpen) {
      executeComparison(seed);
    } else {
      setResults(null);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    }
  }, [isOpen, seed]);

  useEffect(() => {
    if (!results || !chartCanvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const { pool, solo } = results;

    const ctx = chartCanvasRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Fleet Distance (min)', 'Avg Wait Time (min)', 'Missed Pickups', 'Service Rate (%)', 'Avg Occupancy'],
        datasets: [
          {
            label: 'Dynamic Pooling (Shared)',
            data: [pool.totalDistanceMin, pool.avgWaitMin, pool.missedPickups, pool.servedPct, pool.avgOccupancy],
            backgroundColor: 'rgba(56, 189, 248, 0.75)',
            borderColor: '#38bdf8',
            borderWidth: 1.5,
            borderRadius: 4
          },
          {
            label: 'Solo Direct Trips',
            data: [solo.totalDistanceMin, solo.avgWaitMin, solo.missedPickups, solo.servedPct, solo.avgOccupancy],
            backgroundColor: 'rgba(244, 63, 94, 0.75)',
            borderColor: '#f43f5e',
            borderWidth: 1.5,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#e2e8f0', font: { family: 'sans-serif', size: 12 } }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#38bdf8',
            borderColor: '#334155',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8', font: { size: 11 } },
            grid: { color: 'rgba(51, 65, 85, 0.3)' }
          },
          y: {
            ticks: { color: '#94a3b8', font: { size: 11 } },
            grid: { color: 'rgba(51, 65, 85, 0.4)' }
          }
        }
      }
    });
  }, [results]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop active">
      <div className="modal-window">
        <div className="modal-header">
          <div className="modal-title">
            <span>⚖️ Head-to-Head: Dynamic Pooling vs Solo Rides</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="btn-primary btn-sm"
              onClick={() => executeComparison(seed)}
              disabled={loading}
            >
              ↻ Re-run Comparison
            </button>
            <button className="modal-close-btn" title="Close Modal" onClick={onClose}>
              &times;
            </button>
          </div>
        </div>

        <div className="modal-body">
          {loading || !results ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚙️</div>
              Running 60-minute headless simulation for both POOL and SOLO modes (Seed: {seed})...
            </div>
          ) : (
            <div>
              {/* Metric Cards Grid */}
              <div className="modal-kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-title">Fleet Distance / Travel Time</div>
                  <div className="kpi-values">
                    <span className="kpi-val pool">{results.pool.totalDistanceMin}m</span>
                    <span className="kpi-vs">vs</span>
                    <span className="kpi-val solo">{results.solo.totalDistanceMin}m</span>
                  </div>
                  <div className="kpi-sub">
                    {results.pool.totalDistanceMin < results.solo.totalDistanceMin
                      ? `🟢 Pooling saved ${(results.solo.totalDistanceMin - results.pool.totalDistanceMin).toFixed(1)}m of fleet travel`
                      : `🔴 Solo traveled less by ${(results.pool.totalDistanceMin - results.solo.totalDistanceMin).toFixed(1)}m`}
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-title">Average Wait Time</div>
                  <div className="kpi-values">
                    <span className="kpi-val pool">{results.pool.avgWaitMin}m</span>
                    <span className="kpi-vs">vs</span>
                    <span className="kpi-val solo">{results.solo.avgWaitMin}m</span>
                  </div>
                  <div className="kpi-sub">
                    {results.pool.avgWaitMin <= results.solo.avgWaitMin
                      ? `🟢 ${(results.solo.avgWaitMin - results.pool.avgWaitMin).toFixed(1)}m faster with pooling`
                      : `🟡 +${(results.pool.avgWaitMin - results.solo.avgWaitMin).toFixed(1)}m added delay from shared detours`}
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-title">Requests Served %</div>
                  <div className="kpi-values">
                    <span className="kpi-val pool">{results.pool.servedPct}%</span>
                    <span className="kpi-vs">vs</span>
                    <span className="kpi-val solo">{results.solo.servedPct}%</span>
                  </div>
                  <div className="kpi-sub">
                    Missed pickups: {results.pool.missedPickups} (Pool) vs {results.solo.missedPickups} (Solo)
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-title">Average Vehicle Occupancy</div>
                  <div className="kpi-values">
                    <span className="kpi-val pool">{results.pool.avgOccupancy}</span>
                    <span className="kpi-vs">vs</span>
                    <span className="kpi-val solo">{results.solo.avgOccupancy}</span>
                  </div>
                  <div className="kpi-sub">
                    Capacity utilization factor
                  </div>
                </div>
              </div>

              {/* Chart.js Container */}
              <div style={{ position: 'relative', height: '260px', marginTop: '1.25rem', marginBottom: '1.25rem' }}>
                <canvas ref={chartCanvasRef} />
              </div>

              {/* Honest Evaluative Narrative */}
              <div className="narrative-box">
                <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  📝 Evaluator Assessment (Seed: {results.seed}):
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.45' }}>
                  {results.pool.totalDistanceMin < results.solo.totalDistanceMin ? (
                    <span><strong>Efficiency Gain:</strong> Dynamic Pooling reduced total vehicle travel time by <strong>{(((results.solo.totalDistanceMin - results.pool.totalDistanceMin) / results.solo.totalDistanceMin) * 100).toFixed(1)}%</strong> ({results.pool.totalDistanceMin}m vs {results.solo.totalDistanceMin}m solo), significantly lowering campus fleet fuel/energy consumption. </span>
                  ) : (
                    <span><strong>High Demand Notice:</strong> Dynamic Pooling resulted in {results.pool.totalDistanceMin}m of vehicle travel time compared to {results.solo.totalDistanceMin}m in solo mode. </span>
                  )}
                  {results.pool.avgWaitMin > results.solo.avgWaitMin ? (
                    <span>However, pooling introduced an average detour/waiting delay of <strong>+{(results.pool.avgWaitMin - results.solo.avgWaitMin).toFixed(1)} minutes</strong> per completed passenger. </span>
                  ) : (
                    <span>Pooling maintained fast dispatch, with average wait times of {results.pool.avgWaitMin}m. </span>
                  )}
                  {results.pool.missedPickups < results.solo.missedPickups ? (
                    <span>Crucially, pooling serviced <strong>{results.pool.servedPct}%</strong> of all riders compared to only <strong>{results.solo.servedPct}%</strong> in solo mode, preventing <strong>{results.solo.missedPickups - results.pool.missedPickups} riders</strong> from being stranded during peak bursts.</span>
                  ) : (
                    <span>Both systems handled current load similarly.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
