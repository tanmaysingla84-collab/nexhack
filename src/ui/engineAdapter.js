/**
 * /src/ui/engineAdapter.js
 * 
 * ========================================================
 * INTEGRATION POINT FOR MEMBER 1 & MEMBER 2
 * ========================================================
 * 
 * Member 2 builds the UI against the mock engine first.
 * When Member 1 commits /src/engine/index.js and /data/campus.json,
 * simply change USE_REAL_ENGINE to true (and uncomment the real engine import).
 */

// OPTION A: Mock Engine (Active during standalone / parallel UI dev)
import {
  createSimulation as mockCreateSimulation,
  runScenario as mockRunScenario,
  MOCK_CAMPUS
} from '../mock/mockEngine.js';

// OPTION B: Real Engine (Member 1)
// Uncomment once Member 1 delivers /src/engine/index.js:
// import {
//   createSimulation as realCreateSimulation,
//   runScenario as realRunScenario
// } from '../engine/index.js';

export const USE_REAL_ENGINE = false;

/**
 * Loads campus data from /data/campus.json if available;
 * falls back cleanly to MOCK_CAMPUS.
 */
export async function loadCampusData() {
  try {
    const res = await fetch('/data/campus.json');
    if (res.ok) {
      const data = await res.json();
      if (data && data.nodes && data.edges) {
        console.log('[Adapter] Loaded campus topology from /data/campus.json');
        return data;
      }
    }
  } catch (err) {
    console.info('[Adapter] Using default high-fidelity mock campus topology');
  }
  return MOCK_CAMPUS;
}

/**
 * Creates simulation instance using whichever engine is active.
 */
export function createSimulation(options = {}) {
  if (USE_REAL_ENGINE) {
    // return realCreateSimulation(options);
    console.warn('[Adapter] USE_REAL_ENGINE is true, but real engine is not wired yet. Using mock.');
  }
  return mockCreateSimulation(options);
}

/**
 * Runs headless comparison scenario using whichever engine is active.
 */
export function runScenario(options = {}) {
  if (USE_REAL_ENGINE) {
    // return realRunScenario(options);
  }
  return mockRunScenario(options);
}
