/**
 * /src/engine/models.js
 * Data models and types for campus ride pooling engine.
 */

/**
 * Creates a deterministic Mulberry32 Pseudo-Random Number Generator.
 * @param {number} seed
 * @returns {() => number} Returns float in [0, 1)
 */
export function createRNG(seed = 42) {
  let s = Math.floor(seed) >>> 0;
  return function next() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @typedef {Object} Stop
 * @property {'pickup'|'dropoff'} type
 * @property {string} node
 * @property {string} requestId
 * @property {number} plannedArrival
 */

/**
 * @typedef {Object} Vehicle
 * @property {string} id
 * @property {number} capacity
 * @property {number} occupancy
 * @property {'idle'|'moving'|'broken'} status
 * @property {{lat: number, lng: number}} position
 * @property {string} currentNode
 * @property {string|null} targetNode
 * @property {number} progressFraction
 * @property {string[]} route
 * @property {Stop[]} stops
 * @property {string[]} onboard
 * @property {string} color
 * @property {number} totalDistanceMin
 */

/**
 * @typedef {Object} RejectionReason
 * @property {string|null} vehicleId
 * @property {'capacity'|'timing'|'detour'|'routing'|'vehicle_unavailable'} type
 * @property {string} message
 */

/**
 * @typedef {Object} Request
 * @property {string} id
 * @property {string} pickup
 * @property {string} dropoff
 * @property {number} passengers
 * @property {number} windowMin
 * @property {number} maxDetourMin
 * @property {number} earliestPickup
 * @property {number} latestPickup
 * @property {number} createdAt
 * @property {'waiting'|'assigned'|'onboard'|'completed'|'rejected'|'cancelled'} status
 * @property {string|null} vehicleId
 * @property {string|null} rejectionReason
 * @property {RejectionReason[]} reasons
 * @property {number|null} pickedUpAt
 * @property {number|null} completedAt
 * @property {number|null} promisedLatestDropoff
 */
