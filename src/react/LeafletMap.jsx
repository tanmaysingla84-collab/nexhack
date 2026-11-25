import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

export default function LeafletMap({
  state,
  onNodeClick,
  onEdgeClick,
  liveTrackVehicleId,
  selectedVehicleId,
  onVehicleClick
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const nodeMarkersRef = useRef(new Map());
  const edgePolylinesRef = useRef(new Map());
  const vehicleMarkersRef = useRef(new Map());
  const routePolylinesRef = useRef(new Map());
  const stopMarkersRef = useRef([]);
  const waitingMarkersRef = useRef([]);
  const initialBoundsFittedRef = useRef(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Centered at Geeta University (Naultha, Panipat, Haryana)
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([29.3084, 76.9015], 16);

    // High quality OpenStreetMap tiles (100% free, no API key, zero watermarks)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Map elements whenever state changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !state) return;

    map.invalidateSize();

    const { nodes = [], edges = [], vehicles = [], requests = [] } = state;
    const nodeCoords = new Map(nodes.map(n => [n.id, [n.lat, n.lng]]));

    // 1. Road Edges
    const currentEdgeIds = new Set(edges.map(e => e.id));
    edgePolylinesRef.current.forEach((polyline, id) => {
      if (!currentEdgeIds.has(id)) {
        polyline.remove();
        edgePolylinesRef.current.delete(id);
      }
    });

    for (const edge of edges) {
      const p1 = nodeCoords.get(edge.from);
      const p2 = nodeCoords.get(edge.to);
      if (!p1 || !p2) continue;

      let poly = edgePolylinesRef.current.get(edge.id);
      const isClosed = edge.closed;
      const color = isClosed ? '#ef4444' : '#012e55';
      const weight = isClosed ? 5 : 3.5;
      const dashArray = isClosed ? '6, 6' : null;

      if (!poly) {
        poly = L.polyline([p1, p2], {
          color,
          weight,
          dashArray,
          opacity: 0.85
        }).addTo(map);

        poly.on('click', () => {
          if (onEdgeClick) onEdgeClick(edge);
        });

        edgePolylinesRef.current.set(edge.id, poly);
      } else {
        poly.setStyle({ color, weight, dashArray });
      }

      poly.bindTooltip(
        `<b>${edge.from} ➔ ${edge.to}</b><br>Travel: ${edge.minutes} min<br>Status: ${isClosed ? '🔴 CLOSED (Click to open)' : '🟢 OPEN (Click to close)'}`,
        { sticky: true }
      );
    }

    // 2. Blueprint Nodes
    for (const node of nodes) {
      if (!nodeMarkersRef.current.has(node.id)) {
        const iconChar = nodeIcons[node.type] || '📍';
        const customIcon = L.divIcon({
          className: 'custom-node-icon',
          html: `
            <div class="node-pin ${node.type}" title="${node.name}">
              ${iconChar}
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          if (onNodeClick) onNodeClick(node);
        });
        marker.bindTooltip(`<b>${node.name}</b><br>Type: ${node.type}<br>ID: ${node.id}<br><span style="color:#e16b1f; font-weight:700;">Click to set as ride pickup</span>`, { direction: 'top' });

        nodeMarkersRef.current.set(node.id, marker);
      }
    }

    if (!initialBoundsFittedRef.current && nodes.length > 0) {
      const bounds = L.latLngBounds(nodes.map(n => [n.lat, n.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
      initialBoundsFittedRef.current = true;
    }

    // 3. Vehicles
    const currentVehicleIds = new Set(vehicles.map(v => v.id));
    vehicleMarkersRef.current.forEach((marker, id) => {
      if (!currentVehicleIds.has(id)) {
        marker.remove();
        vehicleMarkersRef.current.delete(id);
      }
    });

    for (const vehicle of vehicles) {
      const isBroken = vehicle.status === 'broken';
      const isTracked = liveTrackVehicleId === vehicle.id;
      const badgeColor = isBroken ? '#ef4444' : (vehicle.color || '#e16b1f');
      const occText = isBroken ? 'OFFLINE' : `${vehicle.occupancy}/${vehicle.capacity}`;

      const vehicleHtml = `
        <div class="vehicle-marker ${isBroken ? 'broken' : ''} ${isTracked ? 'tracked-live' : ''}" style="border-color: ${badgeColor};">
          <div class="v-icon">${isBroken ? '⚠️' : '🚐'}</div>
          <div class="v-id" style="background: ${badgeColor};">${vehicle.id}</div>
          <div class="v-badge">${occText}</div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-vehicle-icon',
        html: vehicleHtml,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      let marker = vehicleMarkersRef.current.get(vehicle.id);
      if (!marker) {
        marker = L.marker([vehicle.position.lat, vehicle.position.lng], {
          icon: customIcon,
          zIndexOffset: isTracked ? 1500 : 1000
        }).addTo(map);

        marker.on('click', () => {
          if (onVehicleClick) onVehicleClick(vehicle);
        });

        vehicleMarkersRef.current.set(vehicle.id, marker);
      } else {
        marker.setLatLng([vehicle.position.lat, vehicle.position.lng]);
        marker.setIcon(customIcon);
        marker.setZIndexOffset(isTracked ? 1500 : 1000);
      }

      marker.bindTooltip(`<b>Shuttle ${vehicle.id}</b> • Click for Manifest<br>Seats: ${vehicle.occupancy}/${vehicle.capacity}`);

      if (isTracked) {
        map.panTo([vehicle.position.lat, vehicle.position.lng], { animate: true, duration: 0.5 });
      }
    }

    // 4. Vehicle Planned Routes & Stops
    routePolylinesRef.current.forEach(poly => poly.remove());
    routePolylinesRef.current.clear();
    stopMarkersRef.current.forEach(m => m.remove());
    stopMarkersRef.current = [];

    for (const vehicle of vehicles) {
      if (vehicle.status === 'broken' || vehicle.stops.length === 0) continue;

      const pathCoords = [[vehicle.position.lat, vehicle.position.lng]];
      if (vehicle.route && vehicle.route.length > 0) {
        for (const nodeId of vehicle.route) {
          const latLng = nodeCoords.get(nodeId);
          if (latLng) pathCoords.push(latLng);
        }
      }

      if (pathCoords.length > 1) {
        const routePoly = L.polyline(pathCoords, {
          color: vehicle.color || '#e16b1f',
          weight: 4,
          dashArray: '5, 8',
          opacity: 0.85
        }).addTo(map);
        routePolylinesRef.current.set(vehicle.id, routePoly);
      }

      // Numbered stops
      vehicle.stops.forEach((stop, index) => {
        const nodePos = nodeCoords.get(stop.node);
        if (!nodePos) return;

        const isPickup = stop.type === 'pickup';
        const stopHtml = `
          <div class="stop-badge ${isPickup ? 'pickup' : 'dropoff'}" style="border: 2px solid ${vehicle.color || '#e16b1f'};">
            ${index + 1}
          </div>
        `;

        const stopIcon = L.divIcon({
          className: 'custom-stop-icon',
          html: stopHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const stopMarker = L.marker(nodePos, { icon: stopIcon, zIndexOffset: 600 }).addTo(map);
        stopMarker.bindTooltip(`Stop #${index + 1}: ${isPickup ? 'PICKUP' : 'DROPOFF'}<br>Req: ${stop.requestId}<br>ETA: t=${stop.plannedArrival}m`);
        stopMarkersRef.current.push(stopMarker);
      });
    }

    // 5. Waiting Requests Pins
    waitingMarkersRef.current.forEach(m => m.remove());
    waitingMarkersRef.current = [];

    const waitingRequests = requests.filter(r => r.status === 'waiting');
    for (const req of waitingRequests) {
      const pos = nodeCoords.get(req.pickup);
      if (!pos) continue;

      const waitIcon = L.divIcon({
        className: 'waiting-rider-icon',
        html: `<div class="waiting-dot" title="Waiting Student ${req.id}">🧍</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const m = L.marker(pos, { icon: waitIcon, zIndexOffset: 750 }).addTo(map);
      m.bindTooltip(`Waiting Student ${req.id}<br>From: ${req.pickup}<br>To: ${req.dropoff}`);
      waitingMarkersRef.current.push(m);
    }
  }, [state, onNodeClick, onEdgeClick, liveTrackVehicleId, onVehicleClick]);

  return (
    <div className="map-section">
      <div id="map" ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />

      <div className="map-legend">
        <div className="legend-title">
          <span>GU Campus Proposed Plan Transit</span>
          <span style={{ fontSize: '0.7rem', color: '#e16b1f', fontWeight: 600 }}>Click Vehicle / Node</span>
        </div>
        <div className="legend-grid">
          <div className="legend-item"><span className="legend-dot" style={{ background: '#0284c7' }}></span> Shuttle V1</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#e16b1f' }}></span> Shuttle V2</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#7c3aed' }}></span> Shuttle V3</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }}></span> Offline Shuttle</div>
          <div className="legend-item"><span className="legend-line" style={{ background: '#012e55' }}></span> Open Campus Road</div>
          <div className="legend-item"><span className="legend-line" style={{ background: '#ef4444', border: '1px dashed red' }}></span> Closed Road</div>
        </div>
      </div>
    </div>
  );
}
