'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const nodeIcons = {
  gate: '🚪',
  academic: '🏛️',
  hostel: '🛏️',
  dining: '☕',
  sports: '⚽',
  admin: '🏢',
  amenity: '🎭',
  health: '🏥',
  regional: '🏙️',
  parking: '🅿️',
  landmark: '🏛️',
  building: '🏫',
  junction: '🛣️'
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
  onVehicleClick,
  userRole = 'student',
  activeRide = null
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
  const hasAutoFittedPlacedRideRef = useRef(null);

  // Initialize Map with Flexible Regional Bounds
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const campusBounds = L.latLngBounds(GEETA_CAMPUS_BOUNDS);

    // Centered at Geeta University with full regional Haryana zoom capability
    const map = L.map(mapContainerRef.current, {
      zoomControl: false, // Replaced with custom recenter & zoom control
      attributionControl: true,
      minZoom: 7,         // Allows zooming out to view all of Haryana, Delhi-NCR & North India
      maxZoom: 19         // High-detail building level
    }).setView([29.3051, 76.8940], 17);

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

    // Custom Navigation Control (Zoom in, Zoom out, Recenter Campus, Full Regional Network)
    const navControl = L.control({ position: 'topleft' });
    navControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-bar campus-nav-controls');
      div.innerHTML = `
        <a href="#" role="button" title="Zoom in" class="campus-ctrl-btn" id="ctrl-zoom-in">+</a>
        <a href="#" role="button" title="Zoom out" class="campus-ctrl-btn" id="ctrl-zoom-out">&minus;</a>
        <a href="#" role="button" title="Recenter on Geeta University Campus" class="campus-ctrl-btn campus-recenter-btn" id="ctrl-recenter">🎯</a>
        <a href="#" role="button" title="View Full Haryana Regional Network" class="campus-ctrl-btn campus-regional-btn" id="ctrl-regional">🗺️</a>
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
    const handleRegional = (e) => {
      e.preventDefault();
      const nodes = state?.nodes || [];
      if (nodes.length > 0) {
        const coords = nodes.map(n => [n.lat, n.lng]);
        map.fitBounds(L.latLngBounds(coords), { padding: [30, 30], animate: true });
      } else {
        map.setView([29.35, 76.85], 9, { animate: true });
      }
    };

    setTimeout(() => {
      document.getElementById('ctrl-zoom-in')?.addEventListener('click', handleZoomIn);
      document.getElementById('ctrl-zoom-out')?.addEventListener('click', handleZoomOut);
      document.getElementById('ctrl-recenter')?.addEventListener('click', handleRecenter);
      document.getElementById('ctrl-regional')?.addEventListener('click', handleRegional);
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
      document.getElementById('ctrl-regional')?.removeEventListener('click', handleRegional);
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

    const isStudent = userRole === 'student';

    for (const edge of edges) {
      const p1 = nodeCoords.get(edge.from);
      const p2 = nodeCoords.get(edge.to);
      if (!p1 || !p2) continue;

      const isClosed = edge.closed;
      // In student view: keep background network subtle so satellite & campus buildings shine through
      const coreColor = isClosed ? '#ef4444' : (isStudent ? 'rgba(56, 189, 248, 0.22)' : '#38bdf8');
      const casingColor = isClosed ? '#7f1d1d' : (isStudent ? 'transparent' : '#0f172a');
      const weight = isClosed ? 5 : (isStudent ? 2 : 4);
      const dashArray = isClosed ? '6, 6' : null;

      // Casing polyline (outer shadow)
      let casing = edgeCasingsRef.current.get(edge.id);
      if (!casing) {
        casing = L.polyline([p1, p2], {
          color: casingColor,
          weight: weight + 4,
          opacity: isStudent ? 0.2 : 0.8
        }).addTo(map);
        edgeCasingsRef.current.set(edge.id, casing);
      } else {
        casing.setStyle({ color: casingColor, weight: weight + 4, opacity: isStudent ? 0.2 : 0.8 });
      }

      // Core polyline
      let poly = edgePolylinesRef.current.get(edge.id);
      if (!poly) {
        poly = L.polyline([p1, p2], {
          color: coreColor,
          weight,
          dashArray,
          opacity: isClosed ? 0.95 : (isStudent ? 0.35 : 0.75)
        }).addTo(map);

        poly.on('click', () => {
          if (onEdgeClick) onEdgeClick(edge);
        });

        edgePolylinesRef.current.set(edge.id, poly);
      } else {
        poly.setStyle({ color: coreColor, weight, dashArray, opacity: isClosed ? 0.95 : (isStudent ? 0.35 : 0.75) });
      }

      poly.bindTooltip(
        `<b>${edge.from} ➔ ${edge.to}</b><br>Travel: ${edge.minutes} min<br>Status: ${isClosed ? '🔴 CLOSED (Click to open)' : '🟢 OPEN (Click to close)'}`,
        { sticky: true }
      );
    }

    // 2. Campus Blueprint Nodes
    // In student view: hide ALL station icons until a ride is active/accepted, then show ONLY that ride's stations
    const bookedPickupId = activeRide?.pickup;
    const bookedDropoffId = activeRide?.dropoff;
    const isRideActive = Boolean(activeRide && ['pending_driver', 'waiting', 'assigned', 'onboard', 'completed'].includes(activeRide.status));

    const visibleNodeIds = new Set(
      isStudent
        ? (isRideActive && (bookedPickupId || bookedDropoffId) ? [bookedPickupId, bookedDropoffId].filter(Boolean) : [])
        : nodes.map(n => n.id)
    );

    // Remove hidden/unselected nodes from the map
    nodeMarkersRef.current.forEach((marker, id) => {
      if (!visibleNodeIds.has(id)) {
        marker.remove();
        nodeMarkersRef.current.delete(id);
      }
    });

    const activeNodesToRender = nodes.filter(n => visibleNodeIds.has(n.id));

    for (const node of activeNodesToRender) {
      const isBookedPickup = isRideActive && bookedPickupId === node.id;
      const isBookedDropoff = isRideActive && bookedDropoffId === node.id;
      const isBookedStation = isBookedPickup || isBookedDropoff;

      const iconChar = nodeIcons[node.type] || '📍';

      let html = '';
      let iconSize = [28, 28];
      let iconAnchor = [14, 14];

      if (isBookedStation) {
        // ONLY show station name & badge for the booked ride
        const badgeTag = isBookedPickup ? 'PICKUP' : 'DROPOFF';
        const badgeColor = isBookedPickup ? '#10b981' : '#f97316';
        const badgeGlow = isBookedPickup ? 'rgba(16,185,129,0.9)' : 'rgba(249,115,22,0.9)';

        html = `
          <div style="display:flex; flex-direction:column; align-items:center; pointer-events:auto;">
            <div class="node-pin ${node.type}" style="width:34px; height:34px; border:2.5px solid ${badgeColor}; box-shadow:0 0 18px ${badgeGlow}; transform:scale(1.2);">
              ${iconChar}
            </div>
            <div style="
              margin-top: 4px;
              background: rgba(15, 23, 42, 0.96);
              border: 1.5px solid ${badgeColor};
              border-radius: 9999px;
              padding: 2px 10px;
              color: #ffffff;
              font-size: 11px;
              font-weight: 800;
              box-shadow: 0 4px 14px rgba(0,0,0,0.8), 0 0 14px ${badgeGlow};
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 5px;
              pointer-events: none;
            ">
              <span style="background:${badgeColor}; color:#fff; font-size:9px; font-weight:900; padding:1px 6px; border-radius:9999px;">${badgeTag}</span>
              <span style="font-weight:700;">${node.name}</span>
            </div>
          </div>
        `;
        iconSize = [240, 56];
        iconAnchor = [120, 16];
      } else {
        // Normal station (Admin/Captain view only): CLEAN PIN ONLY
        html = `
          <div class="node-pin ${node.type}" title="${node.name}">
            ${iconChar}
          </div>
        `;
        iconSize = [28, 28];
        iconAnchor = [14, 14];
      }

      const customIcon = L.divIcon({
        className: 'custom-node-icon',
        html,
        iconSize,
        iconAnchor
      });

      if (!nodeMarkersRef.current.has(node.id)) {
        const marker = L.marker([node.lat, node.lng], {
          icon: customIcon,
          zIndexOffset: isBookedStation ? 1500 : 100
        }).addTo(map);

        marker.on('click', () => {
          if (onNodeClick) onNodeClick(node);
        });
        marker.bindTooltip(`<b>${node.name}</b><br>Type: ${node.type}<br><span style="color:#f97316; font-weight:700;">Click to select station</span>`, { direction: 'top' });

        nodeMarkersRef.current.set(node.id, marker);
      } else {
        const marker = nodeMarkersRef.current.get(node.id);
        marker.setLatLng([node.lat, node.lng]);
        marker.setIcon(customIcon);
        marker.setZIndexOffset(isBookedStation ? 1500 : 100);
      }
    }

    // Fit initial bounds once inside campus bounds
    if (!initialBoundsFittedRef.current && nodes.length > 0) {
      const campusBounds = L.latLngBounds(GEETA_CAMPUS_BOUNDS);
      map.fitBounds(campusBounds, { padding: [30, 30] });
      initialBoundsFittedRef.current = true;
    }

    // 3. Vehicles
    // In student view: only show assigned vehicle when ride is active/accepted; in admin/captain view: show all active fleet
    const isRideAccepted = Boolean(activeRide && ['waiting', 'assigned', 'onboard'].includes(activeRide.status));
    const visibleVehicleIds = new Set(
      isStudent
        ? (isRideAccepted && activeRide.vehicleId ? [activeRide.vehicleId] : [])
        : vehicles.map(v => v.id)
    );

    vehicleMarkersRef.current.forEach((marker, id) => {
      if (!visibleVehicleIds.has(id)) {
        marker.remove();
        vehicleMarkersRef.current.delete(id);
      }
    });

    const activeVehiclesToRender = vehicles.filter(v => visibleVehicleIds.has(v.id));

    for (const vehicle of activeVehiclesToRender) {
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

    if (userRole === 'student') {
      // REQUIREMENT: Show route ONLY when ride gets booked/requested, and route ONLY for that placed ride
      if (isRideActive && activeRide) {
        const pickupPos = nodeCoords.get(activeRide.pickup);
        const dropoffPos = nodeCoords.get(activeRide.dropoff);
        const assignedVeh = activeRide.vehicleId ? vehicles.find(v => v.id === activeRide.vehicleId && v.status !== 'broken') : null;
        const vehPos = assignedVeh?.position ? [assignedVeh.position.lat, assignedVeh.position.lng] : null;

        const ridePathCoords = [];
        if (vehPos) ridePathCoords.push(vehPos);

        if (assignedVeh?.route && assignedVeh.route.length > 0) {
          for (const nodeId of assignedVeh.route) {
            const latLng = nodeCoords.get(nodeId);
            if (latLng) ridePathCoords.push(latLng);
          }
        } else {
          if (pickupPos && activeRide.status !== 'onboard') ridePathCoords.push(pickupPos);
          if (dropoffPos) ridePathCoords.push(dropoffPos);
        }

        if (ridePathCoords.length > 1) {
          // Auto-frame map to show both ends of the booked journey
          if (hasAutoFittedPlacedRideRef.current !== activeRide.id) {
            map.fitBounds(L.latLngBounds(ridePathCoords), { padding: [40, 40], maxZoom: 16 });
            hasAutoFittedPlacedRideRef.current = activeRide.id;
          }

          // Triple-layer high-visibility glowing highlighted route ONLY for this placed ride
          const auraPoly = L.polyline(ridePathCoords, {
            color: '#f97316',
            weight: 14,
            opacity: 0.32
          }).addTo(map);

          const corePoly = L.polyline(ridePathCoords, {
            color: '#f97316',
            weight: 5.5,
            opacity: 1.0
          }).addTo(map);

          const pulsePoly = L.polyline(ridePathCoords, {
            color: '#ffffff',
            weight: 2,
            opacity: 0.95,
            dashArray: '6, 12'
          }).addTo(map);

          routePolylinesRef.current.set(`placed-ride-aura`, auraPoly);
          routePolylinesRef.current.set(`placed-ride-core`, corePoly);
          routePolylinesRef.current.set(`placed-ride-pulse`, pulsePoly);
        }
      } else {
        hasAutoFittedPlacedRideRef.current = null;
      }
      // When NO ride is booked, routes remain completely clean and empty!
    } else {
      // Admin / Fleet dispatch view: draw all vehicle routes and stop badges
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
    }

    // 5. Waiting Requests Pins
    waitingMarkersRef.current.forEach(m => m.remove());
    waitingMarkersRef.current = [];

    const waitingRequests = (userRole === 'student')
      ? (activeRide && activeRide.status === 'waiting' ? [activeRide] : [])
      : requests.filter(r => r.status === 'waiting');

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
  }, [state, onNodeClick, onEdgeClick, liveTrackVehicleId, selectedVehicleId, onVehicleClick, userRole, activeRide]);

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
