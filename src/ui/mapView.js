/**
 * /src/ui/mapView.js
 * Leaflet map visualization for CampusPool OS.
 * Renders nodes, edges, road closures, vehicles with occupancy badges, and planned routes.
 */

export class MapView {
  constructor(containerId = 'map', options = {}) {
    this.containerId = containerId;
    this.onNodeClick = options.onNodeClick || (() => {});
    this.onEdgeClick = options.onEdgeClick || (() => {});

    this.map = null;
    this.nodeMarkers = new Map();
    this.edgePolylines = new Map();
    this.vehicleMarkers = new Map();
    this.routePolylines = new Map();
    this.stopMarkers = [];
    this.waitingMarkers = [];

    this.initMap();
  }

  initMap() {
    // Center initially on mock campus latitude/longitude
    this.map = L.map(this.containerId, {
      zoomControl: true,
      attributionControl: false
    }).setView([37.4275, -122.1690], 16);

    // CartoDB Dark Matter / Alidade Smooth Dark tiles for sleek aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.map);
  }

  /**
   * Main render method called whenever simulation state updates.
   * State is a pure function of sim.getState().
   */
  render(state) {
    if (!state || !this.map) return;

    this.renderEdges(state.edges, state.nodes);
    this.renderNodes(state.nodes);
    this.renderVehicles(state.vehicles, state.nodes);
    this.renderRoutes(state.vehicles, state.nodes);
    this.renderWaitingRequests(state.requests, state.nodes);
  }

  renderNodes(nodes) {
    if (!nodes) return;

    const nodeIcons = {
      gate: '🚪',
      academic: '🏛️',
      hostel: '🛏️',
      dining: '☕',
      sports: '⚽',
      admin: '🏢',
      amenity: '🎭',
      health: '🏥'
    };

    for (const node of nodes) {
      if (this.nodeMarkers.has(node.id)) {
        // Already exists
        continue;
      }

      const iconChar = nodeIcons[node.type] || '📍';
      const customIcon = L.divIcon({
        className: 'custom-node-icon',
        html: `
          <div class="node-pin ${node.type}">
            ${iconChar}
          </div>
          <div class="node-label">${node.name}</div>
        `,
        iconSize: [80, 40],
        iconAnchor: [40, 15]
      });

      const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(this.map);
      marker.on('click', () => {
        this.onNodeClick(node);
      });
      marker.bindTooltip(`<b>${node.name}</b><br>Type: ${node.type}<br>ID: ${node.id}`, { direction: 'top' });

      this.nodeMarkers.set(node.id, marker);
    }

    // Fit map bounds on initial load if we haven't already
    if (!this._initialBoundsFitted && nodes.length > 0) {
      const bounds = L.latLngBounds(nodes.map(n => [n.lat, n.lng]));
      this.map.fitBounds(bounds, { padding: [50, 50] });
      this._initialBoundsFitted = true;
    }
  }

