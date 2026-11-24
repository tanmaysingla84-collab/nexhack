/**
 * /src/ui/controlPanel.js
 * Simulation control and disruption panel.
 * Handles adding requests, preset scenarios, road closures, vehicle breakdowns, speed toggles, and resets.
 */

export class ControlPanel {
  constructor(containerId = 'controls-tab', options = {}) {
    this.container = document.getElementById(containerId);
    this.onAddRequest = options.onAddRequest || (() => {});
    this.onBreakVehicle = options.onBreakVehicle || (() => {});
    this.onToggleRoad = options.onToggleRoad || (() => {});
    this.onClassBurst = options.onClassBurst || (() => {});
    this.onReset = options.onReset || (() => {});

    this.nodes = [];
    this.edges = [];
    this.vehicles = [];
    this._initialized = false;
  }

  init(state) {
    if (!this.container || !state) return;
    this.nodes = state.nodes || [];
    this.edges = state.edges || [];
    this.vehicles = state.vehicles || [];

    this.renderForm();
    this._initialized = true;
  }

  update(state) {
    if (!this._initialized) {
      this.init(state);
      return;
    }
    this.nodes = state.nodes || [];
    this.edges = state.edges || [];
    this.vehicles = state.vehicles || [];

    this.updateRoadDropdown();
    this.updateVehicleDropdown();
  }

  renderForm() {
    const nodeOptions = this.nodes.map(n => `<option value="${n.id}">${n.name}</option>`).join('');

    this.container.innerHTML = `
      <!-- Add Request Section -->
      <div class="control-section">
        <div class="section-heading">
          <span>➕</span>
          <span>Add Ride Request</span>
        </div>
        <form id="add-request-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Pickup Location</label>
              <select id="req-pickup" class="form-select">
                ${nodeOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Dropoff Destination</label>
              <select id="req-dropoff" class="form-select">
                ${nodeOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Passengers</label>
              <select id="req-passengers" class="form-select">
                <option value="1" selected>1 Seat</option>
                <option value="2">2 Seats</option>
                <option value="3">3 Seats</option>
                <option value="4">4 Seats</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Pickup Window (Min)</label>
              <input id="req-window" type="number" class="form-input" value="10" min="2" max="30">
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">Max Allowed Detour (Min)</label>
              <input id="req-detour" type="number" class="form-input" value="6" min="1" max="25">
            </div>
          </div>

          <div style="margin-top: 0.85rem; display: flex; gap: 0.5rem;">
            <button type="submit" class="btn-primary" style="flex: 1; justify-content: center;">
              Dispatch Request
            </button>
          </div>
        </form>

        <div style="margin-top: 0.85rem;">
          <span class="form-label">Quick Test Presets:</span>
          <div class="preset-buttons">
            <button class="btn-preset" onclick="window.app.presetRequest('hostel_a', 'tech_tower', 1)">Rahul: Hostel A ➔ CS Tower</button>
            <button class="btn-preset" onclick="window.app.presetRequest('library', 'hostel_b', 1)">Priya: Library ➔ Hostel B</button>
            <button class="btn-preset" onclick="window.app.presetRequest('canteen_central', 'sports_complex', 2)">Duo: Canteen ➔ Gym (2 seats)</button>
            <button class="btn-preset" onclick="window.app.presetRequest('main_gate', 'innovation_hub', 4)">Group: Main Gate ➔ Hub (4 seats)</button>
          </div>
        </div>
      </div>

      <!-- Quick Demand Burst Section -->
      <div class="control-section">
        <div class="section-heading">
          <span>⚡</span>
          <span>Dynamic Demand Burst</span>
        </div>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          Simulate classes ending simultaneously with an instant rush of student ride requests across campus.
        </p>
        <button id="btn-class-burst" class="btn-primary" style="width: 100%; justify-content: center; background: linear-gradient(135deg, #f59e0b, #d97706);">
          🎓 Trigger "Class Ends" Rush (6 Requests)
        </button>
      </div>

      <!-- Disruptions Section -->
      <div class="control-section">
        <div class="section-heading">
          <span>⚠️</span>
          <span>Live Campus Disruptions</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          <!-- Road Closure -->
          <div class="form-group">
            <label class="form-label">Road Construction / Closure (or click road on map)</label>
            <div style="display: flex; gap: 0.4rem;">
              <select id="road-select" class="form-select" style="flex: 1;">
                <!-- dynamic options -->
              </select>
              <button id="btn-toggle-road" class="btn-secondary btn-sm" style="padding: 0 0.8rem;">
                Toggle Road
              </button>
            </div>
          </div>

          <!-- Vehicle Breakdown -->
          <div class="form-group">
            <label class="form-label">Trigger Shuttle Breakdown</label>
            <div style="display: flex; gap: 0.4rem;">
              <select id="vehicle-break-select" class="form-select" style="flex: 1;">
                <!-- dynamic options -->
              </select>
              <button id="btn-break-vehicle" class="btn-danger btn-sm" style="padding: 0 0.8rem;">
                Break Down
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Reset & Config Section -->
      <div class="control-section">
        <div class="section-heading">
          <span>⚙️</span>
          <span>Simulation Reset & Seed</span>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <input id="input-seed" type="number" class="form-input" style="width: 100px;" value="42" title="Seed for deterministic replay">
          <button id="btn-reset-sim" class="btn-secondary btn-sm" style="flex: 1; justify-content: center; padding: 0.5rem;">
            🔄 Reset Simulation
          </button>
        </div>
      </div>
    `;

    // Wire listeners
    const form = document.getElementById('add-request-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const pickup = document.getElementById('req-pickup').value;
      const dropoff = document.getElementById('req-dropoff').value;
      const passengers = parseInt(document.getElementById('req-passengers').value, 10);
      const windowMin = parseFloat(document.getElementById('req-window').value);
      const maxDetourMin = parseFloat(document.getElementById('req-detour').value);

      if (pickup === dropoff) {
        alert('Pickup and dropoff destination must be different nodes.');
        return;
      }

      this.onAddRequest({ pickup, dropoff, passengers, windowMin, maxDetourMin });
    });

