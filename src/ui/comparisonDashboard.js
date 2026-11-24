/**
 * /src/ui/comparisonDashboard.js
 * Headless Comparison Dashboard (Solo vs Pool).
 * Calls runScenario twice with the SAME seed, renders side-by-side KPI cards,
 * a grouped bar chart using Chart.js, and an auto-generated honest narrative evaluation.
 */

import { runScenario } from './engineAdapter.js';

export class ComparisonDashboard {
  constructor(modalId = 'comparison-modal') {
    this.modal = document.getElementById(modalId);
    this.chartInstance = null;
    this.init();
  }

  init() {
    if (!this.modal) return;

    const closeBtn = this.modal.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    const runBtn = document.getElementById('btn-run-comparison');
    if (runBtn) {
      runBtn.addEventListener('click', () => {
        const seedVal = parseInt(document.getElementById('input-seed')?.value, 10) || 42;
        this.runComparison(seedVal);
      });
    }
  }

  open() {
    if (!this.modal) return;
    this.modal.classList.add('active');
    const seedVal = parseInt(document.getElementById('input-seed')?.value, 10) || 42;
    this.runComparison(seedVal);
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
  }

  runComparison(seed = 42) {
    const modalBody = this.modal.querySelector('.modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; animation: spin 1s infinite linear;">⚙️</div>
        Running 60-minute headless simulation for both POOL and SOLO modes (Seed: ${seed})...
      </div>
    `;

    setTimeout(() => {
      const poolResult = runScenario({ seed, mode: 'pool', durationMin: 60 });
      const soloResult = runScenario({ seed, mode: 'solo', durationMin: 60 });

      this.renderResults(poolResult, soloResult, seed);
    }, 50);
  }

  renderResults(pool, solo, seed) {
    const modalBody = this.modal.querySelector('.modal-body');
    if (!modalBody) return;

    // Calculate deltas
    const distDeltaPct = solo.totalDistanceMin > 0
      ? (((pool.totalDistanceMin - solo.totalDistanceMin) / solo.totalDistanceMin) * 100).toFixed(1)
      : 0;
    const waitDeltaMin = (pool.avgWaitMin - solo.avgWaitMin).toFixed(1);
    const servedDeltaPct = (pool.servedPct - solo.servedPct).toFixed(1);
    const missedDelta = pool.missedPickups - solo.missedPickups;

    // Honest auto-generated narrative
    let narrative = '';
    const distSaved = Math.abs(distDeltaPct);

    if (parseFloat(distDeltaPct) < 0) {
      narrative += `<strong>Efficiency Gain:</strong> Dynamic Pooling reduced total vehicle travel time by <strong>${distSaved}%</strong> (${pool.totalDistanceMin}m vs ${solo.totalDistanceMin}m solo), significantly lowering campus fleet fuel/energy consumption. `;
    } else {
      narrative += `<strong>High Demand Notice:</strong> Dynamic Pooling resulted in ${pool.totalDistanceMin}m of vehicle travel time compared to ${solo.totalDistanceMin}m in solo mode. `;
    }

    if (parseFloat(waitDeltaMin) > 0) {
      narrative += `However, pooling introduced an average detour/waiting delay of <strong>+${waitDeltaMin} minutes</strong> per completed passenger. `;
    } else if (parseFloat(waitDeltaMin) < 0) {
      narrative += `Remarkably, pooling also reduced average wait times by <strong>${Math.abs(waitDeltaMin)} minutes</strong> by keeping shuttles actively circulating within demand clusters. `;
    } else {
      narrative += `Average passenger wait times remained virtually identical between both modes. `;
    }

    if (pool.missedPickups < solo.missedPickups) {
      narrative += `Crucially, pooling serviced <strong>${pool.servedPct}%</strong> of all riders compared to only <strong>${solo.servedPct}%</strong> in solo mode, preventing <strong>${Math.abs(missedDelta)} riders</strong> from being stranded during peak bursts.`;
    } else if (pool.missedPickups > solo.missedPickups) {
      narrative += `Under strict detour constraints, pooling rejected <strong>${pool.missedPickups}</strong> riders vs <strong>${solo.missedPickups}</strong> in solo mode.`;
    } else {
      narrative += `Both modes completed service with <strong>${pool.missedPickups}</strong> rejected requests.`;
    }

    modalBody.innerHTML = `
      <div class="comparison-grid">
        <!-- Pooling Card -->
        <div class="mode-summary-card pool-card">
          <div class="mode-title">
            <span style="color: var(--accent-cyan);">Dynamic Pooling Mode</span>
            <span class="badge-tag">Shared Fleet</span>
          </div>
          <table class="comp-table">
            <tr>
              <td>Fleet Travel Time:</td>
              <td>${pool.totalDistanceMin} min <span class="delta-badge ${parseFloat(distDeltaPct) <= 0 ? 'better' : 'worse'}">${distDeltaPct}%</span></td>
            </tr>
            <tr>
              <td>Avg Passenger Wait:</td>
              <td>${pool.avgWaitMin} min</td>
            </tr>
            <tr>
              <td>Riders Served:</td>
              <td>${pool.servedPct}% (${pool.missedPickups} rejected)</td>
            </tr>
            <tr>
              <td>Avg Fleet Occupancy:</td>
              <td>${pool.avgOccupancy} / 4 seats</td>
            </tr>
          </table>
        </div>

        <!-- Solo Card -->
        <div class="mode-summary-card solo-card">
          <div class="mode-title">
            <span style="color: #94a3b8;">Solo Direct Ride Mode</span>
            <span class="badge-tag" style="background: rgba(148, 163, 184, 0.15); color: #cbd5e1; border-color: #64748b;">No Sharing</span>
          </div>
          <table class="comp-table">
            <tr>
              <td>Fleet Travel Time:</td>
              <td>${solo.totalDistanceMin} min</td>
            </tr>
            <tr>
              <td>Avg Passenger Wait:</td>
              <td>${solo.avgWaitMin} min</td>
            </tr>
            <tr>
              <td>Riders Served:</td>
              <td>${solo.servedPct}% (${solo.missedPickups} rejected)</td>
            </tr>
            <tr>
              <td>Avg Fleet Occupancy:</td>
              <td>${solo.avgOccupancy} / 4 seats</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Chart.js Grouped Bar Chart -->
      <div class="chart-wrapper">
        <canvas id="comparisonChart"></canvas>
      </div>

      <!-- Honest Narrative -->
      <div class="honest-narrative">
        <div style="font-weight: 700; color: #38bdf8; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
          <span>⚖️</span>
          <span>Honest Headless Evaluation (Seed ${seed}, 60-min simulation)</span>
        </div>
        <p>${narrative}</p>
      </div>
    `;

    // Initialize Chart.js
    this.renderChart(pool, solo);
  }

  renderChart(pool, solo) {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas || !window.Chart) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.chartInstance = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Fleet Travel (min)', 'Avg Wait (min)', 'Missed Pickups', 'Served Rate (%)', 'Avg Occupancy (x10)'],
        datasets: [
          {
            label: 'Dynamic Pooling',
            data: [
              pool.totalDistanceMin,
              pool.avgWaitMin,
              pool.missedPickups,
              pool.servedPct,
              pool.avgOccupancy * 10
            ],
            backgroundColor: 'rgba(6, 182, 212, 0.75)',
            borderColor: '#06b6d4',
            borderWidth: 1.5
          },
          {
            label: 'Solo Rides',
            data: [
              solo.totalDistanceMin,
              solo.avgWaitMin,
              solo.missedPickups,
              solo.servedPct,
              solo.avgOccupancy * 10
            ],
            backgroundColor: 'rgba(148, 163, 184, 0.5)',
            borderColor: '#94a3b8',
            borderWidth: 1.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#e2e8f0',
              font: { family: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto' }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: '#334155',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          y: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          }
        }
      }
    });
  }
}