  renderEdges(edges, nodes) {
    if (!edges || !nodes) return;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    for (const edge of edges) {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) continue;

      const latlngs = [
        [fromNode.lat, fromNode.lng],
        [toNode.lat, toNode.lng]
      ];

      const isClosed = edge.closed;
      const polylineStyle = isClosed
        ? { color: '#ef4444', weight: 5, opacity: 0.9, dashArray: '6, 6' }
        : { color: '#64748b', weight: 2.5, opacity: 0.65 };

      if (this.edgePolylines.has(edge.id)) {
        const poly = this.edgePolylines.get(edge.id);
        poly.setStyle(polylineStyle);
      } else {
        const poly = L.polyline(latlngs, polylineStyle).addTo(this.map);
        poly.on('click', () => {
          this.onEdgeClick(edge);
        });
        poly.bindTooltip(() => `Road ${edge.id}: ${fromNode.name} ↔ ${toNode.name} (${edge.minutes} min)<br>${edge.closed ? '<span style="color:#ef4444;font-weight:bold;">CLOSED</span>' : 'Open (Click to close)'}`);
        this.edgePolylines.set(edge.id, poly);
      }
    }
  }

  renderVehicles(vehicles, nodes) {
    if (!vehicles) return;

    for (const veh of vehicles) {
      const isBroken = veh.status === 'broken';
      const isMoving = veh.status === 'moving';

      const customIcon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: `
          <div class="vehicle-shuttle-body ${isBroken ? 'broken' : ''}" style="background-color: ${veh.color || '#0284c7'}">
            <span>${veh.id}</span>
            <div class="vehicle-seat-pill" title="Seats: ${veh.occupancy}/${veh.capacity}">
              ${veh.occupancy}/${veh.capacity}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const latLng = [veh.position.lat, veh.position.lng];

      if (this.vehicleMarkers.has(veh.id)) {
        const marker = this.vehicleMarkers.get(veh.id);
        marker.setIcon(customIcon);
        marker.setLatLng(latLng);
      } else {
        const marker = L.marker(latLng, { icon: customIcon, zIndexOffset: 1000 }).addTo(this.map);
        marker.bindTooltip(`<b>${veh.id}</b> - Status: ${veh.status.toUpperCase()}<br>Occupancy: ${veh.occupancy}/${veh.capacity} seats<br>At: ${veh.currentNode}`);
        this.vehicleMarkers.set(veh.id, marker);
      }
    }
  }

  renderRoutes(vehicles, nodes) {
    // Clear old route polylines and stop markers
    for (const poly of this.routePolylines.values()) {
      this.map.removeLayer(poly);
    }
    this.routePolylines.clear();

    for (const marker of this.stopMarkers) {
      this.map.removeLayer(marker);
    }
    this.stopMarkers = [];

    if (!vehicles || !nodes) return;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    for (const veh of vehicles) {
      if (veh.status === 'broken' || veh.stops.length === 0) continue;

      // Construct planned route points: starting from vehicle's current position, through stops
      const latlngs = [[veh.position.lat, veh.position.lng]];
      let prevNode = nodeMap.get(veh.currentNode);

      for (let i = 0; i < veh.stops.length; i++) {
        const stop = veh.stops[i];
        const sNode = nodeMap.get(stop.node);
        if (!sNode) continue;

        latlngs.push([sNode.lat, sNode.lng]);

        // Place numbered stop badge marker
        const stopIcon = L.divIcon({
          className: 'custom-stop-marker',
          html: `
            <div class="stop-pin ${stop.type}" title="Stop ${i + 1}: ${stop.type.toUpperCase()} for ${stop.requestId}">
              ${stop.type === 'pickup' ? 'P' : 'D'}${i + 1}
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const stopMarker = L.marker([sNode.lat, sNode.lng], { icon: stopIcon, zIndexOffset: 500 }).addTo(this.map);
        stopMarker.bindTooltip(`<b>${stop.type.toUpperCase()} #${i + 1}</b><br>Rider: ${stop.requestId}<br>Location: ${sNode.name}<br>ETA: t=${stop.plannedArrival}m`);
        this.stopMarkers.push(stopMarker);
      }

      // Draw route polyline with vehicle's signature color
      const poly = L.polyline(latlngs, {
        color: veh.color || '#0284c7',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8'
      }).addTo(this.map);

      this.routePolylines.set(veh.id, poly);
    }
  }

  renderWaitingRequests(requests, nodes) {
    for (const marker of this.waitingMarkers) {
      this.map.removeLayer(marker);
    }
    this.waitingMarkers = [];

    if (!requests || !nodes) return;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const waiting = requests.filter(r => r.status === 'waiting' || r.status === 'assigned');
    for (const req of waiting) {
      const pNode = nodeMap.get(req.pickup);
      if (!pNode) continue;

      // Small pulsing circle marker at pickup
      const marker = L.circleMarker([pNode.lat, pNode.lng], {
        radius: 6,
        color: '#f59e0b',
        fillColor: '#fbbf24',
        fillOpacity: 0.8,
        weight: 2
      }).addTo(this.map);

      marker.bindTooltip(`Waiting Rider: ${req.id}<br>Pickup: ${pNode.name}<br>Status: ${req.status}`);
      this.waitingMarkers.push(marker);
    }
  }
}
