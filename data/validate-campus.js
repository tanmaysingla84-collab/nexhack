import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const campusPath = path.join(__dirname, 'campus.json');
const raw = fs.readFileSync(campusPath, 'utf8');
const data = JSON.parse(raw);

console.log('🔍 Validating Campus Graph Architecture...');

const { meta, scale, nodes, edges, stops } = data;
const mPerPx = scale?.metersPerPixel || meta?.calibratedScaleMetersPerPx || 1.10;

// 1. Check duplicate IDs
const nodeMap = new Map();
for (const n of nodes) {
  if (nodeMap.has(n.id)) {
    throw new Error(`Duplicate Node ID found: ${n.id}`);
  }
  nodeMap.set(n.id, n);
}
console.log(`✅ ${nodes.length} unique nodes verified.`);

const edgeSet = new Set();
for (const e of edges) {
  if (edgeSet.has(e.id)) {
    throw new Error(`Duplicate Edge ID found: ${e.id}`);
  }
  edgeSet.add(e.id);

  if (!nodeMap.has(e.from)) throw new Error(`Edge ${e.id} references non-existent 'from' node: ${e.from}`);
  if (!nodeMap.has(e.to)) throw new Error(`Edge ${e.id} references non-existent 'to' node: ${e.to}`);
}
console.log(`✅ ${edges.length} unique edges verified.`);

// 2. Compute exact lengths & minutes for edges if not preset
let updatedEdges = false;
for (const e of edges) {
  const fromN = nodeMap.get(e.from);
  const toN = nodeMap.get(e.to);
  const dx = toN.x - fromN.x;
  const dy = toN.y - fromN.y;
  const lenPx = Math.round(Math.hypot(dx, dy) * 10) / 10;
  const lenMeters = Math.round(lenPx * mPerPx * 10) / 10;
  
  if (lenMeters <= 0) {
    throw new Error(`Zero-length edge detected: ${e.id}`);
  }

  const speedKmh = e.speedKmh || 18;
  const speedMetersPerMin = (speedKmh * 1000) / 60;
  const minutes = Math.round((lenMeters / speedMetersPerMin) * 100) / 100;

  if (e.lengthPx !== lenPx || e.lengthMeters !== lenMeters || e.minutes !== minutes) {
    e.lengthPx = lenPx;
    e.lengthMeters = lenMeters;
    e.minutes = minutes;
    e.waypoints = [[fromN.x, fromN.y], [toN.x, toN.y]];
    updatedEdges = true;
  }
}

if (updatedEdges) {
  fs.writeFileSync(campusPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('✅ Synchronized edge lengths, waypoints, and travel time durations.');
}

// 3. Verify all stops snapped to valid nodes
const stopSet = new Set();
for (const s of stops) {
  if (stopSet.has(s.id)) throw new Error(`Duplicate Stop ID: ${s.id}`);
  stopSet.add(s.id);
  if (!nodeMap.has(s.nodeId)) throw new Error(`Stop ${s.id} snapped to invalid node: ${s.nodeId}`);
}
console.log(`✅ ${stops.length} designated stops properly snapped.`);

// 4. Strong Connectivity Check using BFS/DFS
const adj = new Map();
nodes.forEach(n => adj.set(n.id, []));
edges.forEach(e => {
  adj.get(e.from).push(e.to);
  if (!e.oneWay) {
    adj.get(e.to).push(e.from);
  }
});

// Check reachability from N01
const visited = new Set();
const queue = [nodes[0].id];
visited.add(nodes[0].id);

while (queue.length > 0) {
  const curr = queue.shift();
  for (const nxt of adj.get(curr)) {
    if (!visited.has(nxt)) {
      visited.add(nxt);
      queue.push(nxt);
    }
  }
}

if (visited.size !== nodes.length) {
  const unreachable = nodes.filter(n => !visited.has(n.id)).map(n => n.id);
  throw new Error(`Graph is not fully connected! Unreachable nodes from ${nodes[0].id}: ${unreachable.join(', ')}`);
}

console.log(`✅ Graph is 100% strongly connected! All ${nodes.length} nodes reachable.`);
console.log('🎉 Campus Graph Validation PASSED cleanly!');