    document.getElementById('btn-class-burst').addEventListener('click', () => {
      this.onClassBurst();
    });

    document.getElementById('btn-toggle-road').addEventListener('click', () => {
      const roadSelect = document.getElementById('road-select');
      if (roadSelect && roadSelect.value) {
        this.onToggleRoad(roadSelect.value);
      }
    });

    document.getElementById('btn-break-vehicle').addEventListener('click', () => {
      const vSelect = document.getElementById('vehicle-break-select');
      if (vSelect && vSelect.value) {
        this.onBreakVehicle(vSelect.value);
      }
    });

    document.getElementById('btn-reset-sim').addEventListener('click', () => {
      const seedVal = parseInt(document.getElementById('input-seed').value, 10) || 42;
      this.onReset(seedVal);
    });

    // Populate initial dropdowns
    this.updateRoadDropdown();
    this.updateVehicleDropdown();
  }

  updateRoadDropdown() {
    const roadSelect = document.getElementById('road-select');
    if (!roadSelect) return;
    const currentVal = roadSelect.value;
    const nodeMap = new Map(this.nodes.map(n => [n.id, n.name]));

    roadSelect.innerHTML = this.edges.map(e => {
      const fName = nodeMap.get(e.from) || e.from;
      const tName = nodeMap.get(e.to) || e.to;
      const statusText = e.closed ? ' [CLOSED]' : ' [OPEN]';
      return `<option value="${e.id}" ${e.id === currentVal ? 'selected' : ''}>${e.id}: ${fName} ↔ ${tName}${statusText}</option>`;
    }).join('');
  }

  updateVehicleDropdown() {
    const vSelect = document.getElementById('vehicle-break-select');
    if (!vSelect) return;
    const currentVal = vSelect.value;

    vSelect.innerHTML = this.vehicles.map(v => {
      const statusText = v.status === 'broken' ? ' (Already Broken)' : ` (${v.status})`;
      return `<option value="${v.id}" ${v.id === currentVal ? 'selected' : ''}>${v.id}${statusText}</option>`;
    }).join('');
  }

  setPickupDropoff(nodeId) {
    const pickupSelect = document.getElementById('req-pickup');
    const dropoffSelect = document.getElementById('req-dropoff');
    if (!pickupSelect || !dropoffSelect) return;

    if (!pickupSelect.value || pickupSelect.value === dropoffSelect.value) {
      pickupSelect.value = nodeId;
    } else {
      dropoffSelect.value = nodeId;
    }
  }
}
