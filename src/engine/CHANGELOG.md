# Changelog

All notable changes to the engine contract and dispatcher will be documented in this file.

## [1.0.0] - 2026-11-24
### Initial Release
- Implemented `/data/campus.json` conforming to specification (20 nodes, 31 undirected edges).
- Implemented `/src/engine/graph.js` with Dijkstra, all-pairs shortest paths, distance/path queries, road closure & reopening support.
- Implemented `/src/engine/models.js` defining Vehicle, Request, and Stop models.
- Implemented `/src/engine/dispatcher.js` with exhaustive greedy insertion heuristic and structured per-vehicle rejection reasons.
- Implemented `/src/engine/engine.js` managing live simulation tick, vehicle movement, boarding/dropoff, live disruptions (cancellations, vehicle breakdowns, road closures), and Poisson/burst demand generation.
- Implemented `/src/engine/scenario.js` and `/src/engine/index.js` for both headless test runs and browser/UI execution.
- Implemented `/tests/engine.test.js` covering correctness, constraints, disruptions, determinism, and solo vs pooled benchmarking.
