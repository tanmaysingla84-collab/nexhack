'use client';

import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { BarChart2, RefreshCw, X } from 'lucide-react';
import { runScenario } from '../src/engine/index.js';

export default function ComparisonModal({ isOpen, onClose, seed = 42, campus }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const executeComparison = (targetSeed) => {
    setLoading(true);
    setTimeout(() => {
      try {
        const pool = runScenario({ campus, seed: targetSeed, mode: 'pool', durationMin: 60 });
        const solo = runScenario({ campus, seed: targetSeed, mode: 'solo', durationMin: 60 });
        setResults({ pool, solo, seed: targetSeed });
      } catch (e) {
        console.error('Error running comparison:', e);
      }
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
        labels: ['Fleet Distance (min)', 'Avg Wait (min)', 'Missed Pickups', 'Service Rate (%)', 'Avg Occupancy'],
        datasets: [
          {
            label: '⚡ Dynamic Pooling (Shared)',
            data: [pool.totalDistanceMin, pool.avgWaitMin, pool.missedPickups, pool.servedPct, pool.avgOccupancy],
            backgroundColor: 'rgba(249, 115, 22, 0.8)',
            borderColor: '#f97316',
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: '🚀 Solo Direct Trips',
            data: [solo.totalDistanceMin, solo.avgWaitMin, solo.missedPickups, solo.servedPct, solo.avgOccupancy],
            backgroundColor: 'rgba(56, 189, 248, 0.75)',
            borderColor: '#38bdf8',
            borderWidth: 1.5,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#e2e8f0', font: { family: 'sans-serif', size: 12, weight: 'bold' } }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f97316',
            borderColor: '#334155',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8', font: { size: 11, weight: 'bold' } },
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
      <div className="modal-window max-w-3xl">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-orange-400" />
            <h3 className="font-extrabold text-sm md:text-base text-white">
              Head-to-Head Report: Dynamic Pooling vs Solo Baseline
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-primary btn-sm flex items-center gap-1.5"
              onClick={() => executeComparison(seed)}
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Re-run Evaluation</span>
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="modal-body p-4 space-y-4">
          {loading || !results ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <div className="text-3xl animate-spin">⚙️</div>
              <p className="text-xs">Running 60-minute deterministic comparative simulation across both modes...</p>
            </div>
          ) : (
            <>
              {/* Metric Comparison Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">FLEET TRAVEL TIME</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold text-orange-400">{results.pool.totalDistanceMin}m</span>
                    <span className="text-[10px] text-slate-500">vs</span>
                    <span className="text-xs font-bold text-sky-400">{results.solo.totalDistanceMin}m</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                    {results.pool.totalDistanceMin < results.solo.totalDistanceMin
                      ? `🟢 Saved ${(results.solo.totalDistanceMin - results.pool.totalDistanceMin).toFixed(1)}m fleet travel`
                      : `🟡 Similar fleet mileage`}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">AVERAGE WAIT TIME</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold text-orange-400">{results.pool.avgWaitMin}m</span>
                    <span className="text-[10px] text-slate-500">vs</span>
                    <span className="text-xs font-bold text-sky-400">{results.solo.avgWaitMin}m</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">
                    P95: {results.pool.p95WaitMin}m (Pool) vs {results.solo.p95WaitMin}m (Solo)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">REQUESTS SERVED %</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold text-emerald-400">{results.pool.servedPct}%</span>
                    <span className="text-[10px] text-slate-500">vs</span>
                    <span className="text-xs font-bold text-sky-400">{results.solo.servedPct}%</span>
                  </div>
                  <span className="text-[10px] text-orange-300 font-semibold block mt-1">
                    Missed Pickups: {results.pool.missedPickups} vs {results.solo.missedPickups} (Solo)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">SEAT UTILIZATION</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold text-orange-400">{results.pool.seatUtilPct}%</span>
                    <span className="text-[10px] text-slate-500">vs</span>
                    <span className="text-xs font-bold text-sky-400">{results.solo.seatUtilPct}%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Avg Occ: {results.pool.avgOccupancy}/4 vs {results.solo.avgOccupancy}/4
                  </span>
                </div>
              </div>

              {/* Chart.js Canvas */}
              <div className="relative h-60 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <canvas ref={chartCanvasRef} />
              </div>

              {/* Evaluator Assessment */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-extrabold text-white text-xs">
                  📝 Algorithmic Evaluation & Operational Trade-Offs (Seed: {results.seed})
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong>Service Coverage:</strong> Dynamic Pooling served <strong>{results.pool.servedPct}%</strong> of campus ride demand compared to only <strong>{results.solo.servedPct}%</strong> under solo direct service. During peak class dismissals, solo direct service exhausts vehicle inventory, causing <strong>{results.solo.missedPickups} stranded riders</strong> due to expired pickup windows. Dynamic Pooling grouped concurrent trips, boosting seat utilization to <strong>{results.pool.seatUtilPct}%</strong> while enforcing detour limits ($ \text{rideTime} \le \text{directTime} \times 1.5 $).
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
