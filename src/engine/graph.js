/**
 * /src/engine/graph.js
 * Campus graph representation and routing algorithms using Dijkstra.
 * Supports all-pairs shortest paths and dynamic road closure/reopening.
 */

export class CampusGraph {
  /**
   * @param {Array<{id: string, name: string, type: string, lat: number, lng: number}>} nodes
   * @param {Array<{id: string, from: string, to: string, minutes: number, closed?: boolean}>} edges
   */
  constructor(nodes, edges) {
    this.nodes = nodes;
    this.edges = edges;
    this.nodeMap = new Map(nodes.map(n => [n.id, n]));
    this.edgeMap = new Map(edges.map(e => [e.id, e]));
    this.computeAllPairs();
  }

  /**
   * Recomputes adjacency list and all-pairs shortest paths using Dijkstra.
   */
  computeAllPairs() {
    this.adj = new Map();
    for (const node of this.nodes) {
      this.adj.set(node.id, []);
    }
    for (const edge of this.edges) {
      if (edge.closed) continue;
      this.adj.get(edge.from)?.push({ to: edge.to, minutes: edge.minutes, edgeId: edge.id });
      this.adj.get(edge.to)?.push({ to: edge.from, minutes: edge.minutes, edgeId: edge.id });
    }

    this.dist = new Map();
    this.paths = new Map();

    for (const startNode of this.nodes) {
      this.dijkstraFrom(startNode.id);
    }
  }

  /**
   * Runs Dijkstra from a given start node to all reachable nodes.
   * @param {string} startId
   */
  dijkstraFrom(startId) {
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set(this.nodes.map(n => n.id));

    for (const node of this.nodes) {
      distances.set(node.id, Infinity);
    }
    distances.set(startId, 0);

    while (unvisited.size > 0) {
      let currentId = null;
      let minDistance = Infinity;
      for (const id of unvisited) {
        const d = distances.get(id);
        if (d < minDistance) {
          minDistance = d;
          currentId = id;
        }
      }

      if (currentId === null || minDistance === Infinity) break;
      unvisited.delete(currentId);

      const neighbors = this.adj.get(currentId) || [];
      for (const edge of neighbors) {
        if (!unvisited.has(edge.to)) continue;
        const newDist = distances.get(currentId) + edge.minutes;
        if (newDist < distances.get(edge.to)) {
          distances.set(edge.to, newDist);
          previous.set(edge.to, currentId);
        }
      }
    }

    for (const node of this.nodes) {
      const targetId = node.id;
      const key = `${startId}->${targetId}`;
      const d = distances.get(targetId);
      this.dist.set(key, d);

      if (d === Infinity) {
        this.paths.set(key, null);
      } else {
        const path = [];
        let curr = targetId;
        while (curr !== undefined) {
          path.unshift(curr);
          curr = previous.get(curr);
        }
        this.paths.set(key, path);
      }
    }
  }

  /**
   * Gets shortest path between two nodes.
   * @param {string} fromId
   * @param {string} toId
   * @returns {{minutes: number, path: string[]|null}}
   */
  getShortestPath(fromId, toId) {
    if (fromId === toId) return { minutes: 0, path: [fromId] };
    const key = `${fromId}->${toId}`;
    const minutes = this.dist.get(key) ?? Infinity;
    const path = this.paths.get(key) ?? null;
    return { minutes, path };
  }

  /**
   * Closes a road edge by ID.
   * @param {string} edgeId
   * @returns {boolean} true if road was closed, false if not found or already closed
   */
  closeRoad(edgeId) {
    const edge = this.edgeMap.get(edgeId);
    if (!edge || edge.closed) return false;
    edge.closed = true;
    this.computeAllPairs();
    return true;
  }

  /**
   * Reopens a road edge by ID.
   * @param {string} edgeId
   * @returns {boolean} true if road was reopened, false if not found or already open
   */
  reopenRoad(edgeId) {
    const edge = this.edgeMap.get(edgeId);
    if (!edge || !edge.closed) return false;
    edge.closed = false;
    this.computeAllPairs();
    return true;
  }
}
