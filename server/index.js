import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSimulation, runScenario } from '../src/engine/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Load Campus Blueprint Data
const campusData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/campus.json'), 'utf-8')
);

let activeSim = createSimulation({
  campus: campusData,
  seed: 42,
  mode: 'pool',
  vehicleCount: 3,
  capacity: 4,
  maxDetourFactor: 1.5
});

let isRunning = true;
let speedMultiplier = 1;
let ticker = null;

// Initial requests
activeSim.addRequest({ pickup: 'hostel_strip_south', dropoff: 'gateway_building', passengers: 1, windowMin: 10 });
activeSim.addRequest({ pickup: 'girls_hostel_mess', dropoff: 'student_center', passengers: 1, windowMin: 10 });

function broadcastState() {
  const state = activeSim.getState();
  const events = activeSim.getEvents();
  const payload = JSON.stringify({ type: 'STATE_UPDATE', state, events });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function startTicker() {
  if (ticker) clearInterval(ticker);
  const interval = Math.max(50, Math.floor(1000 / speedMultiplier));
  ticker = setInterval(() => {
    if (isRunning) {
      activeSim.tick();
      broadcastState();
    }
  }, interval);
}

activeSim.subscribe(() => {
  broadcastState();
});

startTicker();

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'INIT',
    state: activeSim.getState(),
    events: activeSim.getEvents(),
    campus: campusData
  }));
});

// REST Endpoints
app.get('/api/state', (req, res) => {
  res.json({ state: activeSim.getState(), events: activeSim.getEvents() });
});

app.get('/api/campus', (req, res) => {
  res.json(campusData);
});

app.post('/api/requests', (req, res) => {
  const result = activeSim.addRequest(req.body);
  broadcastState();
  res.json(result);
});

app.post('/api/requests/:id/cancel', (req, res) => {
  const result = activeSim.cancelRequest(req.params.id);
  broadcastState();
  res.json(result);
});

app.post('/api/vehicles/:id/break', (req, res) => {
  activeSim.breakVehicle(req.params.id);
  broadcastState();
  res.json({ ok: true, message: `Vehicle ${req.params.id} marked broken.` });
});

app.post('/api/roads/:id/toggle', (req, res) => {
  const edge = activeSim.getState().edges.find(e => e.id === req.params.id);
  if (!edge) return res.status(404).json({ error: 'Edge not found' });
  if (edge.closed) activeSim.reopenRoad(edge.id);
  else activeSim.closeRoad(edge.id);
  broadcastState();
  res.json({ ok: true, closed: !edge.closed });
});

app.post('/api/simulation/control', (req, res) => {
  const { action, speed, seed, mode, capacity, maxDetourFactor } = req.body;
  if (action === 'pause') isRunning = false;
  if (action === 'play') isRunning = true;
  if (action === 'step') {
    activeSim.tick();
    broadcastState();
  }
  if (speed) {
    speedMultiplier = parseFloat(speed);
    startTicker();
  }
  if (action === 'reset') {
    activeSim = createSimulation({
      campus: campusData,
      seed: seed || 42,
      mode: mode || 'pool',
      vehicleCount: 3,
      capacity: capacity || 4,
      maxDetourFactor: maxDetourFactor || 1.5
    });
    activeSim.subscribe(() => broadcastState());
    broadcastState();
  }
  res.json({ ok: true, isRunning, speedMultiplier });
});

app.post('/api/comparison', (req, res) => {
  const { seed = 42, durationMin = 60 } = req.body;
  const pool = runScenario({ campus: campusData, seed, mode: 'pool', durationMin });
  const solo = runScenario({ campus: campusData, seed, mode: 'solo', durationMin });
  res.json({ pool, solo });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 [Backend Server] CampusPool Real-Time Engine listening on port ${PORT}`);
  console.log(`📡 WebSocket server streaming live on ws://localhost:${PORT}`);
});
