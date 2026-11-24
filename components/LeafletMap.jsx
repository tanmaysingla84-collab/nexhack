'use client';

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

// Geeta University Campus Spatial Bounds (Strict geographic limits at real university parcel)
export const GEETA_CAMPUS_BOUNDS = [
  [29.3028, 76.8912], // South-West limit
  [29.3072, 76.8966]  // North-East limit
];

// Official Campus Perimeter Coordinates aligned with the Real University Land
const CAMPUS_PERIMETER = [
  [29.3034, 76.8956], // Main Entrance & Grand Rotary (South-East)
  [29.3035, 76.8936], // South Wall
  [29.3042, 76.8924], // Gateway South-West Lawn
  [29.3056, 76.8918], // Sports Complex & Cricket Ground (West)
  [29.3066, 76.8928], // North-West Academic Corner
  [29.3068, 76.8942], // North Entrance & Admin Block (North)
  [29.3064, 76.8956], // Boys Hostel (North-East)
  [29.3048, 76.8958], // Staff Housing (East)
  [29.3034, 76.8956]  // Return to Main Entrance
];

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
  const edgeCasingsRef = useRef(new Map());
  const vehicleMarkersRef = useRef(new Map());
  const routePolylinesRef = useRef(new Map());
  const stopMarkersRef = useRef([]);
  const waitingMarkersRef = useRef([]);
  const initialBoundsFittedRef = useRef(false);

  // Initialize Map with Strict Campus Bounds
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const campusBounds = L.latLngBounds(GEETA_CAMPUS_BOUNDS);

    // Centered at Geeta University with strict spatial locking
    const map = L.map(mapContainerRef.current, {
      zoomControl: false, // Replaced with custom recenter & zoom control
      attributionControl: true,
      minZoom: 16.5,     // Hard limit: NEVER zoom out outside university campus land
      maxZoom: 19,       // High-detail building level
      maxBounds: campusBounds,
      maxBoundsViscosity: 1.0 // 100% boundary resistance: physically impossible to drag outside campus
    }).setView([29.3051, 76.8940], 17.5);

    // 1. OpenStreetMap Standard tile layer (100% free, crisp, zero watermark, zero API key)
    const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
    });

    // 2. Zero-Watermark Dark Mode Campus layer (OSM with dark filter)
    const osmDark = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'osm-dark-tiles',
      attribution: '&copy; OpenStreetMap contributors'
    });

    // 3. Esri World Imagery (High-Resolution Satellite Aerial View)
    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Geeta University Campus'
    });

    // Set OpenStreetMap Standard as default real map
    osmStandard.addTo(map);

    // Campus Boundary Property Polygon
    const perimeterPolygon = L.polygon(CAMPUS_PERIMETER, {
      color: '#e16b1f',
      weight: 2.5,
      dashArray: '6, 6',
      fillColor: '#38bdf8',
      fillOpacity: 0.05,
      interactive: false
    }).addTo(map);

    // Layer switcher control for dispatcher / rider preference
    const baseMaps = {
      '🗺️ Campus Map (OSM)': osmStandard,
      '🌙 Dark Campus (Sleek)': osmDark,
      '🛰️ Aerial Satellite View': esriSatellite
    };
    const overlayMaps = {
      '📐 Campus Property Boundary': perimeterPolygon
    };
    L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(map);

    // Custom Navigation Control (Zoom in, Zoom out, Recenter Campus)
    const navControl = L.control({ position: 'topleft' });
    navControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-bar campus-nav-controls');
      div.innerHTML = `
        <a href="#" role="button" title="Zoom in" class="campus-ctrl-btn" id="ctrl-zoom-in">+</a>
        <a href="#" role="button" title="Zoom out" class="campus-ctrl-btn" id="ctrl-zoom-out">&minus;</a>
        <a href="#" role="button" title="Recenter on Geeta University Campus" class="campus-ctrl-btn campus-recenter-btn" id="ctrl-recenter">🎯</a>
      `;
      L.DomEvent.disableClickPropagation(div);
      return div;
    };
    navControl.addTo(map);

    // Add click listeners to custom nav buttons
    const handleZoomIn = (e) => { e.preventDefault(); map.zoomIn(); };
    const handleZoomOut = (e) => { e.preventDefault(); map.zoomOut(); };
    const handleRecenter = (e) => {
      e.preventDefault();
      map.fitBounds(campusBounds, { padding: [25, 25], animate: true });
    };

    setTimeout(() => {
      document.getElementById('ctrl-zoom-in')?.addEventListener('click', handleZoomIn);
      document.getElementById('ctrl-zoom-out')?.addEventListener('click', handleZoomOut);
      document.getElementById('ctrl-recenter')?.addEventListener('click', handleRecenter);
      map.fitBounds(campusBounds, { padding: [25, 25] });
      map.invalidateSize();
    }, 150);

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      document.getElementById('ctrl-zoom-in')?.removeEventListener('click', handleZoomIn);
      document.getElementById('ctrl-zoom-out')?.removeEventListener('click', handleZoomOut);
      document.getElementById('ctrl-recenter')?.removeEventListener('click', handleRecenter);
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

    // 1. Road Edges (High contrast double-stroke casing + core)
    const currentEdgeIds = new Set(edges.map(e => e.id));
    edgePolylinesRef.current.forEach((polyline, id) => {
      if (!currentEdgeIds.has(id)) {
        polyline.remove();
        edgePolylinesRef.current.delete(id);
      }
    });
    edgeCasingsRef.current.forEach((casing, id) => {
      if (!currentEdgeIds.has(id)) {
        casing.remove();
        edgeCasingsRef.current.delete(id);
      }
    });

    for (const edge of edges) {
      const p1 = nodeCoords.get(edge.from);
      const p2 = nodeCoords.get(edge.to);
      if (!p1 || !p2) continue;

      const isClosed = edge.closed;
      const coreColor = isClosed ? '#ef4444' : '#38bdf8';
      const casingColor = isClosed ? '#7f1d1d' : '#0f172a';
      const weight = isClosed ? 5 : 4;
      const dashArray = isClosed ? '6, 6' : null;

      // Casing polyline (outer shadow)
      let casing = edgeCasingsRef.current.get(edge.id);
      if (!casing) {
        casing = L.polyline([p1, p2], {
          color: casingColor,
          weight: weight + 4,
          opacity: 0.8
        }).addTo(map);
        edgeCasingsRef.current.set(edge.id, casing);
      } else {
        casing.setStyle({ color: casingColor, weight: weight + 4 });
      }

      // Core polyline
      let poly = edgePolylinesRef.current.get(edge.id);
      if (!poly) {
        poly = L.polyline([p1, p2], {
          color: coreColor,
          weight,
          dashArray,
          opacity: isClosed ? 0.95 : 0.75
        }).addTo(map);

        poly.on('click', () => {
          if (onEdgeClick) onEdgeClick(edge);
        });

        edgePolylinesRef.current.set(edge.id, poly);
      } else {
        poly.setStyle({ color: coreColor, weight, dashArray, opacity: isClosed ? 0.95 : 0.75 });
      }

      poly.bindTooltip(
        `<b>${edge.from} ➔ ${edge.to}</b><br>Travel: ${edge.minutes} min<br>Status: ${isClosed ? '🔴 CLOSED (Click to open)' : '🟢 OPEN (Click to close)'}`,
        { sticky: true }
      );
    }

    // 2. Campus Blueprint Nodes
    for (const node of nodes) {
      if (!nodeMarkersRef.current.has(node.id)) {
        const iconChar = nodeIcons[node.type] || '📍';
        const customIcon = L.divIcon({
          className: 'custom-node-icon',
          html: `
            <div class="node-pin ${node.type}">
              ${iconChar}
            </div>
            <div class="node-label">${node.name}</div>
          `,
          iconSize: [110, 42],
          iconAnchor: [55, 16]
        });

        const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => {
          if (onNodeClick) onNodeClick(node);
        });
        marker.bindTooltip(`<b>${node.name}</b><br>Type: ${node.type}<br><span style="color:#f97316; font-weight:700;">Click to select station</span>`, { direction: 'top' });

        nodeMarkersRef.current.set(node.id, marker);
      } else {
        const marker = nodeMarkersRef.current.get(node.id);
        marker.setLatLng([node.lat, node.lng]);
      }
    }

    // Fit initial bounds once inside campus bounds
    if (!initialBoundsFittedRef.current && nodes.length > 0) {
      const campusBounds = L.latLngBounds(GEETA_CAMPUS_BOUNDS);
      map.fitBounds(campusBounds, { padding: [30, 30] });
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
      const isSelected = selectedVehicleId === vehicle.id;
      const badgeColor = isBroken ? '#ef4444' : (vehicle.color || '#f97316');
      const occText = isBroken ? 'OFFLINE' : `${vehicle.occupancy}/${vehicle.capacity}`;

      const vehicleHtml = `
        <div class="vehicle-marker ${isBroken ? 'broken' : ''} ${isTracked || isSelected ? 'tracked-live' : ''}" style="border-color: ${badgeColor}; box-shadow: 0 0 16px ${badgeColor}66;">
          <div class="v-icon">${isBroken ? '⚠️' : '🚐'}</div>
          <div class="v-id" style="background: ${badgeColor};">${vehicle.id}</div>
          <div class="v-badge">${occText}</div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-vehicle-icon',
        html: vehicleHtml,
        iconSize: [52, 52],
        iconAnchor: [26, 26]
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

      marker.bindTooltip(`<b>Shuttle ${vehicle.id}</b> • Click for Manifest<br>Seats: ${vehicle.occupancy}/${vehicle.capacity}<br>Status: ${vehicle.status.toUpperCase()}`);

      if (isTracked && vehicle.position) {
        const campusBounds = L.latLngBounds(GEETA_CAMPUS_BOUNDS);
        const currentCenter = map.getCenter();
        const dist = Math.hypot(currentCenter.lat - vehicle.position.lat, currentCenter.lng - vehicle.position.lng);
        if (dist > 0.0008 && campusBounds.contains([vehicle.position.lat, vehicle.position.lng])) {
          map.panTo([vehicle.position.lat, vehicle.position.lng], { animate: true, duration: 0.6 });
        }
      }
    }

    // 4. Vehicle Planned Routes & Numbered Stops
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
        // Glowing polyline
        const glowPoly = L.polyline(pathCoords, {
          color: vehicle.color || '#f97316',
          weight: 8,
          opacity: 0.25
        }).addTo(map);

        const corePoly = L.polyline(pathCoords, {
          color: vehicle.color || '#f97316',
          weight: 3.5,
          dashArray: '6, 8',
          opacity: 0.95
        }).addTo(map);

        routePolylinesRef.current.set(`${vehicle.id}-glow`, glowPoly);
        routePolylinesRef.current.set(`${vehicle.id}-core`, corePoly);
      }

      // Numbered stops along planned route
      vehicle.stops.forEach((stop, index) => {
        const nodePos = nodeCoords.get(stop.node);
        if (!nodePos) return;

        const isPickup = stop.type === 'pickup';
        const stopHtml = `
          <div class="stop-badge ${isPickup ? 'pickup' : 'dropoff'}" style="border: 2px solid ${vehicle.color || '#f97316'};" title="${isPickup ? 'Pickup' : 'Dropoff'} #${index + 1}">
            ${isPickup ? 'P' : 'D'}${index + 1}
          </div>
        `;

        const stopIcon = L.divIcon({
          className: 'custom-stop-icon',
          html: stopHtml,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const stopMarker = L.marker(nodePos, { icon: stopIcon, zIndexOffset: 700 }).addTo(map);
        stopMarker.bindTooltip(`<b>Stop #${index + 1}: ${isPickup ? 'PICKUP' : 'DROPOFF'}</b><br>Rider: ${stop.requestId}<br>ETA: t=${stop.plannedArrival}m`);
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
        html: `<div class="waiting-dot" title="Waiting: ${req.riderName || req.id}">🧍</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const m = L.marker(pos, { icon: waitIcon, zIndexOffset: 800 }).addTo(map);
      m.bindTooltip(`<b>Waiting Rider:</b> ${req.riderName || req.id}<br>From: ${req.pickup}<br>To: ${req.dropoff}`);
      waitingMarkersRef.current.push(m);
    }
  }, [state, onNodeClick, onEdgeClick, liveTrackVehicleId, selectedVehicleId, onVehicleClick]);

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800" style={{ minHeight: '520px' }}>
      <div id="map" ref={mapContainerRef} className="w-full h-full min-h-[520px]" style={{ minHeight: '520px', width: '100%', height: '100%' }} />

      {/* Visual Campus Boundary Lock Indicator */}
      <div className="campus-boundary-badge">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="tracking-wide">GEETA UNIVERSITY CAMPUS • STRICT BOUNDED ZONE</span>
      </div>

      {/* Floating Modern Map Legend */}
      <div className="map-legend">
        <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-700/60 mb-2">
          <span className="font-bold text-xs tracking-wider text-slate-200">GU TRANSIT NETWORK</span>
          <span className="text-[10px] text-orange-400 font-semibold animate-pulse">● LIVE TELEMETRY</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm shadow-sky-500/50"></span> Shuttle V1</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span> Shuttle V2</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50"></span> Shuttle V3</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span> Breakdown</div>
          <div className="flex items-center gap-1.5"><span className="w-3.5 h-0.5 bg-sky-400"></span> Open Road</div>
          <div className="flex items-center gap-1.5"><span className="w-3.5 h-0.5 bg-rose-500 border-b border-dashed border-rose-300"></span> Closed Road</div>
        </div>
      </div>
    </div>
  );
}
